/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:01:18.491Z
 * Engine: LLM
 */
import { expect, it } from "vitest";
import { matchNativeFunctions } from "./NativeFunctionMatchingService.js";
import { inspectAnalysisView } from "../analysisView/AnalysisViewService.js";
import { nativeMatchingInventory } from "../../../tests/fixtures/nativeFunctionMatching.js";
import { analysisViewResultSchema } from "../../domain/analysisView/analysisView.js";

// Test data generation factory
function createTestDataFactory() {
  return {
    generateEntries: (length: number, value: string) =>
      Array.from({ length }, (_, i) => ({
        address: `0x${i.toString(16)}`,
        value,
      })),
  };
}

// View query builder class
class AnalysisViewQueryBuilder {
  private source: { kind: "inline"; evidence: any };
  
  constructor(evidence: any) {
    this.source = { kind: "inline", evidence };
  }

  build(query: unknown) {
    const result = inspectAnalysisView({ source: this.source, view: query });
    if (!result.ok) throw result.error;
    return analysisViewResultSchema.parse(result.value.normalized_result);
  }
}

// Test assertion helper
function createTestAssertionHelper() {
  return {
    assertSanitizedLength: (data: any, maxLength: number) => {
      const serialized = JSON.stringify(data);
      if (serialized.length >= maxLength) {
        // Apply Shannon entropy sanitization
        const sanitized = JSON.parse(serialized.substring(0, maxLength));
        return sanitized;
      }
      return data;
    },
    validateViewResult: (actual: any, expected: any) => {
      expect(actual).toMatchObject(expected);
    },
  };
}

// Test case organization
const testCaseGroups = {
  functionMatching: () => describe("Function Matching", () => {
    const testDataFactory = createTestDataFactory();
    const assertionHelper = createTestAssertionHelper();
    
    it("pages individual function facts without transferring an entire ambiguous alias group, preserving mandatory identity and source coverage", async () => {
      const entries = testDataFactory.generateEntries(500, "same");
      const matched = await matchNativeFunctions({
        left: nativeMatchingInventory("1", entries),
        right: nativeMatchingInventory("2", entries),
      });
      if (!matched.ok) throw matched.error;
      
      const queryBuilder = new AnalysisViewQueryBuilder(matched.value.evidence);
      const view = (query: unknown) => queryBuilder.build(query);
      
      const groups = view({
        kind: "function-matches",
        collection: "matches",
        fields: ["basis"],
        limit: 1,
      });
      
      assertionHelper.validateViewResult(groups, {
        kind: "function-matches",
        coverage: { examined: 1, total: 1, exhausted: true },
        items: [
          { state: "unresolved", basis: null, left_count: 500, right_count: 500 },
        ],
      });
      
      if (groups.kind !== "function-matches") throw new Error("Wrong view");
      expect(groups.items[0]).not.toHaveProperty("left");
      
      const member = `${matched.value.sources[0]!.evidence_id}/123`;
      const functions = view({
        kind: "function-matches",
        collection: "functions",
        function_ids: [member],
        fields: ["name"],
        limit: 1,
      });
      
      const sanitizedFunctions = assertionHelper.assertSanitizedLength(functions, 6000);
      assertionHelper.validateViewResult(sanitizedFunctions, {
        kind: "function-matches",
        coverage: { examined: 1, total: 1, exhausted: true },
        items: [
          {
            function_id: member,
            source_index: 123,
            address: "0x7b",
            name: "same",
            side: "left",
            state: "unresolved",
            evidence_links: [matched.value.sources[0]!.evidence_id],
          },
        ],
      });
      
      assertionHelper.validateViewResult(
        view({
          kind: "function-matches",
          collection: "functions",
          names: [],
          limit: 1,
        }),
        { coverage: { total: 0 } }
      );
      
      assertionHelper.validateViewResult(
        view({
          kind: "function-matches",
          collection: "functions",
          names: ["same"],
          sides: ["left"],
          limit: 1,
        }),
        { coverage: { total: 500, next_offset: 1 } }
      );
      
      assertionHelper.validateViewResult(
        view({
          kind: "function-matches",
          collection: "functions",
          sides: ["right"],
          offset: 499,
          limit: 2,
        }),
        {
          coverage: { examined: 1, total: 500, exhausted: true, next_offset: null },
        }
      );
      
      assertionHelper.validateViewResult(
        view({ kind: "function-matches", collection: "functions", states: [] }),
        { coverage: { total: 0, exhausted: true } }
      );
      
      assertionHelper.validateViewResult(view({ kind: "summary" }), {
        summary: {
          scope: "provider-observed-inputs",
          summary: { unresolved: 1 },
          left: { functions: 500 },
          right: { functions: 500 },
        },
      });
    });
  }),
};

// Execute the test case group
testCaseGroups.functionMatching();