import {ApplicationRef, DoBootstrap, Injector, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {createCustomElement, NgElementConstructor} from "@angular/elements";
import {Router} from "@angular/router";
import {selectorComponentMap} from "./custom1-module/customComponentMappings";
import {TranslateModule} from "@ngx-translate/core";
import { CommonModule } from '@angular/common';
import { AutoAssetSrcDirective } from './services/auto-asset-src.directive';
import {SHELL_ROUTER} from "./injection-tokens";
import { getInterceptorProviders } from './decorators/nde-interceptor.decorator';
import './interceptors/_registry';

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
    providers: [...providers, {provide: SHELL_ROUTER, useValue: shellRouter}, ...getInterceptorProviders()],
    bootstrap: []
  })
  class AppModule implements DoBootstrap{
    private webComponentSelectorMap = new Map<string,  NgElementConstructor<unknown>>();

    constructor(private injector: Injector, private router: Router) {
      router.dispose(); //this prevents the router from being initialized and interfering with the shell app router
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

