/**
 * Determines whether the NDE Workbench should be mounted.
 *
 * The workbench is bundled into the same `remoteEntry.js` that ships to
 * production, so it MUST be guarded at runtime — it is only ever loaded when
 * this returns `true`, via a dynamic `import()` in `bootstrap.ts`. That keeps
 * the workbench chunk from being fetched on a real Primo deployment.
 *
 * Enabled when:
 * - running on localhost / 127.0.0.1 (the dev proxy), or on port 4201, or
 * - explicitly forced with `window.__NDE_WORKBENCH__ = true`, or
 *   disabled with `window.__NDE_WORKBENCH__ = false`.
 */
export function isWorkbenchEnabled(): boolean {
  const override = (window as any).__NDE_WORKBENCH__;
  if (typeof override === 'boolean') {
    return override;
  }

  const { hostname, port } = window.location;
  const isLocalHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]';

  return isLocalHost || port === '4201';
}
