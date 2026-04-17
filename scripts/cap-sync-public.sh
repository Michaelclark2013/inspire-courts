#!/bin/bash
echo "Syncing Capacitor for Public App..."
cp capacitor.config.ts capacitor.active.config.ts
npx cap sync ios
echo "Done. Open with: npx cap open ios"
