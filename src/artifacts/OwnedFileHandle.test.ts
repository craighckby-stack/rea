/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:04:51.405Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { expect, it, vi } from "vitest";

import { OwnedFileHandle } from "../filesystem/OwnedFileHandle.js";

it("shares one in-flight successful close between concurrent owners", async () => {
  let resolveClose: (() => void) | undefined;
  const file = {
    fd: 17,
    close: vi.fn(
      () =>
        new Promise<void>((resolve) => {
          file.fd = -1;
          resolveClose = resolve;
        }),
    ),
  };
  const owner = new OwnedFileHandle(file);

  const first = owner.close();
  const second = owner.close();
  await Promise.resolve();
  expect(file.close).toHaveBeenCalledTimes(1);
  resolveClose?.();

  await expect(Promise.all([first, second])).resolves.toEqual([
    undefined,
    undefined,
  ]);
  await expect(owner.close()).resolves.toBeUndefined();
  expect(file.close).toHaveBeenCalledTimes(1);
});

it("shares one in-flight failed close and keeps its unconfirmed result sticky", async () => {
  const failure = new Error("native close failed");
  let rejectClose: (() => void) | undefined;
  const file = {
    fd: 17,
    close: vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          file.fd = -1;
          rejectClose = () => reject(failure);
        }),
    ),
  };
  const owner = new OwnedFileHandle(file);

  const first = owner.close();
  const second = owner.close();
  await Promise.resolve();
  expect(file.close).toHaveBeenCalledTimes(1);
  rejectClose?.();

  await expect(Promise.all([first, second])).rejects.toBe(failure);
  await expect(owner.close()).rejects.toBe(failure);
  expect(file.close).toHaveBeenCalledTimes(1);
});
