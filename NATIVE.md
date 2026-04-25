# Native iOS / Android builds

The web app is already a Capacitor-wrapped PWA. The iOS project is
generated. Android is staged via the npm dep but the platform folder
needs to be added on a machine with Android Studio + JDK 17.

## One-time setup

### iOS (already added)
```
cd ios/App
pod install
open App.xcworkspace
```
Configure signing:
- Bundle ID: `com.inspirecourts.app`
- Team: Inspire Courts AZ LLC
- Push notifications capability ON
- Background Modes → Remote notifications ON

### Android (run once)
```
npx cap add android
```
Open `android/` in Android Studio. App-level `build.gradle`:
- `applicationId "com.inspirecourts.app"`
- `minSdkVersion 23`, `targetSdkVersion 34`
- Add `google-services.json` for FCM in `android/app/`.

## Build cycle (every release)

```
npm run build           # Next.js static export → out/
npx cap sync            # copies out/ to ios/App/App/public + android/
npx cap open ios        # opens Xcode
npx cap open android    # opens Android Studio
```
Archive + upload through Xcode and Android Studio respectively.

## Native push notifications

The web push (VAPID) and native push (APNS / FCM) are unified server-side
via `/api/push/subscribe`. On the first launch of the native app:

1. `registerNativePush()` (in `src/lib/native.ts`) requests permission
2. Capacitor returns the device token
3. We POST it to `/api/push/subscribe` with `platform: "ios" | "android"`
4. The fan-out logic in `src/lib/announcement-push.ts` already iterates
   all subscriptions — extend it to call APNS/FCM when `platform !== "web"`.

## Geolocation for clock-in

`getCurrentLocation()` in `src/lib/native.ts` uses `@capacitor/geolocation`
on native (cleaner permission flow + better accuracy) and falls back to
`navigator.geolocation` on web. The clock-in API enforces a geofence
when `FACILITY_GEOFENCE_LAT/LNG/RADIUS_M` env vars are set.

## App Store / Play Store assets

- App icon: 1024×1024 PNG, no transparency, navy `#0B1D3A` background, red `#CC0000` ball
- Splash: 2732×2732 PNG, navy gradient with logo centered
- Screenshots: capture from `/admin/owner`, `/portal/workouts`, `/scores/live/[id]`
- Privacy nutrition labels: "Diagnostics" + "Identifiers" only — no third-party tracking

## Required Apple capabilities

- Push Notifications
- Sign in with Apple (if SSO is added later)
- Associated Domains (for password autofill on `inspirecourtsaz.com`)
