// script-loader.service.ts
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export interface ExternalScript {
  name: string;
  script: string;
}

export const EXTERNAL_SCRIPTS: ExternalScript[] = [
  {
    name: 'Altmetric',
    script: 'https://embed.altmetric.com/assets/embed.js',
  },
];

@Injectable({ providedIn: 'root' })
export class ScriptLoaderService {
  private readonly document = inject(DOCUMENT);
  private readonly cache = new Map<string, Promise<void>>();
  private readonly _loadedNames = signal<ReadonlySet<string>>(new Set());

  readonly loadedNames = this._loadedNames.asReadonly();

  load(src: string): Promise<void> {
    const cached = this.cache.get(src);
    if (cached) return cached;

    const promise = new Promise<void>((resolve, reject) => {
      const script = this.document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      this.document.head.appendChild(script);
    });

    this.cache.set(src, promise);
    return promise;
  }

  markLoaded(name: string) {
    const next = new Set(this._loadedNames());
    next.add(name);
    this._loadedNames.set(next);
  }

  isLoaded(name: string): Signal<boolean> {
    return computed(() => this._loadedNames().has(name));
  }
}

export function loadExternalScripts() {
  const loader = inject(ScriptLoaderService);
  return Promise.all(
    EXTERNAL_SCRIPTS.map((externalScript) =>
      loader
        .load(`${externalScript.script}?${Date.now()}`)
        .then(() => {
          loader.markLoaded(externalScript.name);
          console.log(`${externalScript.name} loaded`);
        })
        .catch((err) =>
          console.warn(`Failed to load ${externalScript.name}`, err),
        ),
    ),
  );
}
