/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:19:42.425Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { EvmInterfaceService } from "../application/evm/EvmInterfaceService.js";
import {
  EvmoleInterfaceProvider,
  evmLimiterAvailability,
} from "../evm/EvmoleInterfaceProvider.js";
import { CLI_COMMANDS } from "../cliCommandNames.js";
import { INSPECT_EVM_INTERFACE_CONTRACT } from "../contracts/evm/evmToolContracts.js";

/** Compose offline interface analysis without import-time I/O or dependency acquisition. */
export const createEvmInterfaceService = (
  environment: Readonly<NodeJS.ProcessEnv> = process.env,
): EvmInterfaceService =>
  new EvmInterfaceService(new EvmoleInterfaceProvider(environment));

export { evmLimiterAvailability };

/**
 * Static binding of the existing operation, command and fresh service factory.
 * The host owns injected service identity and its retryable cleanup lifetime.
 * Construction performs no acquisition, target I/O or import-time execution.
 */
export const evmInterfaceModule = {
  contract: INSPECT_EVM_INTERFACE_CONTRACT,
  cliCommand: CLI_COMMANDS.inspectEvmInterface,
  create: createEvmInterfaceService,
} as const;
