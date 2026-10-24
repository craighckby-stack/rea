/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:20:19.193Z
 * Engine: LLM
 */
import type { JebAnalysisPort } from "../application/jeb/JebAnalysisPort.js";
import { parseJebMcpTimeoutMs } from "../config/environment.js";
import { ConfigurationError } from "../domain/configurationErrors.js";
import { AnalysisInputError } from "../domain/analysisErrorCore.js";
import { err } from "../domain/result.js";
import type { JebMcpConnectionFactory } from "../jeb/JebMcpConnection.js";
import { JebProvider } from "../jeb/JebProvider.js";

// Configuration parsing module
class JebConfigurationParser {
  static parse(
    environment: Readonly<Record<string, string | undefined>>,
  ): { requestTimeout: { ok: true; value?: number } | { ok: false; error: ConfigurationError } } {
    const requestTimeout = parseJebMcpTimeoutMs(environment.REA_JEB_MCP_TIMEOUT_MS);
    return requestTimeout;
  }
}

// Provider creation module
class JebProviderFactory {
  static create(
    environment: Readonly<Record<string, string | undefined>>,
    connectionFactory?: JebMcpConnectionFactory,
    requestTimeout?: number,
  ): JebAnalysisPort {
    try {
      return new JebProvider({
        environment,
        ...(requestTimeout === undefined
          ? {}
          : { requestTimeoutMs: requestTimeout }),
        ...(connectionFactory === undefined ? {} : { connectionFactory }),
      });
    } catch (cause: unknown) {
      if (!(cause instanceof AnalysisInputError)) throw cause;
      const constraint =
        typeof cause.cause === "string" ? cause.cause : cause.message;
      throw new ConfigurationError("Invalid REA environment configuration", {
        cause,
        settings: [{ setting: "REA_JEB_MCP_URL", constraint }],
      });
    }
  }
}

// Error handling module
class JebErrorHandler {
  static createUnconfiguredProvider(error: ConfigurationError): JebAnalysisPort {
    const setting = error.settings[0]?.setting ?? "REA_JEB_MCP_URL";
    return {
      inspectAvailability: () =>
        Promise.resolve({
          status: "unavailable",
          code: "not_configured",
          reason: `${setting} is invalid: ${error.settings[0]?.constraint ?? error.message}`,
          diagnostics: { setting },
        }),
      close: () => Promise.resolve(),
      execute: () => Promise.resolve(err(error)),
    };
  }
}

/**
 * Construct one JEB provider bound to the caller-selected MCP endpoint. An
 * unusable endpoint makes only JEB unavailable; every other CLI command and
 * MCP tool is composed alongside it.
 */
export const createJebAnalysisProvider = (
  environment: Readonly<Record<string, string | undefined>> = process.env,
  connectionFactory?: JebMcpConnectionFactory,
): JebAnalysisPort => {
  const requestTimeout = JebConfigurationParser.parse(environment);
  if (!requestTimeout.ok) return JebErrorHandler.createUnconfiguredProvider(requestTimeout.error);
  
  return JebProviderFactory.create(
    environment,
    connectionFactory,
    requestTimeout.value
  );
};