import { Inject, Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NDEEvent, NDEEventBase } from '../decorators/nde-event.decorator';
import { GlobalHttpEventService } from '../services/global-http-event.service';
import { SHELL_ROUTER } from '../injection-tokens';

/**
 * Workaround for an NDE core bug: after switching language (e.g. en -> nl),
 * the top-menu links (Databanken / dbsearch, jsearch, ...) still carry the
 * language the page was loaded with. Clicking one puts `lang=en` back in the
 * URL while the UI stays in nl, so a browser refresh reverts the language.
 *
 * Fix: after every shell navigation, if the `lang` query param in the URL
 * differs from the language the user actually has active (TranslateService),
 * rewrite the URL in place (replaceUrl, no new history entry, no reload).
 *
 * The check runs one macrotask after NavigationEnd so that a genuine language
 * switch (which also navigates) has already updated TranslateService and is
 * never overridden.
 */
@NDEEvent({
  stream: 'all',
  enabled: true,
  description: 'Keep the lang URL param in sync with the active UI language',
})
@Injectable()
export class LangSyncEvent extends NDEEventBase implements OnDestroy {
  private navSub?: Subscription;
  private langSub?: Subscription;

  constructor(
    globalHttp: GlobalHttpEventService,
    @Inject(SHELL_ROUTER) private shellRouter: Router,
    private translate: TranslateService,
  ) {
    super(globalHttp);

    if (!this.shellRouter?.events) {
      console.warn('[LangSyncEvent] Shell router not available, skipping.');
      return;
    }

    this.navSub = this.shellRouter.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => setTimeout(() => this.syncUrlLang(), 0));

    // Also fix the URL right after a language switch, in case NDE changed
    // the UI language without updating the URL.
    this.langSub = this.translate.onLangChange.subscribe(() =>
      setTimeout(() => this.syncUrlLang(), 0),
    );
  }

  private syncUrlLang(): void {
    const activeLang = this.translate.currentLang;
    if (!activeLang) return; // translations not initialised yet

    const tree = this.shellRouter.parseUrl(this.shellRouter.url);
    const urlLang = tree.queryParams['lang'];
    if (!urlLang || urlLang === activeLang) return;

    console.log(
      `[LangSyncEvent] URL lang=${urlLang} but active lang=${activeLang}; correcting URL.`,
    );
    tree.queryParams = { ...tree.queryParams, lang: activeLang };
    this.shellRouter.navigateByUrl(tree, { replaceUrl: true });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.navSub?.unsubscribe();
    this.langSub?.unsubscribe();
  }
}
