/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:01:59.666Z
 * Engine: LLM
 */
import { createHash } from "node:crypto";
import type { z } from "zod";
import type { ArtifactResourceScope } from "../../artifacts/ArtifactResourceScope.js";
import type { EvidenceBundle } from "../../domain/evidenceBundle.js";
import { immutableEvidence, type Evidence } from "../../domain/evidence.js";
import {
  EvidenceIntegrityError,
  EvidenceReferenceError,
} from "../../domain/evidenceErrors.js";
import { digestCanonicalValue } from "../../domain/canonicalDigest.js";
import { retainedEvidenceReferenceSchema } from "../../domain/evidenceReference.js";
import type { matchNativeFunctionsInputSchema } from "../../contracts/native/functionMatchingContracts.js";
import { readImmutableEvidenceBundle } from "../EvidenceBundleFiles.js";
import type { EvidenceLookup } from "../EvidenceInputResolver.js";
import type { NativeMatchingAdmission } from "./NativeMatchingAdmission.js";

type Request = z.output<typeof matchNativeFunctionsInputSchema>;
interface SourceEntry {
  readonly file: number;
  readonly links: readonly string[];
}
interface Options {
  readonly input: Request;
  readonly paths: readonly string[];
  readonly resources: ArtifactResourceScope;
  readonly admission: NativeMatchingAdmission;
}

// Evidence Reference Handler
const reference = (evidence_id: string) => ({
  kind: "retained-evidence" as const,
  evidence_id,
});

// ID and Link Sanitization
const ownId = (value: string): string =>
  Buffer.from(value, "ascii").toString("ascii");

// Evidence Bundle Snapshot Utility
const recordSnapshot = async (
  bundle: EvidenceBundle,
  admission: NativeMatchingAdmission,
): Promise<string> => {
  const hash = createHash("sha256");
  for (const record of bundle.records) {
    await admission.checkpoint();
    hash
      .update(record.evidence_id)
      .update(digestCanonicalValue(record.subject));
  }
  return hash.digest("hex");
};

// Evidence Reference Parser
const parseEvidenceReferences = (
  input: Request,
): { rootIds: string[]; inlineRecords: Map<string, Evidence> } => {
  const rootIds: string[] = [];
  const inlineRecords = new Map<string, Evidence>();
  
  for (const value of [
    input.left,
    input.right,
    ...input.left_observations,
    ...input.right_observations,
  ]) {
    const parsed = retainedEvidenceReferenceSchema.safeParse(value);
    if (parsed.success) {
      rootIds.push(parsed.data.evidence_id);
    } else {
      const record = immutableEvidence(value);
      rootIds.push(record.evidence_id);
      inlineRecords.set(record.evidence_id, record);
    }
  }
  
  return { rootIds, inlineRecords };
};

// Evidence Index Builder
const buildEvidenceIndex = async (
  paths: readonly string[],
  admission: NativeMatchingAdmission,
): Promise<{
  index: Map<string, SourceEntry>;
  snapshots: string[];
  lastBundle: { file: number; bundle: EvidenceBundle } | undefined;
}> => {
  const index = new Map<string, SourceEntry>();
  const snapshots: string[] = [];
  let lastBundle: { file: number; bundle: EvidenceBundle } | undefined;
  
  for (let file = 0; file < paths.length; file++) {
    lastBundle = undefined;
    const loaded = await readImmutableEvidenceBundle(
      paths[file]!,
      admission.signal,
      undefined,
    );
    if (!loaded.ok) throw loaded.error;
    
    snapshots.push(await recordSnapshot(loaded.value, admission));
    
    for (const record of loaded.value.records) {
      await admission.checkpoint(
        256 +
          4 *
            (record.evidence_id.length +
              record.evidence_links.reduce((sum, id) => sum + id.length, 0)),
      );
      if (!index.has(record.evidence_id))
        index.set(ownId(record.evidence_id), {
          file,
          links: record.evidence_links.map(ownId),
        });
    }
    
    lastBundle = { file, bundle: loaded.value };
  }
  
  return { index, snapshots, lastBundle };
};

// Evidence Closure Resolver
const resolveEvidenceClosure = (
  rootIds: string[],
  index: Map<string, SourceEntry>,
): { needed: Set<string>; files: Set<number> } => {
  const needed = new Set<string>(rootIds);
  const files = new Set<number>();
  
  for (const id of needed) {
    const entry = index.get(id);
    if (entry === undefined)
      throw new EvidenceReferenceError(
        id,
        "missing",
        "Complete Evidence closure in the supplied bundles or inline inputs",
        null,
      );
    if (entry.file >= 0) files.add(entry.file);
    for (const linked of entry.links) needed.add(linked);
  }
  
  return { needed, files };
};

// Evidence Retainer
const retainEvidenceRecords = async (
  bundle: EvidenceBundle,
  file: number,
  needed: Set<string>,
  index: Map<string, SourceEntry>,
  admission: NativeMatchingAdmission,
  records: Map<string, Evidence>,
): Promise<void> => {
  for (const record of bundle.records)
    if (
      needed.has(record.evidence_id) &&
      index.get(record.evidence_id)?.file === file
    ) {
      await admission.admit(record);
      records.set(record.evidence_id, record);
    }
};

// Evidence Bundle Loader
const loadEvidenceBundles = async (
  paths: readonly string[],
  files: Set<number>,
  snapshots: string[],
  lastBundle: { file: number; bundle: EvidenceBundle } | undefined,
  needed: Set<string>,
  index: Map<string, SourceEntry>,
  admission: NativeMatchingAdmission,
): Promise<Map<string, Evidence>> => {
  const records = new Map<string, Evidence>();
  
  if (lastBundle !== undefined && files.has(lastBundle.file)) {
    await retainEvidenceRecords(
      lastBundle.bundle,
      lastBundle.file,
      needed,
      index,
      admission,
      records,
    );
    files.delete(lastBundle.file);
  }
  
  for (const file of files) {
    const loaded = await readImmutableEvidenceBundle(
      paths[file]!,
      admission.signal,
      undefined,
    );
    if (!loaded.ok) throw loaded.error;
    
    if ((await recordSnapshot(loaded.value, admission)) !== snapshots[file])
      throw new EvidenceIntegrityError(
        `Evidence bundle records changed during closure lookup: ${paths[file]}`,
      );
    
    await retainEvidenceRecords(
      loaded.value,
      file,
      needed,
      index,
      admission,
      records,
    );
  }
  
  return records;
};

/** Index only graph metadata; keep at most the last whole bundle between passes. */
export const loadNativeMatchingBundleSources = async ({
  input,
  paths,
  resources,
  admission,
}: Options): Promise<{ input: Request; lookup: EvidenceLookup }> => {
  // Parse evidence references and build initial records
  const { rootIds, inlineRecords } = parseEvidenceReferences(input);
  
  // Build evidence index from bundle files
  const { index, snapshots, lastBundle } = await buildEvidenceIndex(
    paths,
    admission,
  );
  
  // Resolve evidence closure
  const { needed, files } = resolveEvidenceClosure(rootIds, index);
  
  // Load and retain needed evidence records
  const records = await loadEvidenceBundles(
    paths,
    files,
    snapshots,
    lastBundle,
    needed,
    index,
    admission,
  );
  
  // Add inline records to the final records map
  for (const [id, record] of inlineRecords) {
    records.set(id, record);
  }
  
  // Prepare final input with references
  const left = rootIds[0]!,
    right = rootIds[1]!;
  const split = 2 + input.left_observations.length;
  
  return {
    input: {
      ...input,
      left: reference(left),
      right: reference(right),
      left_observations: rootIds.slice(2, split).map(reference),
      right_observations: rootIds.slice(split).map(reference),
    },
    lookup: (id) => records.get(id),
  };
};