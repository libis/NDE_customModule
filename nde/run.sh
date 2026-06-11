#!/bin/bash
export NG_CLI_ANALYTICS=false
export NG_FORCE_TTY=false

PROXY_URL=$(node --input-type=module -e "import {proxyUrl} from \"./nde/proxy-url.mjs\"; console.log(proxyUrl);")
echo "NDE Proxy URL: $PROXY_URL"

echo "n" | npm run start:proxy

# TODO: How to open browser with PROXY_URL
# until curl -s "$PROXY_URL" > /dev/null 2>&1; do sleep 2; done
# npx open-cli "$PROXY_URL"

# wait