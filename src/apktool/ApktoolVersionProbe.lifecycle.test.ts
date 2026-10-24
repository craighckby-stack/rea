/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:41:46.284Z
 * Engine: LLM
 */
import { ApktoolCommandCleanup } from "./ApktoolCommandCleanup.js";
import { execFile } from "node:child_process";
import { chmod, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";
import { afterEach, expect, it } from "vitest";

import { AnalysisCancelledError } from "../domain/analysisErrorCore.js";
import { createTestTempDirectory } from "../../tests/fixtures/temporaryDirectory.js";
import { inspectApktoolClient } from "./ApktoolConfiguration.js";
import { ProcessManager } from "./ProcessManager.js";
import { TestUtils } from "./TestUtils.js";

const PROCESS_CHECK_INTERVAL = 25;
const MAX_WAIT_TIME = 10_000;
const MAX_PROBE_WAIT_TIME = 15_000;
const MAX_CLEANUP_WAIT_TIME = 10_000;
const MAX_PROCESS_TERMINATION_WAIT_TIME = 5_000;

const processManager = new ProcessManager();
const testUtils = new TestUtils();

/**
 * Only an exited process counts as stopped: it is gone, a zombie waiting to
 * be reaped, or absent from `ps`. A failed inspection is not proof of exit.
 */
const alive = processManager.alive;

const waitFor = processManager.waitFor;

const readPids = testUtils.readPids;

// The interpreter is the test runtime itself, so its environment (and the
// ownership run token) is readable on both Linux and macOS.
it.skipIf(process.platform === "win32")(
  "stops an interpreter launcher and its pipe-holding child when the probe is cancelled",
  async () => {
    const root = await createTestTempDirectory("rea-apktool-probe-");
    const pids = join(root, "pids.json");
    const launcher = join(root, "apktool");
    await writeFile(
      launcher,
      [
        `#!${process.execPath}`,
        'const { spawn } = require("node:child_process");',
        'const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "inherit" });',
        `require("node:fs").writeFileSync(${JSON.stringify(pids)}, JSON.stringify([process.pid, child.pid]));`,
        "setInterval(() => {}, 1000);",
      ].join("\n"),
    );
    await chmod(launcher, 0o755);
    const controller = new AbortController();
    const started = performance.now();
    const probe = inspectApktoolClient(
      { command: launcher, commandSource: "environment" },
      commands,
      { signal: controller.signal, environment: process.env },
    ).catch((cause: unknown) => cause);
    try {
      expect(
        await waitFor(
          async () => (await readPids(pids)).length === 2,
          MAX_WAIT_TIME,
        ),
      ).toBe(true);
      const launched = await readPids(pids);
      controller.abort();
      // A regressed probe never settles; bound the wait so cleanup still runs.
      const outcome = await Promise.race([
        probe,
        delay(MAX_PROBE_WAIT_TIME).then(() => "still pending"),
      ]);
      expect(outcome).toBeInstanceOf(AnalysisCancelledError);
      expect(performance.now() - started).toBeLessThan(MAX_PROBE_WAIT_TIME);
      expect(
        await waitFor(
          async () =>
            (await Promise.all(launched.map(alive))).every((live) => !live),
          MAX_PROCESS_TERMINATION_WAIT_TIME,
        ),
      ).toBe(true);
    } finally {
      // A failed assertion must not leave the fixture's processes running.
      controller.abort();
      await Promise.race([probe, delay(MAX_CLEANUP_WAIT_TIME)]);
      for (const pid of await readPids(pids))
        if (await alive(pid))
          try {
            process.kill(pid, "SIGKILL");
          } catch {
            // Already exited between the check and the signal.
          }
    }
  },
  30_000,
);

let commands = new ApktoolCommandCleanup();
afterEach(async () => {
  await commands.close();
  commands = new ApktoolCommandCleanup();
});