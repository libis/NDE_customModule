// MUST be first — patches XHR/fetch BEFORE any Angular or host HTTP calls
import { installGlobalHttpInterceptor } from './app/services/global-http-interceptor';
installGlobalHttpInterceptor();

// import './app/custom1-module/customComponentMappings';
import '@angular/compiler';
import { AppModule } from './app/app.module';
import { bootstrap } from '@angular-architects/module-federation-tools';

export const bootstrapRemoteApp = (bootstrapOptions: any) => {
  console.log(
    '[bootstrapRemoteApp] options:',
    bootstrapOptions,
  );

  console.log(
    '[bootstrapRemoteApp] provider count:',
    bootstrapOptions?.providers?.length ?? 0,
  );

  console.log(
    '[bootstrapRemoteApp] providers:',
    bootstrapOptions?.providers,
  );

  return bootstrap(
    AppModule(bootstrapOptions),
    {
      production: true,
      appType: 'microfrontend',
    },
  ).then(result => {
    console.log(
      'custom remote app bootstrap success!', 
      result,
    );

    return result;
  });
};
