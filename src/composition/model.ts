/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:20:30.180Z
 * Engine: LLM
 */
// Provider Module
import { ModelArtifactProvider } from "../model/ModelArtifactProvider.js";

/** Factory Module */
/** Construct the local reader without acquiring files, processes or network resources. */
export const createModelArtifactService = (): ModelArtifactService =>
  new ModelArtifactService(new ModelArtifactProvider());

// Service Module
import { ModelArtifactService } from "../application/model/ModelArtifactService.js";

// Config Module
// Utilities Module