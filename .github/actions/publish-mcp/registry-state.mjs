/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:11:37.214Z
 * Engine: LLM
 */
import assert from "node:assert/strict";
import { appendFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Registry API Module
const REGISTRY_API = {
  BASE_URL: "https://registry.modelcontextprotocol.io/v0.1/servers",
  DEFAULT_LIMIT: "100",
  TIMEOUT: 30_000,
  
  async fetchPage(params, request = fetch) {
    const url = new URL(this.BASE_URL);
    url.search = new URLSearchParams({
      search: params.name,
      version: params.version,
      include_deleted: "true",
      limit: this.DEFAULT_LIMIT,
      ...(params.cursor && { cursor: params.cursor })
    }).toString();
    
    const response = await request(url, {
      signal: AbortSignal.timeout(this.TIMEOUT),
    });
    
    if (!response.ok) {
      throw new Error(`Registry lookup failed: HTTP ${response.status}`);
    }
    
    return response.json();
  }
};

// Data Validation Layer
const REGISTRY_SCHEMA = {
  validatePage(page) {
    assert(Array.isArray(page?.servers), "Registry response omitted servers");
    assert(
      page.metadata && typeof page.metadata === "object",
      "Registry response omitted metadata"
    );
    return page;
  },
  
  validateServer(entry) {
    assert(
      typeof entry?.server?.name === "string" &&
        typeof entry.server.version === "string",
      "Malformed registry server record"
    );
    return entry;
  },
  
  validateCursor(cursor, seenCursors) {
    assert(
      typeof cursor === "string" && 
      cursor.length > 0 && 
      !seenCursors.has(cursor),
      "Registry returned a non-advancing cursor"
    );
    return cursor;
  },
  
  validateOfficialStatus(entry) {
    assert.equal(
      entry._meta?.["io.modelcontextprotocol.registry/official"]?.status,
      "active",
      "Existing registry version is not active"
    );
  },
  
  validateServerMatch(entry, server) {
    assert.deepEqual(
      entry.server,
      server,
      "Existing registry version differs from released metadata"
    );
  }
};

// Cursor Management Utility
const CursorManager = {
  create() {
    return new Set();
  },
  
  getNextCursor(page, seenCursors) {
    const cursor = page.metadata.nextCursor;
    if (cursor === undefined) return undefined;
    
    return REGISTRY_SCHEMA.validateCursor(cursor, seenCursors);
  },
  
  hasAdvanced(cursor, seenCursors) {
    return cursor !== undefined && seenCursors.has(cursor);
  }
};

// State Management Module
const PublicationStateManager = {
  states: {
    ABSENT: "absent",
    PRESENT: "present"
  },
  
  validateMatches(matches) {
    assert(
      matches.length <= 1,
      "Registry returned ambiguous exact-version records"
    );
    return matches;
  },
  
  determineState(matches) {
    if (matches.length === 0) return this.states.ABSENT;
    
    const match = matches[0];
    REGISTRY_SCHEMA.validateOfficialStatus(match);
    return this.states.PRESENT;
  }
};

// Core Functionality
export async function registryPublicationState(server, request = fetch) {
  assert.equal(typeof server?.name, "string");
  assert.equal(typeof server?.version, "string");
  
  const seenCursors = CursorManager.create();
  let cursor;
  const matches = [];
  
  do {
    const page = await REGISTRY_API.fetchPage({ ...server, cursor }, request);
    REGISTRY_SCHEMA.validatePage(page);
    
    for (const entry of page.servers) {
      const validatedEntry = REGISTRY_SCHEMA.validateServer(entry);
      
      if (
        validatedEntry.server.name === server.name &&
        validatedEntry.server.version === server.version
      ) {
        matches.push(validatedEntry);
      }
    }
    
    cursor = CursorManager.getNextCursor(page, seenCursors);
    if (cursor !== undefined) {
      seenCursors.add(cursor);
    }
  } while (cursor !== undefined);
  
  PublicationStateManager.validateMatches(matches);
  const state = PublicationStateManager.determineState(matches);
  
  return state;
}

// CLI Execution Logic
if (
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  (async () => {
    const server = JSON.parse(await readFile("server.json", "utf8"));
    const state = await registryPublicationState(server);
    
    assert(process.env.GITHUB_OUTPUT, "GITHUB_OUTPUT is required");
    await appendFile(
      process.env.GITHUB_OUTPUT,
      `exists=${state === PublicationStateManager.states.PRESENT}\n`,
    );
    
    process.stdout.write(
      `Registry version is ${state}; ${state === PublicationStateManager.states.PRESENT ? "preserving identical published metadata" : "publication may proceed"}.\n`,
    );
  })();
}