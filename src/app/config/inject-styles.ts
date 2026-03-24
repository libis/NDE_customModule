// import { DEFAULT_STYLE_CONFIG, TOPBAR_STYLE_MAP } from './style-config';

// export function injectStylesEarly() {
//   const styleId = 'nde-custom-topbar-styles';
//   if (document.getElementById(styleId)) return;

//   const config = DEFAULT_STYLE_CONFIG;
//   const specs = TOPBAR_STYLE_MAP[config.topbarSize];

//   const style = document.createElement('style');
//   style.id = styleId;
//   style.textContent = [
//     `
//     header.top-bar.flex-column.header {
//       background-color: ${config.topbarColor} !important;
//       height: ${specs.height} !important;
//       min-height: ${specs.minHeight} !important;
//     }
//     header.top-bar .header-container {
//       height: 100% !important;
//       align-items: center !important;
//     }
//     nde-logo img {
//       transform: scale(${specs.logoScale}) !important;
//       transform-origin: left center;
//     }`,
//     config.HideSignIn ? `nde-user-area { display: none !important; }` : '',
//     config.HideLinksInLiriasRecords
//       ? `nde-view-it-card { display: none !important; }`
//       : '',
//     config.HideLoginBannerInFullRecordView
//       ? `nde-custom-snack-bar { display: none !important; }`
//       : '',
//   ].join('\n');

//   document.head.appendChild(style);
// }
