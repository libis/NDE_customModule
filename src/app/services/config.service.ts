
import { Injectable } from '@angular/core';

export interface BootstrapConfig {
  [key: string]: unknown; // flexible for future keys
  vid?: string;
  dashedVid?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config: BootstrapConfig = {};

  setConfig(cfg: BootstrapConfig) {
    this.config = cfg;
  }

  getConfig(): BootstrapConfig {
    return this.config;
  }

  // Optional helpers for common keys
  /*
  get vid(): string | undefined {
    return typeof this.config.vid === 'string' ? this.config.vid : undefined;
  }

  get dashedVid(): string | undefined {
    return typeof this.config.dashedVid === 'string' ? this.config.dashedVid : undefined;
  }
  */
  getValue<T = unknown>(key: string): T | undefined {
    return this.config[key] as T | undefined;
  }
}
