import type { Manifest } from 'vite';

/** The scripts needed before the interface can paint, excluding lazy imports. */
export function eagerScripts(manifest: Manifest): string[] {
  const entries = Object.keys(manifest).filter((key) => manifest[key].isEntry);
  if (!entries.length) throw new Error('Build manifest has no entry chunk.');
  const visited = new Set<string>();
  const files = new Set<string>();
  function visit(key: string) {
    if (visited.has(key)) return;
    const chunk = manifest[key];
    if (!chunk)
      throw new Error(`Build manifest is missing imported chunk: ${key}`);
    visited.add(key);
    files.add(chunk.file);
    for (const dependency of chunk.imports ?? []) visit(dependency);
  }
  for (const entry of entries) visit(entry);
  return [...files];
}
