import {ApplicationRef, DoBootstrap, inject, Injector, NgModule, APP_INITIALIZER} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {createCustomElement, NgElementConstructor} from "@angular/elements";
import {Router} from "@angular/router";
import {selectorComponentMap} from "./custom1-module/customComponentMappings";
import {sharedComponentMap} from "./components/shared/index";
import {TranslateModule} from "@ngx-translate/core";
import {CommonModule } from '@angular/common';
import {AutoAssetSrcDirective } from './services/auto-asset-src.directive';
import {SHELL_ROUTER} from "./injection-tokens";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { getInterceptorProviders } from './decorators/nde-interceptor.decorator';
import { getEventProviders } from './decorators/nde-event.decorator';
import { GlobalHttpEventService } from './services/global-http-event.service';
import { AnalyticsService } from './services/analytics.service';
import { HostStylesService } from './services/host-styles.service' // Copy styles
import { initApp } from './app.initializer';
import { ConfigService } from './services/config.service';
import './interceptors/_registry';
import './events/_registry';

export const AppModule = ({providers, shellRouter}: {providers:any, shellRouter: Router}) => {
   @NgModule({
    declarations: [
      AutoAssetSrcDirective
    ],
    exports: [AutoAssetSrcDirective],
    imports: [
      BrowserModule,
      CommonModule,
      TranslateModule.forRoot({})
    ],
    providers: [
      ...providers,
      {provide: SHELL_ROUTER, useValue: shellRouter}, 

      HostStylesService,
      {
        provide: APP_INITIALIZER,
        useFactory: (hostStylesService: HostStylesService) => {
          return () => hostStylesService.initializeHostStyles();
        },
        deps: [HostStylesService],
        multi: true,
      },
      
      {
        provide: APP_INITIALIZER,
        useFactory: initApp,
        deps: [ConfigService],
        multi: true,
      },
      provideHttpClient(withInterceptorsFromDi()), 
      ...getInterceptorProviders(), 
      GlobalHttpEventService, 
      ...getEventProviders()
    ],
    bootstrap: []
  })
  class AppModule implements DoBootstrap{
    private webComponentSelectorMap = new Map<string,  NgElementConstructor<unknown>>();

    constructor(private injector: Injector, private router: Router, globalHttp: GlobalHttpEventService, analytics: AnalyticsService) {
      router.dispose(); //this prevents the router from being initialized and interfering with the shell app router

      // Wire analytics tracking to the global HTTP event stream
      globalHttp.all$.subscribe(event => {
        analytics.track({
          type: event.type,
          method: event.method,
          url: event.url,
          timestamp: event.timestamp,
          duration: event.duration,
          status: event.status,
          error: event.error
        });
      });
    }
  

    ngDoBootstrap(appRef: ApplicationRef) {
    
      /* TEST Maar werkt niet
      const combinedComponentMap = new Map<string, any>([
        ...sharedComponentMap,
        ...selectorComponentMap
      ]); // (selector overrides shared)
      */

      // const combinedComponentMap = selectorComponentMap;

      /*
       Create webcomponents to use inside the remote Angular Components 
       (Angular Components are converted tp Web Components in the host 
       code\host\source\src_bootstrap_ts.c52827332bfd336c\src\app\components\base-custom\web-component-wrapper.component.ts) 
      */
      for (const [key, value] of sharedComponentMap) {
        const customWebComponent = createCustomElement(value, {injector: this.injector});
        customElements.define(key, customWebComponent);
      }

      for (const [key, value] of selectorComponentMap) {
        try {
          const customElement = createCustomElement(value, {injector: this.injector});
          this.webComponentSelectorMap.set(key, customElement);
          console.log(`[AppModule] Registered custom element: ${key}`);
        } catch (error) {
          console.warn(`[AppModule] Failed to register custom element: ${key}`, error);
        }
      }
    }

    /**
     * Use componentMapping, selectorComponentMap
     * @param componentName
     */
    public getComponentRef(componentName:string) {
      return this.webComponentSelectorMap.get(componentName);
    }
  }
  return AppModule
}

