/**
 * @NDEComponent Decorator
 * 
 * Auto-registers Angular components for NDE customization.
 * Eliminates the need to manually update customComponentMappings.ts
 * 
 * @example
 * ```typescript
 * @NDEComponent({
 *   selector: 'nde-search-bar',
 *   position: 'before'
 * })
 * @Component({
 *   selector: 'custom-search-banner',
 *   standalone: true,
 *   template: `<div>My Custom Banner</div>`
 * })
 * export class SearchBannerComponent {}
 * ```
 */

import 'reflect-metadata';

/**
 * Configuration options for @NDEComponent decorator
 */
export interface NDEComponentConfig {
  /**
   * The NDE component selector to hook into
   * @example 'nde-search-bar', 'nde-recommendations', 'nde-brief-result'
   */
  selector: string;
  
  /**
   * Position relative to the host component
   * - 'before': Renders before the host component
   * - 'after': Renders after the host component
   * - 'top': Renders at the top inside the host component
   * - 'bottom': Renders at the bottom inside the host component
   * - 'replace': Completely replaces the host component (default)
   */
  position?: 'before' | 'after' | 'top' | 'bottom' | 'replace';
  
  /**
   * Optional priority for ordering when multiple components target the same slot
   * Lower numbers = higher priority (rendered first)
   * Default: 100
   */
  priority?: number;
  
  /**
   * Optional description for documentation purposes
   */
  description?: string;
}

/**
 * Internal registry entry
 */
interface RegistryEntry {
  component: any;
  config: NDEComponentConfig;
  fullSelector: string;
}

/**
 * Internal component registry
 * Maps full selectors to component classes
 */
const componentRegistry = new Map<string, RegistryEntry>();

/**
 * Metadata key for storing NDE configuration on components
 */
const NDE_METADATA_KEY = 'nde:component:config';

/**
 * Decorator factory for NDE components
 */
export function NDEComponent(config: NDEComponentConfig) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    // Build the full selector with position suffix
    const fullSelector = buildFullSelector(config.selector, config.position);
    
    // Validate selector format
    if (!isValidSelector(fullSelector)) {
      console.warn(
        `[NDEComponent] Invalid selector "${fullSelector}". ` +
        `Selectors should start with "nde-" and use kebab-case.`
      );
    }
    
    // Store metadata on the class
    Reflect.defineMetadata(NDE_METADATA_KEY, {
      ...config,
      fullSelector
    }, constructor);
    
    // Register the component
    const entry: RegistryEntry = {
      component: constructor,
      config: {
        ...config,
        priority: config.priority ?? 100
      },
      fullSelector
    };
    
    // Check for duplicate registrations
    if (componentRegistry.has(fullSelector)) {
      const existing = componentRegistry.get(fullSelector)!;
      console.warn(
        `[NDEComponent] Selector "${fullSelector}" is already registered by ${existing.component.name}. ` +
        `Overwriting with ${constructor.name}.`
      );
    }
    
    componentRegistry.set(fullSelector, entry);

    // Log component registration with selector and position
    const position = config.position || 'replace';
    console.log(
      `[NDEComponent] Registered: ${constructor.name}\n` +
      `  Selector: ${config.selector}\n` +
      `  Position: ${position}\n` +
      `  Full Selector: ${fullSelector}`
    );

    return constructor;
  };
}

/**
 * Builds the full selector string with position suffix
 */
function buildFullSelector(selector: string, position?: string): string {
  if (!position || position === 'replace') {
    return selector;
  }
  return `${selector}-${position}`;
}

/**
 * Validates selector format
 */
function isValidSelector(selector: string): boolean {
  // Should start with 'nde-' and be kebab-case
  return /^nde-[a-z][a-z0-9-]*$/.test(selector);
}

/**
 * Get the component registry as a Map for use in customComponentMappings.ts
 * 
 * @example
 * ```typescript
 * // customComponentMappings.ts
 * import { getComponentRegistry } from '../decorators/nde-component.decorator';
 * 
 * // Import all components to trigger registration
 * import '../components/search-banner/search-banner.component';
 * import '../components/custom-footer/custom-footer.component';
 * 
 * export const selectorComponentMap = getComponentRegistry();
 * ```
 */
export function getComponentRegistry(): Map<string, any> {
  const map = new Map<string, any>();
  
  // Sort by priority and add to map
  const entries = Array.from(componentRegistry.values())
    .sort((a, b) => (a.config.priority ?? 100) - (b.config.priority ?? 100));
  
  for (const entry of entries) {
    map.set(entry.fullSelector, entry.component);
  }
  
  return map;
}

/**
 * Get detailed registry information for debugging
 */
export function getRegistryInfo(): RegistryEntry[] {
  return Array.from(componentRegistry.values())
    .sort((a, b) => (a.config.priority ?? 100) - (b.config.priority ?? 100));
}

/**
 * Clear the registry (useful for testing)
 */
export function clearRegistry(): void {
  componentRegistry.clear();
}

/**
 * Check if a selector is registered
 */
export function isRegistered(selector: string): boolean {
  return componentRegistry.has(selector);
}

/**
 * Get component metadata from a decorated class
 */
export function getNDEComponentConfig(component: any): NDEComponentConfig | undefined {
  return Reflect.getMetadata(NDE_METADATA_KEY, component);
}

/**
 * Utility to list all available NDE slots
 * These are the standard slots provided by NDE
 */
export const NDE_SLOTS = {
  // Global slots
  HEADER: 'nde-header',
  FOOTER: 'nde-footer',
  
  // Search related
  SEARCH_BAR: 'nde-search-bar',
  SEARCH_RESULTS: 'nde-search-results',
  TOP_BAR: 'nde-top-bar',
  
  // Record display
  BRIEF_RESULT: 'nde-brief-result',
  FULL_DISPLAY: 'nde-full-display',
  
  // Features
  RECOMMENDATIONS: 'nde-recommendations',
  FACETS: 'nde-facets',
  
  // Homepage
  HOMEPAGE: 'nde-homepage',

  //LOGO
  LOGO: 'nde-logo',
} as const;

export const NDE_POSITION = {
  AFTER: 'after',
  BEFORE: 'before',
  TOP: 'top',
  BOTTOM: 'bottom',
  REPLACE: ''
} as const;