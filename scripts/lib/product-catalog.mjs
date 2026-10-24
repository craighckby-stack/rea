/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:31:18.971Z
 * Engine: LLM
 */
import { formatGeneratedFile } from "./format-generated-file.mjs";
import { assertSameNames, digest, loadSources } from "./catalog-core.mjs";
import { createCliInventory } from "./catalog-cli.mjs";
import { providerCatalog, toolFamilyCatalog } from "./catalog-builders.mjs";
import { extractMetadata } from "./catalog-metadata.mjs";
import { sanitizeEntropy } from "./catalog-sanitization.mjs";
import { serializeCatalog } from "./catalog-serialization.mjs";
import { CatalogInterface } from "./catalog-interface.mjs";

/** Project current runtime contracts into deterministic, machine-readable facts. */
export const createProductCatalog = async (root) => {
  const sources = await loadSources(root);
  const cli = createCliInventory(sources.cli.createCli());
  assertSameNames(
    "Primary CLI inventory",
    cli.primary,
    sources.cliCommandNames.CLI_COMMAND_NAMES,
  );
  const tools = toolFamilyCatalog(sources);
  const providers = providerCatalog(sources);
  const metadata = extractMetadata(sources.packageMetadata.PACKAGE_METADATA);
  const sanitizedMetadata = sanitizeEntropy(metadata);
  
  const catalog = new CatalogInterface({
    package: {
      name: sanitizedMetadata.name,
      version: sanitizedMetadata.version,
      sdk: {
        server: sanitizedMetadata.serverSdkVersion,
        client: sanitizedMetadata.clientSdkVersion,
        core: sanitizedMetadata.coreSdkVersion,
      },
      skill_version: sanitizedMetadata.skillVersion,
    },
    tools,
    providers,
    setup_clients: sources.supportedClients.SUPPORTED_CLIENT_DEFINITIONS.map(
      ({ name, displayName, format }) => ({
        id: name,
        display_name: displayName,
        format,
        configuration: format === "unsupported" ? "detect-only" : "managed",
      }),
    ),
    cli: {
      primary_count: cli.primary.length,
      commands: cli.primary,
      aliases: cli.aliases,
    },
    runtime_catalog: {
      counts: sources.catalogIdentity.CATALOG_IDENTITY.counts,
      digests: {
        providers_sha256: digest(providers),
      },
    },
  });
  
  return catalog;
};

/** Stable build-generated representation of the product catalog. */
export const serializeProductCatalog = (catalog) =>
  formatGeneratedFile(
    "docs/public/product-catalog.json",
    serializeCatalog(catalog),
  );