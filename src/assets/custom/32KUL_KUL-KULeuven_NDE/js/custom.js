// console.log("Hello from custom.js");
// //  i wanted to import the style config ts file here but angular only allows module to do it,
// // check to create a bridge so in here we can do : window.APP_STYLE_CONFIG

// const TOPBAR_STYLE_MAP = {
//   thin: { height: "80px", minHeight: "80px", logoScale: 0.8 },
//   medium: { height: "120px", minHeight: "120px", logoScale: 1 },
//   thick: { height: "200px", minHeight: "200px", logoScale: 1.2 },
// };

// const STYLE_CONFIG = {
//   topbarSize: "thick", // match option from style-config.ts
//   topbarColor: "green", //  match option from style-config.ts
// };
// // issue witg this way is that we dont have intellisense
// (function () {
//   console.log("Applying styles with config form custom.js", STYLE_CONFIG);

//   const root = document.documentElement;
//   const topbarStyle = TOPBAR_STYLE_MAP[STYLE_CONFIG.topbarSize];

//   root.style.setProperty("--topbar-height", topbarStyle.height);
//   root.style.setProperty("--topbar-min-height", topbarStyle.minHeight);
//   root.style.setProperty("--topbar-logo-scale", String(topbarStyle.logoScale));

//   if (STYLE_CONFIG.topbarColor) {
//     root.style.setProperty("--topbar-bg-color", STYLE_CONFIG.topbarColor);
//   }

//   console.log("[custom.js]  Styles applied successfully");
// })();

// console.log("Hello from custom.js");

// // Wait for Angular to expose the config
// (function () {
//   const applyStyles = () => {
//     // Read config from window (set by Angular)
//     const STYLE_CONFIG = window.NDE_STYLE_CONFIG;
//     const TOPBAR_STYLE_MAP = window.NDE_TOPBAR_STYLE_MAP;

//     if (!STYLE_CONFIG || !TOPBAR_STYLE_MAP) {
//       console.warn("[custom.js] Config not ready yet, retrying...");
//       setTimeout(applyStyles, 50);
//       return;
//     }

//     console.log("[custom.js] Applying styles with config:", STYLE_CONFIG);

//     const root = document.documentElement;
//     const topbarStyle = TOPBAR_STYLE_MAP[STYLE_CONFIG.topbarSize];

//     root.style.setProperty("--topbar-height", topbarStyle.height);
//     root.style.setProperty("--topbar-min-height", topbarStyle.minHeight);
//     root.style.setProperty(
//       "--topbar-logo-scale",
//       String(topbarStyle.logoScale),
//     );

//     if (STYLE_CONFIG.topbarColor) {
//       root.style.setProperty("--topbar-bg-color", STYLE_CONFIG.topbarColor);
//     }

//     console.log("[custom.js] ✓ Styles applied successfully");
//   };

//   // Start trying to apply styles
//   applyStyles();
// })();
