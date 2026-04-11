#!/bin/bash
export PATH="/Users/michaelclark/.nvm/versions/node/v20.20.2/bin:/usr/local/bin:/usr/bin:/bin"
export NODE_ENV=development
cd /Users/michaelclark/inspire-courts
exec /Users/michaelclark/.nvm/versions/node/v20.20.2/bin/node node_modules/.bin/next dev
