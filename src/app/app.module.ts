import {ApplicationRef, DoBootstrap, inject, Injector, NgModule, APP_INITIALIZER} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';
import {createCustomElement, NgElementConstructor} from "@angular/elements";
import {Router} from "@angular/router";
import {selectorComponentMap} from "./custom1-module/customComponentMappings";
import {TranslateModule} from "@ngx-translate/core";
import {CommonModule } from '@angular/common';
import {AutoAssetSrcDirective } from './services/auto-asset-src.directive';
import {SHELL_ROUTER} from "./injection-tokens";
import { ConfigService } from './services/config.service';
import { initApp } from './app.initializer';

export const AppModule = ({providers, shellRouter}: {providers:any, shellRouter: Router}) => {
   @NgModule({
    declarations: [
      AppComponent,
      AutoAssetSrcDirective
    ],
    exports: [AutoAssetSrcDirective],
    imports: [
      BrowserModule,
      CommonModule,
      TranslateModule.forRoot({})
    ],
    providers: [...providers, 
      {provide: SHELL_ROUTER, useValue: shellRouter}, 
      ConfigService,
      { provide: APP_INITIALIZER, multi: true, useFactory: initApp, deps: [ConfigService] }
    ],
    bootstrap: []
  })
  class AppModule implements DoBootstrap{
    private webComponentSelectorMap = new Map<string,  NgElementConstructor<unknown>>();

    constructor(private injector: Injector, private router: Router, private config: ConfigService) {
      router.dispose(); //this prevents the router from being initialized and interfering with the shell app router
    }
  

    ngDoBootstrap(appRef: ApplicationRef) {
      let currentVid = this.config.getValue("vid")
      console.log ( "currentVid:"+ currentVid  )
      if (typeof currentVid === 'string') {
        for (const [vid_regex, mapping] of selectorComponentMap) {
          console.log ( "currentVid:"+ currentVid  )
          if ( currentVid.match(vid_regex) ) {
            // console.log ("MAPPING element:" + mapping.element)
            // console.log ("MAPPING component:" + mapping.component)
            const customElement = createCustomElement(mapping.component, {injector: this.injector});
            this.webComponentSelectorMap.set(mapping.element, customElement);
          } 
        }
      }else{
        console.warn("Invalid vid type:", currentVid);
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

