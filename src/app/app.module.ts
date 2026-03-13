import {ApplicationRef, DoBootstrap, inject, Injector, NgModule, APP_INITIALIZER} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {createCustomElement, NgElementConstructor} from "@angular/elements";
import {Router} from "@angular/router";
import {selectorComponentMap} from "./custom1-module/customComponentMappings";
import {TranslateModule} from "@ngx-translate/core";
import {CommonModule } from '@angular/common';
import {AutoAssetSrcDirective } from './services/auto-asset-src.directive';
import {SHELL_ROUTER} from "./injection-tokens";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { getInterceptorProviders } from './decorators/nde-interceptor.decorator';
import { getEventProviders } from './decorators/nde-event.decorator';
import { GlobalHttpEventService } from './services/global-http-event.service';
import { AnalyticsService } from './services/analytics.service';
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

