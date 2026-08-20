const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const mf = require("@angular-architects/module-federation/webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");
const webpack = require("webpack");
const fs = require("fs");
const share = mf.share;
const shareAll = mf.shareAll;


const {
  resolveEnv,
  writeIfChanged,
} = require("./nde/env.cjs");


const sharedMappings = new mf.SharedMappings();
sharedMappings.register(path.join(__dirname, "tsconfig.json"), [
  /* mapped paths to share */
]);


const {
  ndeConfig,
  selectedEnv,
  envConfig: environmentCfg,
  isCentral,
  buildTarget,
  view,
  generatedMappingsPath,
} = resolveEnv();

console.log(`\n👉 webpack env: ${selectedEnv}`);
console.log("################ START BUILDING WITH #################################");
console.log(environmentCfg);
console.log("######################################################################");


const componentsCfg = discoveryOptions("components", "src/app/components");
const interceptorsCfg = discoveryOptions("interceptors", "src/app/interceptors");
const eventsCfg = discoveryOptions("events", "src/app/events");

function discoveryOptions(key, defaultDir) {
  const cfg = ndeConfig[key] || {};
  return {
    autoRegister: cfg.autoRegister !== false,
    directory: path.resolve(__dirname, cfg.directory || defaultDir),
  };
}

const customComponentMappings = generatedMappingsPath;

/**
 * Webpack plugin that auto-generates component imports in customComponentMappings.ts.
 * Scans the components directory before each compilation so `ng build` and `ng serve`
 * both pick up new components without a separate prebuild step.
 */
class NdeComponentDiscoveryPlugin {
  constructor(options = {}) {
    // central | view
    this.buildTarget = options.buildTarget || "central";;

    // bv. kuleuven, vives
    this.view = options.view || null;

    this.baseComponentsDir =
      options.baseComponentsDir || path.resolve(__dirname, "src/app/components");
    this.mappingsFile = options.mappingsFile
    this.mappingsDir = path.dirname(this.mappingsFile);

  }

  apply(compiler) {
    compiler.hooks.beforeRun.tapAsync(
      "NdeComponentDiscoveryPlugin",
      (params, callback) => {
        try {
         
          const content = this.generateMappingsContent();

          // Only write when content actually changed to avoid unnecessary recompilation
          const existing = fs.existsSync(this.mappingsFile)
            ? fs.readFileSync(this.mappingsFile, "utf8")
            : "";
          if (existing !== content) {

            fs.writeFileSync(this.mappingsFile, content);
            console.log(
              `[NdeComponentDiscovery] Write mappings with component(s) to ${this.mappingsFile}`,
            );

          }
        } catch (err) {
          console.error("[NdeComponentDiscovery] Error:", err);
        }
        callback();
      },
    );
  }

  findComponentFiles(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.findComponentFiles(full, files);
      } else if (
        entry.name.endsWith(".component.ts") &&
        !entry.name.endsWith(".spec.ts")
      ) {
        files.push(full);
      }
    }
    return files;
  }

  getScanDirs() {
    const dirs = [];

    const sharedDir = path.join(this.baseComponentsDir, "shared");
    const centralDir = path.join(this.baseComponentsDir, "central");

    console.info(
        `\n[NdeComponentDiscovery] Add Share directory: ${sharedDir}`
      );

    if (fs.existsSync(sharedDir)) dirs.push(sharedDir);
   
    if (this.buildTarget === "view" && this.view) {
      const viewDir = path.join(this.baseComponentsDir, "views", this.view);
      if (fs.existsSync(viewDir)) {

        console.info(
          `\n[NdeComponentDiscovery] Add View directory: ${viewDir}`
        );
        dirs.push(viewDir);
      } else {
        console.warn(
          `\n[NdeComponentDiscovery] View directory not found: ${viewDir}`
        );
      }
    }
    if (this.buildTarget === "central" ) {
      console.info(
          `\n[NdeComponentDiscovery] Add Central directory: ${centralDir}`
        );
      if (fs.existsSync(centralDir)) dirs.push(centralDir);
    }
    return dirs;
  }

  generateMappingsContent() {
     console.info(
        `\n[NdeComponentDiscovery] generateMappingsContent for: ${this.buildTarget} ${this.view}`
      );

    const scanDirs = this.getScanDirs();
    const componentFiles = [];

    for (const dir of scanDirs) {
      this.findComponentFiles(dir, componentFiles);
    }

    componentFiles.sort();

    const imports = componentFiles.map((file) => {
      let rel = path
        .relative(this.mappingsDir, file)
        .replace(/\\/g, "/");

      if (!rel.startsWith(".")) {
        rel = "./" + rel;
      }

      return `import '${rel.replace(/\.ts$/, "")}';`;
    });

    return `import { getComponentRegistry } from '../../../src/app/decorators/nde-component.decorator';

// Auto-generated component imports - DO NOT EDIT
// Generated by NdeComponentDiscoveryPlugin
// Freeze key: ${this.freezeKey}
// Build target: ${this.buildTarget}
// View: ${this.view ?? ""}

${imports.join("\n")}

// Export the auto-populated registry
export const selectorComponentMap = getComponentRegistry();

console.log('[ComponentMappings] Build target:', '${this.buildTarget}');
console.log('[ComponentMappings] View:', '${this.view ?? ""}');
console.log('[ComponentMappings] Registry size:', selectorComponentMap.size);
console.log('[ComponentMappings] Registered components:', Array.from(selectorComponentMap.keys()));
`;
  }


}

/**
 * Webpack plugin that auto-generates interceptor imports in _registry.ts.
 * Scans the interceptors directory before each compilation so `ng build` and `ng serve`
 * both pick up new interceptors without manual imports in app.module.ts.
 */
class NdeInterceptorDiscoveryPlugin {
  constructor(options = {}) {
    this.interceptorsDir =
      options.interceptorsDir ||
      path.resolve(__dirname, "src/app/interceptors");
    this.registryFile =
      options.registryFile || path.join(this.interceptorsDir, "_registry.ts");
    this.registryDir = path.dirname(this.registryFile);
  }

  apply(compiler) {
    compiler.hooks.beforeCompile.tapAsync(
      "NdeInterceptorDiscoveryPlugin",
      (params, callback) => {
        try {
          const imports = this.findInterceptorFiles(this.interceptorsDir).map(
            (file) => {
              let rel = path
                .relative(this.registryDir, file)
                .replace(/\\/g, "/");
              if (!rel.startsWith(".")) rel = "./" + rel;
              return `import '${rel.replace(/\.ts$/, "")}';`;
            },
          );

          const content = `// Auto-generated interceptor imports — DO NOT EDIT
// Generated by NdeInterceptorDiscoveryPlugin (webpack.config.js)
${imports.join("\n")}
`;

          const existing = fs.existsSync(this.registryFile)
            ? fs.readFileSync(this.registryFile, "utf8")
            : "";
          if (existing !== content) {
            fs.writeFileSync(this.registryFile, content);
            console.log(
              `[NdeInterceptorDiscovery] Updated registry with ${imports.length} interceptor file(s)`,
            );
          }
        } catch (err) {
          console.error("[NdeInterceptorDiscovery] Error:", err);
        }
        callback();
      },
    );
  }

  findInterceptorFiles(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.findInterceptorFiles(full, files);
      } else if (
        entry.name.endsWith(".interceptor.ts") &&
        !entry.name.endsWith(".spec.ts") &&
        entry.name !== "_registry.ts"
      ) {
        files.push(full);
      }
    }
    return files;
  }
}

/**
 * Webpack plugin that auto-generates event imports in _registry.ts.
 * Scans the events directory before each compilation so `ng build` and `ng serve`
 * both pick up new events without manual imports.
 */
class NdeEventDiscoveryPlugin {
  constructor(options = {}) {
    this.eventsDir =
      options.eventsDir || path.resolve(__dirname, "src/app/events");
    this.registryFile =
      options.registryFile || path.join(this.eventsDir, "_registry.ts");
    this.registryDir = path.dirname(this.registryFile);
  }

  apply(compiler) {
    compiler.hooks.beforeCompile.tapAsync(
      "NdeEventDiscoveryPlugin",
      (params, callback) => {
        try {
          const imports = this.findEventFiles(this.eventsDir).map((file) => {
            let rel = path
              .relative(this.registryDir, file)
              .replace(/\\/g, "/");
            if (!rel.startsWith(".")) rel = "./" + rel;
            return `import '${rel.replace(/\.ts$/, "")}';`;
          });

          const content = `// Auto-generated event imports — DO NOT EDIT
// Generated by NdeEventDiscoveryPlugin (webpack.config.js)
${imports.join("\n")}
`;

          const existing = fs.existsSync(this.registryFile)
            ? fs.readFileSync(this.registryFile, "utf8")
            : "";
          if (existing !== content) {
            fs.writeFileSync(this.registryFile, content);
            console.log(
              `[NdeEventDiscovery] Updated registry with ${imports.length} event file(s)`,
            );
          }
        } catch (err) {
          console.error("[NdeEventDiscovery] Error:", err);
        }
        callback();
      },
    );
  }

  findEventFiles(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.findEventFiles(full, files);
      } else if (
        entry.name.endsWith(".event.ts") &&
        !entry.name.endsWith(".spec.ts") &&
        entry.name !== "_registry.ts"
      ) {
        files.push(full);
      }
    }
    return files;
  }
}

const exposes = isCentral
  ? {
      './CustomModuleCentral': './src/bootstrap.ts',
    }
  : {
      './custom-module': './src/bootstrap.ts',
    };



module.exports = {
  context: path.resolve(__dirname), // Sets the context to the directory where webpack.config.js is
  output: {
    uniqueName:  isCentral ? 'CustomModuleCentral' : 'CustomModule',
    publicPath: "auto",
  },
  optimization: {
    minimize: true,
    runtimeChunk: false,
  },
  resolve: {
    alias: {
      ...sharedMappings.getAliases(),
      '@nde/component-mappings': customComponentMappings
    },
  },
  experiments: {
    outputModule: true,
  },
  module: {
    rules: [
      // ... other rules ...
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    ...(componentsCfg.autoRegister
      ? [new NdeComponentDiscoveryPlugin({ 
          baseComponentsDir: componentsCfg.directory,
          buildTarget: buildTarget,
          view: view,
          mappingsFile: customComponentMappings
      })]
      : []),
    ...(interceptorsCfg.autoRegister
      ? [new NdeInterceptorDiscoveryPlugin({ interceptorsDir: interceptorsCfg.directory })]
      : []),
    ...(eventsCfg.autoRegister
      ? [new NdeEventDiscoveryPlugin({ eventsDir: eventsCfg.directory })]
      : []),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "src/assets",
          to: "assets",
          noErrorOnMissing: true,
          globOptions: {
            ignore: [
              "**/.gitkeep", // Make sure this matches exactly the files you want to exclude
              "**/.*", // This pattern excludes all hidden files
            ],
          },
        }, // Adjust the paths as needed
      ],
    }),
    // DISABLE ngDevMode as it is not needed in a remoteEntry work around for issue: https://github.com/angular-architects/module-federation-plugin/issues/458
    // new webpack.DefinePlugin({
    //   ngDevMode: "undefined",
    // }),
    // END DISABLE ngDevMode as it is not needed in a remoteEntry
    new ModuleFederationPlugin({
      library: { type: "module" },

      // For remotes (please adjust)
      name: isCentral ? 'CustomModuleCentral' : 'CustomModule',
      filename: "remoteEntry.js",
      exposes,

      // For hosts (please adjust)
      // remotes: {
      //     "mfe1": "http://localhost:3000/remoteEntry.js",

      // },

      shared: share({
        "@angular/core":              { requiredVersion: "auto" },
        "@angular/common":            { requiredVersion: "auto" },
        "@angular/router":            { requiredVersion: "auto" },
        "@angular/common/http":       { requiredVersion: "auto" },
        "@angular/platform-browser":  { requiredVersion: "auto" },
        "@angular/material":          { requiredVersion: "auto" },
        "rxjs":                       { requiredVersion: "auto" },      
        "@ngx-translate/core":        { singleton: true },
        "@ngrx/store":                { singleton: true },          
        "@libis/primo-shared-state":  { singleton: true, strictVersion: false },
        ...sharedMappings.getDescriptors(),
      }),
    }),
    sharedMappings.getPlugin(),
  ],
};
