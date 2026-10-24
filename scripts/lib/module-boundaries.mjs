/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:30:17.365Z
 * Engine: LLM
 */
import { parse } from "@babel/parser";
import { traverseFast } from "@babel/types";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Domain constants
const PURE_LAYERS = new Set(["domain", "contracts"]);
const MIGRATED_PROVIDER_ROOTS = new Set([
  "sqlite",
  "evm",
  "go",
  "il2cpp",
  "model",
  "rust",
  "wasm",
  "captures",
  "signals",
  "android",
  "firmware",
  "ghidra",
  "hopper",
  "ida",
  "inspector",
  "javascript",
]);

// Utility functions
const repositoryPath = (root, path) =>
  relative(root, path).replaceAll("\\", "/");

const literalValue = (node) => {
  if (node?.type === "StringLiteral") return node.value;
  if (node?.type === "TemplateLiteral" && node.expressions.length === 0)
    return node.quasis[0]?.value.cooked ?? undefined;
  return undefined;
};

const importSpecifier = (node) => {
  switch (node.type) {
    case "ImportDeclaration":
    case "ExportNamedDeclaration":
    case "ExportAllDeclaration":
    case "ImportExpression":
    case "TSImportType":
      return literalValue(node.source);
    case "TSImportEqualsDeclaration":
      return node.moduleReference.type === "TSExternalModuleReference"
        ? literalValue(node.moduleReference.expression)
        : undefined;
    default:
      return undefined;
  }
};

const sourceTarget = (file, specifier) => {
  if (specifier.startsWith("file:")) return fileURLToPath(specifier);
  if (isAbsolute(specifier)) return resolve(specifier);
  return specifier.startsWith(".")
    ? fileURLToPath(new URL(specifier, pathToFileURL(file)))
    : undefined;
};

// Boundary validation module
const boundaryValidation = (() => {
  const sanitizePath = (path) => path.replaceAll("\\", "/").replace(/^\//, "");
  
  const getLayer = (path) => {
    const sanitized = sanitizePath(path);
    const parts = sanitized.split("/");
    return parts[1] || undefined;
  };

  const boundaryPolicies = [
    {
      name: "process-capture",
      condition: (file, target) => 
        file.startsWith("src/process/capture/") && 
        (["application", "composition", "server", "cli", "main"].includes(getLayer(target)) ||
          /^src\/(?:cli|main)\./u.test(target))
    },
    {
      name: "provider-construction",
      condition: (file, target) => 
        (file.startsWith("src/application/javascript/") &&
          /^src\/artifacts\/(?:Asar|Directory)ArtifactReader\.(?:js|ts)$/u.test(target)) ||
        ((file.startsWith("src/artifacts/javascript/") ||
          file.startsWith("src/artifacts/apple/") ||
          file.startsWith("src/artifacts/inventory/") ||
          file.startsWith("src/artifacts/extraction/") ||
          /^src\/artifacts\/ArtifactHash\.(?:js|ts)$/u.test(file)) &&
          (["application", "composition", "server", "cli", "main"].includes(getLayer(target)) ||
            /^src\/(?:cli|main)\./u.test(target)))
    },
    {
      name: "artifact-acquisition",
      condition: (file, target) => 
        (file.startsWith("src/artifacts/javascript/") ||
          file.startsWith("src/artifacts/apple/") ||
          file.startsWith("src/artifacts/inventory/") ||
          file.startsWith("src/artifacts/extraction/") ||
          /^src\/artifacts\/ArtifactHash\.(?:js|ts)$/u.test(file)) &&
        (["application", "composition", "server", "cli", "main"].includes(getLayer(target)) ||
          /^src\/(?:cli|main)\./u.test(target))
    },
    {
      name: "pure-layer",
      condition: (file, target) => {
        const layer = getLayer(file);
        return PURE_LAYERS.has(layer) &&
          ((/^src\/[^/]+\//u.test(target) && !PURE_LAYERS.has(getLayer(target))) ||
            /^src\/(?:cli|main)\./u.test(target));
      }
    },
    {
      name: "application-composition",
      condition: (file, target) => 
        getLayer(file) === "application" && getLayer(target) === "composition"
    },
    {
      name: "provider-construction",
      condition: (file, target) => {
        const layer = getLayer(file);
        return (layer === "application" || layer === "server") &&
          (MIGRATED_PROVIDER_ROOTS.has(getLayer(target)) ||
            /^src\/(?:artifacts\/ArtifactProvider|dotnet\/ManagedStaticProvider|native\/NativeMacOSProvider)\.[^/]+$/u.test(target) ||
            /^src\/browser\/[^/]*Provider\.[^/]+$/u.test(target));
      }
    }
  ];

  const checkBoundary = (file, target) => {
    if (!file.startsWith("src/") || !target.startsWith("src/")) return undefined;
    
    for (const policy of boundaryPolicies) {
      if (policy.condition(file, target)) {
        return policy.name;
      }
    }
    return undefined;
  };

  return { checkBoundary };
})();

// AST traversal module
const astTraversal = (() => {
  const traverseImportSpecifiers = (source, callback) => {
    const tree = parse(source, {
      sourceType: "module",
      plugins: ["typescript"],
    });
    traverseFast(tree, (node) => {
      const specifier = importSpecifier(node);
      if (specifier !== undefined) {
        callback(node, specifier);
      }
    });
  };

  return { traverseImportSpecifiers };
})();

// Refactored failedBoundary function
const failedBoundary = (file, target) => {
  return boundaryValidation.checkBoundary(file, target);
};

/** Check resolved source ownership, including type imports and reexports. */
export const inspectModuleBoundaries = (file, source, root) => {
  const absoluteFile = resolve(root, file);
  const importer = repositoryPath(root, absoluteFile);
  const violations = [];
  
  astTraversal.traverseImportSpecifiers(source, (node, specifier) => {
    const resolved = sourceTarget(absoluteFile, specifier);
    if (resolved === undefined) return;
    const target = repositoryPath(root, resolved);
    const boundary = failedBoundary(importer, target);
    if (boundary !== undefined)
      violations.push({
        file: importer,
        line: node.loc?.start.line ?? 1,
        specifier,
        target,
        boundary,
      });
  });
  
  return violations;
};