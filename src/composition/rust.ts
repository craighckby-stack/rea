/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:21:37.528Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { RustBinaryService } from "../application/rust/RustBinaryService.js";
import { RustBinaryProvider } from "../rust/RustBinaryProvider.js";

/** Compose bundled offline inspection without a Rust toolchain or any child process. */
export const createRustBinaryService = (): RustBinaryService =>
  new RustBinaryService(new RustBinaryProvider());
