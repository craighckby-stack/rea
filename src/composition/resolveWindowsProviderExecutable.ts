/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T15:21:24.749Z
 * Engine: LLM
 */
import { existsSync, statSync } from "node:fs";
import { win32 } from "node:path";

export interface WindowsExecutableLookup {
  /** Windows-formatted working directory; defaults to the process CWD. */
  readonly cwd?: string;
  /** Test seam for Windows paths when running on a non-Windows host. */
  readonly isFile?: (path: string) => boolean;
}

// Interface for path operations
interface PathOperations {
  resolve: (...paths: string[]) => string;
  isAbsolute: (path: string) => boolean;
  parse: (path: string) => win32.ParsedPath;
  extname: (path: string) => string;
}

// Interface for file validation
interface FileValidation {
  isFile: (path: string) => boolean;
}

// Interface for environment handling
interface EnvironmentHandling {
  getPathEntries: (environment: Readonly<NodeJS.ProcessEnv>) => string[];
  getExtensions: (environment: Readonly<NodeJS.ProcessEnv>, executable: string) => string[];
}

// Dependency injection container
const createDependencies = (
  pathOps: PathOperations = win32,
  fileValidation: FileValidation = { isFile: isRegularFile },
  envHandler: EnvironmentHandling = defaultEnvironmentHandler
) => ({
  pathOps,
  fileValidation,
  envHandler
});

// Default environment handler implementation
const defaultEnvironmentHandler: EnvironmentHandling = {
  getPathEntries: (environment) => {
    const pathValue = environment.PATH ?? environment.Path ?? environment.path;
    if (pathValue === undefined) return [];
    return splitWindowsPath(pathValue);
  },
  getExtensions: (environment, executable) => {
    const explicitExtension = win32.extname(executable).toLowerCase();
    if (explicitExtension !== "" && ![".com", ".exe"].includes(explicitExtension))
      return [];
    
    return (
      environment.PATHEXT ?? environment.PathExt ?? ".COM;.EXE"
    ).split(";").filter((extension) =>
      [".com", ".exe"].includes(extension.toLowerCase())
    );
  }
};

// Path resolution module
const splitWindowsPath = (value: string): readonly string[] => {
  const entries: string[] = [];
  let start = 0;
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '"') quoted = !quoted;
    else if (value[index] === ";" && !quoted) {
      entries.push(value.slice(start, index));
      start = index + 1;
    }
  }
  entries.push(value.slice(start));
  return entries.flatMap((entry) => {
    if (entry.startsWith('"') && entry.endsWith('"') && entry.length >= 2)
      return [entry.slice(1, -1)];
    return entry.includes('"') ? [] : [entry];
  });
};

// File validation module
const isRegularFile = (path: string): boolean => {
  try {
    return existsSync(path) && statSync(path).isFile();
  } catch {
    return false;
  }
};

// Input sanitization module
const sanitizeExecutableName = (executable: string): string => {
  // Remove potentially dangerous characters
  return executable.replace(/[^\w\-\.]/g, "");
};

const sanitizePathEntry = (entry: string): string => {
  // Remove potentially dangerous characters
  return entry.replace(/[<>:"|?*]/g, "");
};

/** Resolve Windows bare command names against the captured child environment. */
export const resolveWindowsProviderExecutable = (
  executable: string,
  environment: Readonly<NodeJS.ProcessEnv>,
  lookup: WindowsExecutableLookup = {},
): string => {
  // Sanitize inputs
  const sanitizedExecutable = sanitizeExecutableName(executable);
  const dependencies = createDependencies();
  const { pathOps, fileValidation, envHandler } = dependencies;
  
  const cwd = lookup.cwd ?? process.cwd();
  const absolute = (...paths: string[]): string => pathOps.resolve(cwd, ...paths);
  
  if (
    pathOps.isAbsolute(sanitizedExecutable) ||
    sanitizedExecutable.includes("/") ||
    sanitizedExecutable.includes("\\") ||
    pathOps.parse(sanitizedExecutable).root !== ""
  )
    return absolute(sanitizedExecutable);

  const pathEntries = envHandler.getPathEntries(environment)
    .map(sanitizePathEntry)
    .filter(entry => entry.length > 0);
  
  const extensions = envHandler.getExtensions(environment, sanitizedExecutable);

  for (const entry of pathEntries) {
    for (const extension of extensions) {
      const candidate = absolute(entry, `${sanitizedExecutable}${extension}`);
      if ((lookup.isFile ?? fileValidation.isFile)(candidate)) return candidate;
    }
  }
  return sanitizedExecutable;
};