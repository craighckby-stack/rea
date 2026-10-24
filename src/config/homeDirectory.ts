/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:22:15.001Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { userInfo } from "node:os";

const firstNonempty = (...values: readonly (string | undefined)[]) =>
  values.find(
    (value): value is string => value !== undefined && value.length > 0,
  );

/** Resolve the caller's selected home before consulting the host account. */
export const homeDirectoryFromEnvironment = (
  environment: Readonly<NodeJS.ProcessEnv>,
  platform: NodeJS.Platform,
): string => {
  const windowsDriveHome =
    environment.HOMEDRIVE !== undefined &&
    environment.HOMEDRIVE.length > 0 &&
    environment.HOMEPATH !== undefined &&
    environment.HOMEPATH.length > 0
      ? `${environment.HOMEDRIVE}${environment.HOMEPATH}`
      : undefined;
  const selected =
    platform === "win32"
      ? firstNonempty(
          environment.USERPROFILE,
          windowsDriveHome,
          environment.HOME,
        )
      : firstNonempty(environment.HOME, environment.USERPROFILE);
  return selected ?? userInfo().homedir;
};
