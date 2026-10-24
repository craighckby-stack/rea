/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:47:09.871Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { expect, it } from "vitest";

import { runSetup } from "./Setup.js";
import { FakeSetupHost, options } from "./Setup.fixture.js";

it("refreshes doctor after approved setup changes", async () => {
  const host = new FakeSetupHost();
  host.doctorHealthy = false;
  host.skill = "unchanged";
  host.clients = [{ name: "codex", configPath: "/codex.json" }];
  const configureClient = host.configureClient;
  host.configureClient = (client, providerEnvironment, command) => {
    host.doctorHealthy = true;
    return configureClient(client, providerEnvironment, command);
  };

  const result = await runSetup(
    { ...options(true), clientIds: ["codex"], installSkill: false },
    host,
  );

  expect(result.doctor.healthy).toBe(true);
});
