// MUST be first — patches XHR/fetch BEFORE any Angular or host HTTP calls
import { installGlobalHttpInterceptor } from './app/services/global-http-interceptor';
installGlobalHttpInterceptor();

import { isWorkbenchEnabled } from './app/workbench/workbench-guard';
// Dev-only: install host-surface probes BEFORE the host boots so we capture
// its customElements.define calls. Guarded — no-op (and not run) in production.
if (isWorkbenchEnabled()) {
  import('./app/workbench/host-probes')
    .then(({ installHostProbes }) => installHostProbes())
    .catch((err) => console.error('[NDEWorkbench] probe install failed', err));
}

// import './app/custom1-module/customComponentMappings';
import '@angular/compiler';
import { AppModule } from './app/app.module';
import { bootstrap } from '@angular-architects/module-federation-tools';

export const bootstrapRemoteApp = (bootstrapOptions: any) => {
  return bootstrap(AppModule(bootstrapOptions), {
    production: true,
    appType: 'microfrontend',
  }).then((r) => {
    console.log('custom remote app bootstrap success!', r);
    mountWorkbenchIfEnabled();
    return r;
  });
};

/**
 * Dev-only NDE Workbench. The dynamic `import()` is guarded so the workbench
 * chunk is never fetched in production — see `workbench/workbench-guard.ts`.
 */
function mountWorkbenchIfEnabled(): void {
  import('./app/workbench/workbench-guard').then(({ isWorkbenchEnabled }) => {
    if (!isWorkbenchEnabled()) return;
    import('./app/workbench/mount')
      .then(({ mountWorkbench }) => mountWorkbench())
      .catch((err) => console.error('[NDEWorkbench] failed to load', err));
  });
}
