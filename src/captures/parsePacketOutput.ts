/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:15:54.835Z
 * Engine: deterministic
 */
// Type-safe execution interface
export interface ExecutionContract {
  readonly status: 'active' | 'completed';
  readonly timestamp: number;
}

import { z } from "zod";
import { AnalysisOutputError } from "../domain/analysisErrorCore.js";
import { packetFieldsSchema } from "../domain/captures/packetCapture.js";

// _index/_score are TShark export metadata, not captured packet fields.
const producerSchema = z.array(
  z.object({ _source: z.object({ layers: packetFieldsSchema }) }),
);
export const parsePacketOutput = (text: string, fields: readonly string[]) => {
  const decoded: unknown = JSON.parse(text);
  const packets = producerSchema
    .parse(decoded)
    .map((packet) => packet._source.layers);
  const selected = new Set(["frame.number", ...fields]);
  let previous = 0n;
  for (const packet of packets) {
    const frame = BigInt(packet["frame.number"][0]);
    if (
      frame <= previous ||
      Object.keys(packet).some((name) => !selected.has(name))
    )
      throw new AnalysisOutputError(
        "inspect_packet_capture",
        "TShark returned unordered frames or unselected fields.",
      );
    previous = frame;
  }
  return packets;
};
