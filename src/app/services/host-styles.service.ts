import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HostStylesService {
  private renderer: Renderer2;
  private isInitialized = false;
  private observer?: MutationObserver;
  private readonly STYLE_ID = 'host-encapsulated-styles';
  private isInjecting = false;

  private resyncTimeout: number | null = null;
  private readonly RESYNC_DELAY = 500; // ms (sweet spot)



  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  /**
   * Clone only host styles with Angular view encapsulation attributes
   * These are the styles that won't be available in the remote app
   */
  public initializeHostStyles(force = false): void {
    if (this.isInitialized && !force) {
      return;
    }

    console.log('[HostStylesService] Syncing (cloning) host encapsulated styles');
    
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
    }

    if (!this.isInitialized) {
      this.observeHeadForStyleChanges();
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
    this.isInjecting = true;
    const existing = document.getElementById(this.STYLE_ID);
    if (existing) {
      existing.remove();
    }

    const styleElement = this.renderer.createElement('style');
    styleElement.setAttribute('id', this.STYLE_ID);
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

    this.isInjecting = false;
    // console.log('Encapsulated host styles injected into <head>');
    // console.log('Style tag ID: host-encapsulated-styles');
  }

  private isRelevantStyleNode(node: Node): boolean {
    if (node.nodeName === 'STYLE') {
      const style = node as HTMLStyleElement;

      // Ignore our own injected style
      if (style.id === this.STYLE_ID) {
        return false;
      }

      // Angular component styles usually contain _ngcontent / _nghost
      return Boolean(
        style.textContent?.includes('_ngcontent-') ||
        style.textContent?.includes('_nghost-')
      );
    }

    // Optionally track lazy-loaded CSS chunks
    if (node.nodeName === 'LINK') {
      const link = node as HTMLLinkElement;
      return link.rel === 'stylesheet';
    }

    return false;
  }


  private scheduleResync(): void {
    if (this.resyncTimeout !== null) {
      return; // Already scheduled
    }

    this.resyncTimeout = window.setTimeout(() => {
      this.resyncTimeout = null;
      console.log('[HostStylesService] Debounced resync');
      this.initializeHostStyles(true);
    }, this.RESYNC_DELAY);
  }


  private observeHeadForStyleChanges(): void {
    this.observer = new MutationObserver((mutations) => {
      
      if (this.isInjecting) {
        return;
      }

      const affectsStyles = mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some((node) =>
          this.isRelevantStyleNode(node)
        )
      );

      
      if (affectsStyles){
        this.scheduleResync();
      }

    });

    this.observer.observe(document.head, {
      childList: true,
    });
  }
}
