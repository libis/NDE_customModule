// scripts/generate-scss-vars.js
const { writeFileSync } = require("fs");
const { join } = require("path");
const { TOPBAR_HEIGHT_MAP } = require("../config/style-config");

const scssContent = `// Auto-generated from style.config.ts - DO NOT EDIT MANUALLY

$topbar-height-thin: ${TOPBAR_HEIGHT_MAP.thin};
$topbar-height-medium: ${TOPBAR_HEIGHT_MAP.medium};
$topbar-height-thick: ${TOPBAR_HEIGHT_MAP.thick};
`;

writeFileSync(join(__dirname, "../src/styles/_variables.scss"), scssContent);

console.log(" SCSS variables generated");
