import { ApplicationRef, DoBootstrap, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { createCustomElement, NgElementConstructor } from '@angular/elements';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { SHELL_ROUTER } from './injection-tokens';
import { DEFAULT_STYLE_CONFIG, STYLE_CONFIG } from './config/style-config';
import { getEventProviders } from './decorators/nde-event.decorator';
import './events/style-config.event';

import { GlobalHttpEventService } from './services/global-http-event.service';
export const AppModule = ({
  providers,
  shellRouter,
}: {
  providers: any;
  shellRouter: Router;
}) => {
  @NgModule({
    declarations: [AppComponent],
    exports: [],
    imports: [BrowserModule, CommonModule, TranslateModule.forRoot({})],
    providers: [
      ...providers,
      GlobalHttpEventService,
      { provide: SHELL_ROUTER, useValue: shellRouter },
      { provide: STYLE_CONFIG, useValue: DEFAULT_STYLE_CONFIG },
      ...getEventProviders(),
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

    ngDoBootstrap(appRef: ApplicationRef) {}

    public getComponentRef(componentName: string) {
      return this.webComponentSelectorMap.get(componentName);
    }
  }
  return AppModule;
};
