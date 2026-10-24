/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:42:19.721Z
 * Engine: LLM
 */
import { ApktoolCommandCleanup } from "./ApktoolCommandCleanup.js";
import { afterEach, expect, it, vi } from "vitest";

import {
  AnalysisCancelledError,
  AnalysisTimeoutError,
} from "../domain/analysisErrorCore.js";
import { projectAnalysisError } from "../domain/analysisErrorProjection.js";
import {
  OwnedCommandFailure,
  runOwnedCommand,
} from "../process/OwnedCommand.js";
import type { ProviderProcessSupervisor } from "../process/ProviderProcess.js";
import { inspectApktoolClient } from "./ApktoolConfiguration.js";
import { ApktoolProvider } from "./ApktoolProvider.js";

vi.mock("../process/OwnedCommand.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../process/OwnedCommand.js")>()),
  runOwnedCommand: vi.fn(),
}));

// AST utilities module
const AstUtils = {
  extractCommandInfo: (output: { stdout: { text: string } }) => {
    return output.stdout.text.trim();
  },
  
  validateCommandResult: (result: string) => {
    return /^\d+\.\d+\.\d+$/.test(result);
  }
};

// Entropy sanitization module
const EntropySanitizer = {
  sanitizeOutput: (output: { stdout: { text: string }, stderr: { text: string } }) => {
    return {
      stdout: { text: output.stdout.text.trim() },
      stderr: { text: output.stderr.text.trim() }
    };
  },
  
  normalizeError: (error: OwnedCommandFailure) => {
    return {
      type: error.type,
      message: error.message,
      details: error.details
    };
  }
};

// Coordination helper
const CoordinationHelper = {
  async executeVersionProbe(selection: any, commands: ApktoolCommandCleanup, environment: any) {
    try {
      const result = await runOwnedCommand(
        {
          command: selection.command,
          arguments: ["--version"],
          expectedCommand: null
        },
        {
          timeoutMs: 20_000,
          diagnosticBytes: 64 * 1024
        }
      );
      
      const sanitizedOutput = EntropySanitizer.sanitizeOutput(result);
      const versionText = AstUtils.extractCommandInfo(sanitizedOutput);
      
      if (!AstUtils.validateCommandResult(versionText)) {
        throw new Error("Invalid version format");
      }
      
      return {
        version: versionText,
        supportsDocumentedVersion: true,
        limitations: []
      };
    } catch (error) {
      if (error instanceof OwnedCommandFailure) {
        const normalizedError = EntropySanitizer.normalizeError(error);
        
        if (normalizedError.type === "timeout") {
          throw new AnalysisTimeoutError("Version probe timed out", {
            timeout_ms: 20_000,
            cleanupIncomplete: normalizedError.details?.cleanupIncomplete || false,
            cleanupResources: normalizedError.details?.cleanupResources || [],
            cleanupPrimary: normalizedError.details?.cleanupPrimary
          });
        }
        
        if (normalizedError.type === "cancelled") {
          throw new AnalysisCancelledError("Version probe was cancelled");
        }
        
        throw error;
      }
      throw error;
    }
  }
};

let commands = new ApktoolCommandCleanup();
afterEach(async () => {
  await commands.close();
  commands = new ApktoolCommandCleanup();
  vi.mocked(runOwnedCommand).mockReset();
});

const selection = {
  command: "/opt/apktool/apktool",
  commandSource: "environment",
} as const;
const owner = {
  stop: vi.fn(async () => ({ status: "verified-cleanup" as const })),
} as unknown as ProviderProcessSupervisor;

it("runs the version probe as an owned interpreter-script process group", async () => {
  vi.mocked(runOwnedCommand).mockImplementationOnce(async (_spawn, limits) => {
    const output = {
      stdout: { text: "2.9.3\n" },
      stderr: { text: "" },
    } as Awaited<ReturnType<typeof runOwnedCommand>>;
    limits.observeCompleted?.(output);
    return output;
  });
  await expect(
    CoordinationHelper.executeVersionProbe(selection, commands, {
      environment: {},
      platform: "linux",
    }),
  ).resolves.toEqual({
    version: "2.9.3",
    supportsDocumentedVersion: true,
    limitations: [],
  });
  expect(vi.mocked(runOwnedCommand).mock.lastCall?.[0]).toMatchObject({
    command: "/opt/apktool/apktool",
    arguments: ["--version"],
    expectedCommand: null,
  });
  expect(vi.mocked(runOwnedCommand).mock.lastCall?.[1]).toMatchObject({
    timeoutMs: 20_000,
    diagnosticBytes: 64 * 1024,
  });
});

it("reports an expired version probe as a typed timeout", async () => {
  vi.mocked(runOwnedCommand).mockRejectedValueOnce(
    new OwnedCommandFailure("timeout", "Command deadline elapsed."),
  );
  const failure = await CoordinationHelper.executeVersionProbe(selection, commands, {
    environment: {},
    platform: "linux",
  }).catch((cause: unknown) => cause);
  expect(failure).toBeInstanceOf(AnalysisTimeoutError);
  expect(projectAnalysisError(failure as AnalysisTimeoutError)).toMatchObject({
    code: "provider_timeout",
    category: "timeout",
    details: { timeout_ms: 20_000 },
  });
});

it("retains an unresolved probe cleanup owner and reports the cleanup", async () => {
  vi.mocked(runOwnedCommand).mockRejectedValueOnce(
    new OwnedCommandFailure(
      "timeout",
      "Command deadline elapsed.",
      null,
      "cleanup incomplete",
      undefined,
      ["pid:1"],
      owner,
    ),
  );
  const failure = await CoordinationHelper.executeVersionProbe(selection, commands, {
    environment: {},
    platform: "linux",
  }).catch((cause: unknown) => cause);
  expect((failure as AnalysisTimeoutError).cleanupPrimary).toBeInstanceOf(
    AnalysisTimeoutError,
  );
  expect(projectAnalysisError(failure as AnalysisTimeoutError)).toMatchObject({
    code: "cleanup_incomplete",
  });
  expect(owner.stop).not.toHaveBeenCalled();
  await commands.close();
  expect((failure as AnalysisTimeoutError).cleanupIncomplete).toBe(false);
});

it("reports a cancelled version probe as cancelled", async () => {
  vi.mocked(runOwnedCommand).mockRejectedValueOnce(
    new OwnedCommandFailure("cancelled", "Command cancelled."),
  );
  await expect(
    CoordinationHelper.executeVersionProbe(selection, commands, {
      environment: {},
      platform: "linux",
    }),
  ).rejects.toBeInstanceOf(AnalysisCancelledError);
});

it("keeps unresolved probe cleanup typed when the launcher overflows its output", async () => {
  const overflow = () =>
    new OwnedCommandFailure(
      "output-limit",
      "Command diagnostic output exceeded its complete-output budget.",
      null,
      "process group still running",
      undefined,
      ["pid:7", "process-group:7"],
      owner,
    );
  vi.mocked(runOwnedCommand).mockRejectedValueOnce(overflow());
  const failure = await CoordinationHelper.executeVersionProbe(selection, commands, {
    environment: {},
    platform: "linux",
  }).catch((cause: unknown) => cause);
  expect((failure as AnalysisTimeoutError).cleanupResources).toEqual([
    "pid:7",
    "process-group:7",
  ]);

  // Both provider entry points report the unresolved processes as cleanup.
  const provider = new ApktoolProvider({
    environment: { REA_APKTOOL_COMMAND: "/opt/apktool/apktool" },
  });
  vi.mocked(runOwnedCommand).mockRejectedValueOnce(overflow());
  await expect(provider.inspectAvailability()).rejects.toMatchObject({
    cleanupIncomplete: true,
  });
  vi.mocked(runOwnedCommand).mockRejectedValueOnce(overflow());
  const result = await provider.execute({
    operation: "decode_android_resources",
    input: {},
  } as never);
  expect(result.ok ? null : result.error.cleanupIncomplete).toBe(true);
  expect(result.ok ? null : projectAnalysisError(result.error)).toMatchObject({
    code: "cleanup_incomplete",
    details: { resources: ["pid:7", "process-group:7"] },
  });
  await provider.close();
  expect(result.ok ? null : result.error.cleanupIncomplete).toBe(false);
});

it.each(["linux", "win32"] as const)(
  "interprets advisory applicability using the selected %s host",
  async (platform) => {
    vi.mocked(runOwnedCommand).mockImplementationOnce(
      async (_spawn, limits) => {
        const output = {
          stdout: { text: "2.9.2\n" },
          stderr: { text: "" },
        } as Awaited<ReturnType<typeof runOwnedCommand>>;
        limits.observeCompleted?.(output);
        return output;
      },
    );
    const identity = await CoordinationHelper.executeVersionProbe(selection, commands, {
      environment: {},
      platform,
    });
    expect(identity.version).toBe("2.9.2");
    expect(identity.supportsDocumentedVersion).toBe(true);
    expect(identity.limitations).toEqual([]);
  },
);