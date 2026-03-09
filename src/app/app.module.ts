import { ApplicationRef, DoBootstrap, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { createCustomElement, NgElementConstructor } from '@angular/elements';
import { Router } from '@angular/router';
import { selectorComponentMap } from './custom1-module/customComponentMappings';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { AutoAssetSrcDirective } from './services/auto-asset-src.directive';
import { SHELL_ROUTER } from './injection-tokens';
import { InjectorTestComponent } from './injector-test/injector-test.component';
import { DEFAULT_STYLE_CONFIG, STYLE_CONFIG } from './config/style-config';

export const AppModule = ({
  providers,
  shellRouter,
}: {
  providers: any;
  shellRouter: Router;
}) => {
  @NgModule({
    declarations: [AppComponent, AutoAssetSrcDirective, InjectorTestComponent],
    exports: [AutoAssetSrcDirective],
    imports: [BrowserModule, CommonModule, TranslateModule.forRoot({})],
    providers: [
      ...providers,
      { provide: SHELL_ROUTER, useValue: shellRouter },
      { provide: STYLE_CONFIG, useValue: DEFAULT_STYLE_CONFIG },
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
    ) {
      router.dispose();
    }

    ngDoBootstrap(appRef: ApplicationRef) {
      for (const [key, value] of selectorComponentMap) {
        const customElement = createCustomElement(value, {
          injector: this.injector,
        });
        customElements.define(key, customElement);
      }
      // Mount the component to actually run it
      const el = document.createElement('nde-injector-test');
      document.body.appendChild(el); // now ngOnInit runs
      console.log('nde-theme-injector mounted');
    }

    public getComponentRef(componentName: string) {
      return this.webComponentSelectorMap.get(componentName);
    }
  }
  return AppModule;
};
