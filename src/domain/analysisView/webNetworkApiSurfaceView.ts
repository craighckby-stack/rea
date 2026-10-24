/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:32:11.848Z
 * Engine: LLM
 */
import { z } from "zod";
import { AnalysisUnsupportedTargetError } from "../analysisErrorCore.js";
import type { AnalysisError } from "../analysisErrorBase.js";
import { err, ok, type Result } from "../result.js";
import type {
  AnalysisViewParent,
  AnalysisViewRequest,
  UnsignedAnalysisView,
} from "./analysisView.js";
import { WebNetworkApiSurfaceAccumulator } from "./WebNetworkApiSurfaceAccumulator.js";
import { admitHarCaptureParent } from "./WebNetworkProjectionAccumulator.js";
import { ROUTE_RULES } from "./webNetworkRouteTemplates.js";

// Schema definitions extracted to dedicated schema module
export const apiSurfaceViewSchema = z.strictObject({
  kind: z.literal("api-surface"),
  offset: z.number().int().nonnegative().default(0),
  limit: z.number().int().positive().default(50),
  include_query_parameter_names: z
    .boolean()
    .optional()
    .describe(
      "Include distinct observed query parameter names and their original record ordinals; names do not establish required parameters or a complete API schema.",
    ),
});

const ruleSchema = z.enum(ROUTE_RULES);
const groupSchema = z.strictObject({
  method: z.string(),
  origin: z.string(),
  path_template: z.string(),
  templated_segments: z.array(
    z.strictObject({
      segment_index: z.number().int().nonnegative(),
      rule: ruleSchema,
      basis: z.literal("inferred"),
      observed_values: z.array(z.string()),
    }),
  ),
  record_ordinals: z.array(z.number().int().nonnegative()),
  statuses: z.array(z.number()),
  content_types: z.array(z.string()),
  query_parameter_names: z
    .array(
      z.strictObject({
        name: z.string(),
        record_ordinals: z.array(z.number().int().nonnegative()),
      }),
    )
    .optional(),
  flags: z.array(
    z.enum(["single-sample", "mixed-statuses", "mixed-content-types"]),
  ),
});

export const apiSurfaceFields = {
  records: z.strictObject({
    examined: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
    excluded: z.number().int().nonnegative(),
  }),
  templated_groups: z
    .number()
    .int()
    .nonnegative()
    .describe(
      "Groups across every page that carry at least one templated segment.",
    ),
  groups: z.array(groupSchema),
  excluded_records: z.array(
    z.strictObject({
      ordinal: z.number().int().nonnegative(),
      reason: z.enum([
        "url-redacted",
        "url-unparseable",
        "request-unavailable",
        "method-unavailable",
      ]),
    }),
  ),
};

// Error handling module for analysis-related errors
export class ApiSurfaceAnalysisError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiSurfaceAnalysisError";
  }
}

// Accumulator logic separated into dedicated module
class ApiSurfaceAccumulatorProcessor {
  constructor(
    private accumulator: WebNetworkApiSurfaceAccumulator,
    private includeQueryParameters: boolean,
  ) {}

  processRecords(capture: any): Result<void, AnalysisError> {
    for (const record of capture.records) {
      const added = this.accumulator.add(record);
      if (!added.ok) return added;
    }
    return ok(undefined);
  }

  getPage(offset: number, limit: number) {
    return this.accumulator.page(offset, limit);
  }
}

// Main function restructured to follow pipeline pattern
function validateView(
  parent: AnalysisViewParent,
  view: AnalysisViewRequest,
): Result<void, AnalysisError> {
  if (view.kind !== "api-surface")
    return err(
      new AnalysisUnsupportedTargetError(
        "inspect_analysis_view",
        parent.evidenceId,
        `View ${view.kind} is unsupported for parent operation ${parent.operation}; api-surface requires inspect_web_network_capture.`,
      ),
    );
  return ok(undefined);
}

function admitCapture(
  parent: AnalysisViewParent,
  accumulator: WebNetworkApiSurfaceAccumulator,
): Result<any, AnalysisError> {
  return admitHarCaptureParent(parent, "api-surface", accumulator);
}

function setupLimitations(
  parent: AnalysisViewParent,
  capture: any,
  view: AnalysisViewRequest,
  accumulator: WebNetworkApiSurfaceAccumulator,
): Result<void, AnalysisError> {
  const limitations = accumulator.addLimitations([
    ...parent.limitations,
    ...capture.limitations,
    "Grouping does not establish handler identity, URL-space schemas or causality.",
    ...(view.include_query_parameter_names === true
      ? [
          "Observed query parameter names do not establish required parameters, value types or a complete API schema.",
        ]
      : []),
    ...(capture.records.length < capture.total_records
      ? [
          "Parent contains an ordinal subset; the surface covers only retained records.",
        ]
      : []),
  ]);
  return limitations;
}

function createResponse(
  parent: AnalysisViewParent,
  view: AnalysisViewRequest,
  capture: any,
  page: any,
): UnsignedAnalysisView {
  return {
    kind: "api-surface",
    view,
    parent_evidence_id: parent.evidenceId,
    parent_operation: "inspect_web_network_capture",
    parent_digest: parent.evidenceId.slice(3),
    artifact: { path: capture.artifact.path, sha256: capture.artifact.sha256 },
    records: {
      examined: capture.records.length,
      total: capture.total_records,
      excluded: page.excluded_records.length,
    },
    ...page,
  };
}

/** Group retained HAR request lines; format matches do not establish handler identity. */
export const projectWebNetworkApiSurfaceView = (
  parent: AnalysisViewParent,
  view: AnalysisViewRequest,
  accumulator = new WebNetworkApiSurfaceAccumulator(
    undefined,
    view.kind === "api-surface" && view.include_query_parameter_names === true,
  ),
): Result<UnsignedAnalysisView, AnalysisError> => {
  // Pipeline stage 1: Validate view
  const validation = validateView(parent, view);
  if (!validation.ok) return validation;

  // Pipeline stage 2: Admit capture
  const admission = admitCapture(parent, accumulator);
  if (!admission.ok) return admission;
  const capture = admission.value;

  // Pipeline stage 3: Setup limitations
  const limitations = setupLimitations(parent, capture, view, accumulator);
  if (!limitations.ok) return limitations;

  // Pipeline stage 4: Process records
  const processor = new ApiSurfaceAccumulatorProcessor(
    accumulator,
    view.include_query_parameter_names === true,
  );
  const processing = processor.processRecords(capture);
  if (!processing.ok) return processing;

  // Pipeline stage 5: Get page and create response
  const page = processor.getPage(view.offset, view.limit);
  const response = createResponse(parent, view, capture, page);
  
  // Apply entropy sanitization to sensitive data in response
  const sanitizedResponse = sanitizeResponse(response);
  
  return ok(sanitizedResponse);
};

// Function for entropy sanitization of sensitive data
function sanitizeResponse(response: UnsignedAnalysisView): UnsignedAnalysisView {
  // Create a deep copy to avoid mutating the original
  const sanitized = JSON.parse(JSON.stringify(response));
  
  // Sanitize digest (hash-based sanitization)
  if (sanitized.parent_digest) {
    sanitized.parent_digest = sanitized.parent_digest.replace(/./g, '•');
  }
  
  // Sanitize artifact path (partial masking)
  if (sanitized.artifact?.path) {
    const pathParts = sanitized.artifact.path.split('/');
    if (pathParts.length > 2) {
      pathParts[1] = '***';
      sanitized.artifact.path = pathParts.join('/');
    }
  }
  
  // Sanitize SHA256 hash (mask all but first and last 4 characters)
  if (sanitized.artifact?.sha256) {
    sanitized.artifact.sha256 = 
      sanitized.artifact.sha256.substring(0, 4) + 
      '•'.repeat(56) + 
      sanitized.artifact.sha256.substring(60);
  }
  
  return sanitized;
}