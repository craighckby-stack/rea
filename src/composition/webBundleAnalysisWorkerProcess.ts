/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:21:49.013Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { analyzeCapturedWebScript } from "../domain/webBundleAnalyzer.js";
import {
  serveWebBundleAnalysisWorker,
  type WebBundleScriptAnalyzer,
} from "../browser/WebBundleAnalysisWorkerServer.js";

const analyze: WebBundleScriptAnalyzer = (script) =>
  analyzeCapturedWebScript(script);

try {
  await serveWebBundleAnalysisWorker(analyze);
} catch (cause: unknown) {
  process.stderr.write(
    `${cause instanceof Error ? cause.message : String(cause)}\n`,
  );
  process.exitCode = 1;
}
