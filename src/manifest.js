function matchesPrefix(relativePath, candidate) {
  return relativePath === candidate || relativePath.startsWith(`${candidate}/`);
}

function isAllowedException(relativePath, allowFiles) {
  return (allowFiles || []).some(
    (allowed) =>
      allowed === relativePath ||
      allowed.startsWith(`${relativePath}/`) ||
      relativePath.startsWith(`${allowed}/`),
  );
}

function shouldVisitDirectory(relativePath, manifest) {
  const normalized = String(relativePath || "").replaceAll("\\", "/").replace(/^\.\//, "");
  if (!normalized || normalized === ".") return true;
  const segments = normalized.split("/");
  const allowFiles = manifest.allowFiles || [];
  if (segments.length === 1) {
    return (manifest.allowRootEntries || []).includes(normalized);
  }
  if ((manifest.excludeRootEntries || []).includes(segments[0])) return false;
  if (!(manifest.allowRootEntries || []).includes(segments[0])) return false;
  const excluded = [...(manifest.excludePaths || []), ...(manifest.initExcludePaths || [])].some(
    (excludedPath) => matchesPrefix(normalized, excludedPath),
  );
  if (!excluded) return true;
  return allowFiles.some(
    (allowed) => allowed === normalized || allowed.startsWith(`${normalized}/`),
  );
}

function shouldDistribute(relativePath, manifest, { init = true } = {}) {
  const normalized = String(relativePath || "").replaceAll("\\", "/").replace(/^\.\//, "");
  if (!normalized || normalized === ".") return false;
  const allowFiles = manifest.allowFiles || [];
  if (isAllowedException(normalized, allowFiles)) return true;

  const segments = normalized.split("/");
  const rootName = segments[0];
  if (segments.length === 1) {
    if ((manifest.excludeRootFiles || []).includes(normalized)) return false;
    if (init && (manifest.initExcludeRootFiles || []).includes(normalized)) return false;
    return (manifest.allowRootFiles || []).includes(normalized);
  }

  if ((manifest.excludeRootEntries || []).includes(rootName)) return false;
  if (init && (manifest.initExcludeRootEntries || []).includes(rootName)) return false;
  if (!(manifest.allowRootEntries || []).includes(rootName)) return false;

  const excluded = [
    ...(manifest.excludePaths || []),
    ...(init ? manifest.initExcludePaths || [] : []),
  ].some(
    (excludedPath) =>
      matchesPrefix(normalized, excludedPath) && !isAllowedException(normalized, allowFiles),
  );
  return !excluded;
}

module.exports = { matchesPrefix, shouldDistribute, shouldVisitDirectory };
