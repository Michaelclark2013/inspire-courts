#!/bin/bash
echo "Syncing Capacitor for Admin App..."
cp capacitor.admin.config.ts capacitor.config.ts
npx cap sync ios
echo "Done. Open with: npx cap open ios"
# Restore public config
cp capacitor.active.config.ts capacitor.config.ts 2>/dev/null
