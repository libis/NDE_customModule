import {
  ApplicationRef,
  DoBootstrap,
  Injector,
  inject,
  NgModule,
  provideAppInitializer,
  Provider
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { createCustomElement, NgElementConstructor } from '@angular/elements';
import { Router } from '@angular/router';
import { selectorComponentMap } from '@nde/component-mappings';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { AutoAssetSrcDirective } from './services/auto-asset-src.directive';
import { SHELL_ROUTER } from './injection-tokens';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { getInterceptorProviders } from './decorators/nde-interceptor.decorator';
import { getEventProviders } from './decorators/nde-event.decorator';
import { GlobalHttpEventService } from './services/global-http-event.service';
import { AnalyticsService } from './services/analytics.service';
import { loadExternalScripts } from './services/script-loader.service';
import { LibisLoadingOverlayService } from './services/libis-loading-overlay.service';
import { provideLottieOptions } from 'ngx-lottie';
import player from 'lottie-web';
import './interceptors/_registry';
import './events/_registry';

interface ValueProviderLike {
  provide: unknown;
  useValue: unknown;
}

export const AppModule = ({
  providers,
  shellRouter,
}: {
  providers: any;
  shellRouter: Router;
}) => {

  const hostTranslateService =
    findHostTranslateService(providers);

  console.log(
    '[AppModule] host TranslateService:',
    hostTranslateService
  );

  const remoteProviders: Provider[] = [
    ...providers,

    {
      provide: SHELL_ROUTER,
      useValue: shellRouter,
    },
  ];

  /*
   * Bridge the TranslateService instance supplied by Primo
   * to the TranslateService token imported by this remote.
   *
   * This is needed when host and remote have different
   * @ngx-translate/core token identities.
   */
  if (hostTranslateService) {
    remoteProviders.push({
      provide: TranslateService,
      useValue: hostTranslateService,
    });
  } else {
    console.warn(
      '[AppModule] Primo did not provide a recognizable ' +
      'TranslateService instance.'
    );
  }


  @NgModule({
    declarations: [AutoAssetSrcDirective],
    exports: [AutoAssetSrcDirective],
    imports: [BrowserModule, CommonModule, TranslateModule],
    providers: [
      ...providers,
      { provide: SHELL_ROUTER, useValue: shellRouter },
      provideHttpClient(withInterceptorsFromDi()),
      ...getInterceptorProviders(),
      GlobalHttpEventService,
      provideLottieOptions({
        player: () => player,
      }),
      ...getEventProviders(),
      provideAppInitializer(loadExternalScripts),
      provideAppInitializer(() => inject(LibisLoadingOverlayService).show()),
      remoteProviders
    ],
    bootstrap: [],
  })


  class AppModule implements DoBootstrap {
    private webComponentSelectorMap = new Map<
      string,
      NgElementConstructor<unknown>
    >();

    constructor(
      private injector: Injector,
      private router: Router,
      globalHttp: GlobalHttpEventService,
      analytics: AnalyticsService,
    ) {
      router.dispose(); //this prevents the router from being initialized and interfering with the shell app router


      const translate = this.injector.get(
        TranslateService,
        null
      );

      // Wire analytics tracking to the global HTTP event stream
      globalHttp.all$.subscribe((event) => {
        analytics.track({
          type: event.type,
          method: event.method,
          url: event.url,
          timestamp: event.timestamp,
          duration: event.duration,
          status: event.status,
          error: event.error,
        });
      });
    }

    ngDoBootstrap(appRef: ApplicationRef) {
      for (const [key, value] of selectorComponentMap) {
        try {
          const customElement = createCustomElement(value, {
            injector: this.injector,
          });
          this.webComponentSelectorMap.set(key, customElement);
          console.log(`[AppModule] Registered custom element: ${key}`);
        } catch (error) {
          console.warn(
            `[AppModule] Failed to register custom element: ${key}`,
            error,
          );
        }
      }
    }

    /**
     * Use componentMapping, selectorComponentMap
     * @param componentName
     */
    public getComponentRef(componentName: string) {
      return this.webComponentSelectorMap.get(componentName);
    }
  }
  return AppModule;
};


/**
 * Identify the TranslateService supplied by the host based on
 * its public API rather than its constructor/token name.
 *
 * Production minification changes names such as
 * TranslateService into short names such as "W".
 */
function findHostTranslateService(
  providers: Provider[]
): TranslateService | null {

  for (const provider of providers) {
    if (!isValueProvider(provider)) {
      continue;
    }

    const value = provider.useValue;

    if (isTranslateServiceLike(value)) {
      console.log(
        '[findHostTranslateService] found host translation provider:',
        provider
      );

      console.log(
        '[findHostTranslateService] host token equals remote token:',
        provider.provide === TranslateService
      );

      return value as TranslateService;
    }
  }

  return null;
}

function isValueProvider(
  provider: Provider
): provider is ValueProviderLike & Provider {
  return (
    provider !== null &&
    typeof provider === 'object' &&
    'provide' in provider &&
    'useValue' in provider
  );
}


// duck test
function isTranslateServiceLike(
  value: unknown
): boolean {
  if (
    value === null ||
    typeof value !== 'object'
  ) {
    return false;
  }

  const candidate = value as {
    store?: unknown;
    instant?: unknown;
    get?: unknown;
    use?: unknown;
    getLangs?: unknown;
  };

  return (
    candidate.store !== undefined &&
    typeof candidate.instant === 'function' &&
    typeof candidate.get === 'function' &&
    typeof candidate.use === 'function' &&
    typeof candidate.getLangs === 'function'
  );
}