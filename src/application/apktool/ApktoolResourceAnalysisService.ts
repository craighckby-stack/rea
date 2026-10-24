/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:49:34.925Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import type { ApktoolResourceAnalysisPort } from "./ApktoolResourceAnalysisPort.js";
import type { ExecutionOptions } from "../AnalysisProvider.js";
import {
  apktoolRequestSchema,
  type ApktoolOperation,
} from "../../domain/apktool/apktoolResourceAnalysis.js";
import type { AnalysisError } from "../../domain/analysisErrorBase.js";
import type { Evidence } from "../../domain/evidence.js";
import type { Result } from "../../domain/result.js";
import { executeProviderOperation } from "../ProviderOperationExecution.js";

/** Shared CLI/MCP admission, execution, and Evidence composition for Apktool. */
export class ApktoolResourceAnalysisService {
  constructor(readonly provider: ApktoolResourceAnalysisPort) {}

  /** Run one caller-selected Apktool request and retain target identity inline. */
  async execute(
    operation: ApktoolOperation,
    input: unknown,
    options?: ExecutionOptions,
  ): Promise<Result<Evidence, AnalysisError>> {
    return executeProviderOperation(
      operation,
      input,
      options,
      apktoolRequestSchema,
      this.provider,
      "observed",
    );
  }
}
