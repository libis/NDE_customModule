
import { ConfigService } from './services/config.service';

export function initApp(configService: ConfigService) {
  return () => {
    const cfg = window.__BOOTSTRAP_CFG__ ?? {};
    configService.setConfig(cfg);
    return Promise.resolve(); // Could also fetch from API if needed
  };
}
