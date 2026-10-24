/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:16:08.589Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { AnalysisInputError } from "../domain/analysisErrorCore.js";

/** Preserve a CLI selector supplied positionally or through its named option. */
export const resolveCliAnalysisSelector = (
  positional: string | undefined,
  named: string | undefined,
  option: string,
  operation: string,
): string => {
  if (positional !== undefined && named !== undefined && positional !== named)
    throw new AnalysisInputError(operation, undefined, [
      {
        path: [option],
        reason: "invalid_value",
        message: `The positional selector and --${option} select different objects; supply one selector.`,
      },
    ]);
  const selected = named ?? positional;
  if (selected === undefined)
    throw new AnalysisInputError(operation, undefined, [
      {
        path: [option],
        reason: "missing_argument",
        message: `Supply a positional selector or --${option}=<value>. Use the named option for values beginning with a dash.`,
        expected: "string",
      },
    ]);
  return selected;
};
