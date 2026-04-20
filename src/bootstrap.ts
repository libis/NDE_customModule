// MUST be first — patches XHR/fetch BEFORE any Angular or host HTTP calls
import { installGlobalHttpInterceptor } from './app/services/global-http-interceptor';
installGlobalHttpInterceptor();

import '@angular/compiler';
import { AppModule } from './app/app.module';
import { bootstrap } from '@angular-architects/module-federation-tools';

export const bootstrapRemoteApp = (bootstrapOptions: any) => {
  return bootstrap(AppModule(bootstrapOptions), {
    production: true,
    appType: 'microfrontend',
  }).then((r) => {
    console.log('custom remote app bootstrap success!', r);
    return r;
  });
};
