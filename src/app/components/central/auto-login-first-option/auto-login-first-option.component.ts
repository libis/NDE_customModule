import { Component, Input, OnInit, Inject } from '@angular/core';
import { NDEComponent } from 'src/app/decorators/nde-component.decorator';
import {
  STYLE_CONFIG,
  StyleConfig,
  BooleanOrViews,
} from '../../../config/style-config';

@NDEComponent({
  selector: 'nde-header',
  position: 'after',
})
@Component({
  selector: 'nde-auto-login-first-option',
  template: '',
})
export class AutoLoginFirstOptionComponent implements OnInit {
  @Input() hostComponent!: any;

  constructor(@Inject(STYLE_CONFIG) private config: StyleConfig) {}

  private get currentView(): string {
    return new URLSearchParams(window.location.search).get('vid') ?? '';
  }

  private isActive(value?: BooleanOrViews): boolean {
    if (!value) return false;
    if (value === true) return true;
    return value.includes(this.currentView);
  }

  ngOnInit(): void {
    if (!this.isActive(this.config.AutoLoginFirstOption)) return;

    console.log('[AutoLogin] init for:', this.currentView);

    const profileMap: Record<string, string> = {
      '32KUL_LIBS:LIBS': 'Alma',
      '32KUL_LIBS:RVAONEM': 'RVA_AZURE',
      '32KUL_LIBS:PLEC': 'Alma',
    };

    const targetProfile = profileMap[this.currentView];
    if (!targetProfile) return;

    //  Hook into "Sign in" button
    const observer = new MutationObserver(() => {
      const button = document.querySelector('button[aria-label="Sign In"]');

      if (button) {
        console.log('[AutoLogin] Sign-in button found');

        button.addEventListener('click', () => {
          console.log('[AutoLogin] Sign-in clicked');

          // give time for login dialog to render
          setTimeout(() => this.tryAutoLogin(targetProfile), 200);
        });

        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  private tryAutoLogin(targetProfile: string) {
    //  Find login component dynamically
    const loginEl = document.querySelector('nde-login');

    if (!loginEl) {
      console.log('[AutoLogin] login component not found');
      return;
    }

    //  Angular internal access
    const cmp = (loginEl as any).__ngContext__?.[8];

    if (!cmp?.authenticationMethods) {
      console.log('[AutoLogin] auth methods not ready');
      return;
    }

    console.log('[AutoLogin] filtering for:', targetProfile);

    const filtered = cmp.authenticationMethods.filter(
      (m: any) => m.profileName === targetProfile,
    );

    cmp.authenticationMethods = filtered;

    if (filtered.length > 0) {
      console.log('[AutoLogin] triggering login:', targetProfile);
      cmp.handleLoginClick(filtered[0]);
    } else {
      console.log('[AutoLogin] no matching profile found');
    }
  }
}
