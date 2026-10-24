/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:20:52.450Z
 * Engine: LLM
 */
import { snapshotEnvironment } from "../process/snapshotEnvironment.js";
import type {
  OptionalObservationProviders,
  OptionalProviderLoadFailure,
  OptionalProviderLoadResult,
} from "../application/OptionalObservationProviders.js";
import {
  CDP_BROWSER_PROVIDER_IDENTITY,
  PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY,
  CDP_ELECTRON_PROVIDER_IDENTITY,
  PLAYWRIGHT_ELECTRON_ACTIVE_PROVIDER_IDENTITY,
} from "../browser/providerIdentities.js";
import { V8_INSPECTOR_PROVIDER_IDENTITY } from "../inspector/providerIdentity.js";
import { err, ok, type Result } from "../domain/result.js";

/** Precisely typed startup factories for the five existing observation ports. */
export type OptionalObservationFactories = {
  readonly [Port in keyof OptionalObservationProviders]-?: () => Promise<
    NonNullable<OptionalObservationProviders[Port]>
  >;
};

// Provider Loading Module
const createProviderLoader = () => {
  const sanitizeError = (error: unknown): string => {
    if (error instanceof Error) {
      // Simple entropy-based sanitization
      return error.message.replace(/[a-zA-Z0-9]{10,}/g, "[REDACTED]");
    }
    return String(error);
  };

  const loadProvider = async <T>(
    factory: () => Promise<T>,
    providerId: string,
  ): Promise<Result<T, OptionalProviderLoadFailure>> => {
    try {
      return ok(await factory());
    } catch (cause: unknown) {
      return err({
        providerId,
        reason: sanitizeError(cause),
      });
    }
  };

  return { loadProvider };
};

// Environment Snapshot Module
const createEnvironmentSnapshot = (
  selectedEnvironment: Readonly<Record<string, string | undefined>>,
) => {
  return snapshotEnvironment(selectedEnvironment);
};

// Factory Creation Module
const createFactoryBuilder = (environment: ReturnType<typeof snapshotEnvironment>) => {
  const buildFactory = (port: keyof OptionalObservationProviders) => {
    switch (port) {
      case "browserObservation":
        return async () =>
          (await import("./browserObservation.js")).createBrowserObservationProvider();
      case "browserScenarioCapture":
        return async () =>
          (await import("./browserScenario.js")).createBrowserScenarioProvider(environment);
      case "electronObservation":
        return async () =>
          (await import("./electronObservation.js")).createElectronObservationProvider();
      case "electronActiveObservation":
        return async () =>
          (await import("./electronScenario.js")).createElectronScenarioProvider(environment);
      case "javascriptRuntimeObservation":
        return async () =>
          (await import("./javascriptRuntimeObservation.js")).createJavaScriptRuntimeObservationProvider();
      default:
        throw new Error(`Unknown observation port: ${port}`);
    }
  };

  return { buildFactory };
};

// Provider Coordinator Module
const createProviderCoordinator = (loader: ReturnType<typeof createProviderLoader>) => {
  const coordinateProviders = async (
    factories: OptionalObservationFactories,
  ): Promise<OptionalProviderLoadResult> => {
    const providerResults = await Promise.allSettled([
      loader.loadProvider(factories.browserObservation, CDP_BROWSER_PROVIDER_IDENTITY.id),
      loader.loadProvider(
        factories.browserScenarioCapture,
        PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY.id,
      ),
      loader.loadProvider(
        factories.electronObservation,
        CDP_ELECTRON_PROVIDER_IDENTITY.id,
      ),
      loader.loadProvider(
        factories.electronActiveObservation,
        PLAYWRIGHT_ELECTRON_ACTIVE_PROVIDER_IDENTITY.id,
      ),
      loader.loadProvider(
        factories.javascriptRuntimeObservation,
        V8_INSPECTOR_PROVIDER_IDENTITY.id,
      ),
    ]);

    const result: OptionalProviderLoadResult = {
      optionalProviderLoadFailures: {},
    };

    // Process each result individually
    const processResult = (
      resultIndex: number,
      providerResult: PromiseSettledResult<Result<any, OptionalProviderLoadFailure>>,
    ) => {
      const portNames = [
        "browserObservation",
        "browserScenarioCapture",
        "electronObservation",
        "electronActiveObservation",
        "javascriptRuntimeObservation",
      ] as const;

      const portName = portNames[resultIndex];
      const settledResult = providerResult;

      if (settledResult.status === "fulfilled") {
        const value = settledResult.value;
        if (value.ok) {
          result[portName] = value.value;
        } else {
          result.optionalProviderLoadFailures[portName] = value.error;
        }
      } else {
        result.optionalProviderLoadFailures[portName] = {
          providerId: portNames[resultIndex],
          reason: settledResult.reason instanceof Error ? settledResult.reason.message : String(settledResult.reason),
        };
      }
    };

    providerResults.forEach((result, index) => processResult(index, result));

    return result;
  };

  return { coordinateProviders };
};

/** Bind optional provider construction to one caller-selected process environment. */
export const createOptionalObservationFactories = (
  selectedEnvironment: Readonly<Record<string, string | undefined>>,
): OptionalObservationFactories => {
  const environment = createEnvironmentSnapshot(selectedEnvironment);
  const factoryBuilder = createFactoryBuilder(environment);

  return {
    browserObservation: factoryBuilder.buildFactory("browserObservation"),
    browserScenarioCapture: factoryBuilder.buildFactory("browserScenarioCapture"),
    electronObservation: factoryBuilder.buildFactory("electronObservation"),
    electronActiveObservation: factoryBuilder.buildFactory("electronActiveObservation"),
    javascriptRuntimeObservation: factoryBuilder.buildFactory("javascriptRuntimeObservation"),
  };
};

/** Load each adapter independently, retaining healthy peers and exact failures. */
export const loadOptionalObservationProviders = async (
  factories: OptionalObservationFactories,
): Promise<OptionalProviderLoadResult> => {
  const loader = createProviderLoader();
  const coordinator = createProviderCoordinator(loader);
  return coordinator.coordinateProviders(factories);
};