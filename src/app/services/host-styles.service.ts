import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HostStylesService {
  private renderer: Renderer2;
  private isInitialized = false;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  /**
   * Clone only host styles with Angular view encapsulation attributes
   * These are the styles that won't be available in the remote app
   */
  public initializeHostStyles(): void {
    if (this.isInitialized) {
      console.log('Host encapsulated styles already initialized');
      return;
    }

    console.log('[HostStylesService] Cloning encapsulated host styles...');

    const styleMap = new Map<string, string>();

    // Extract styles from loaded stylesheets
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        const rules = Array.from(sheet.cssRules) as CSSRule[];

        rules.forEach((rule) => {
          if (rule instanceof CSSStyleRule) {
            const selector = rule.selectorText;
            const cssText = rule.style.cssText;

            // Only clone selectors with view encapsulation attributes
            if (this.hasViewEncapsulationAttribute(selector)) {
              styleMap.set(selector, cssText);
              // console.log(`Found encapsulated: ${selector}`);
            }
          }
        });
      } catch (e) {
        // CORS or other restrictions on external stylesheets
        console.warn('Cannot access stylesheet!:', e);
      }
    });

    // console.log(`Extracted ${styleMap.size} encapsulated style rules`);

    if (styleMap.size > 0) {
      this.injectStylesToDocument(styleMap);
    } else {
      console.warn('No encapsulated styles found to clone');
    }

    this.isInitialized = true;
  }

  /**
   * Check if selector has Angular view encapsulation attributes
   * Examples:
   *   [_ngcontent-ng-c123456]
   *   [_nghost-ng-c123456]
   */
  private hasViewEncapsulationAttribute(selector: string): boolean {
    return /\[_ngcontent-[a-z0-9-]+\]|\[_nghost-[a-z0-9-]+\]/.test(selector);
  }

  private injectStylesToDocument(styleMap: Map<string, string>): void {
    const styleElement = this.renderer.createElement('style');
    styleElement.setAttribute('id', 'host-encapsulated-styles');
    styleElement.setAttribute('type', 'text/css');

    let cssText = '/* Host Encapsulated Styles (Cloned to Remote) */\n';
    cssText += '/* These styles were hidden by Angular ViewEncapsulation */\n\n';

    styleMap.forEach((styles, selector) => {
      // Remove Angular view encapsulation attributes
      const cleanedSelector = selector
        .replace(/\[_ngcontent-[a-z0-9-]+\]/g, '')
        .replace(/\[_nghost-[a-z0-9-]+\]/g, '');

      cssText += `${cleanedSelector} {\n`;
      cssText += `  ${styles}\n`;
      cssText += `}\n\n`;
    });

    styleElement.textContent = cssText;
    this.renderer.appendChild(document.head, styleElement);

    // console.log('Encapsulated host styles injected into <head>');
    // console.log('Style tag ID: host-encapsulated-styles');
  }
}