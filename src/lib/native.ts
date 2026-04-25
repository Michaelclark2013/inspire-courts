// Native (Capacitor) bridge — guards against being called from the web
// bundle. All imports are dynamic so the web build doesn't pull native
// SDKs into the Vercel deploy.

let _isNative: boolean | null = null;

export async function isNative(): Promise<boolean> {
  if (_isNative !== null) return _isNative;
  try {
    const { Capacitor } = await import("@capacitor/core");
    _isNative = Capacitor.isNativePlatform();
  } catch {
    _isNative = false;
  }
  return _isNative;
}

/**
 * On a native build, request push permission and register the device
 * token with our /api/push/subscribe endpoint so the same fan-out
 * machinery used for the PWA also reaches the native app. On web,
 * this is a noop — `usePushSubscription` already covers PWA.
 */
export async function registerNativePush(): Promise<{ ok: boolean; token?: string; reason?: string }> {
  if (!(await isNative())) return { ok: false, reason: "not_native" };
  try {
    const mod = await import("@capacitor/push-notifications");
    const PushNotifications = mod.PushNotifications;
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") return { ok: false, reason: "permission_denied" };
    await PushNotifications.register();
    // Token arrives via 'registration' event — caller wires it.
    return new Promise((resolve) => {
      const sub = PushNotifications.addListener("registration", async (t: { value: string }) => {
        sub.then((s) => s.remove());
        try {
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nativeToken: t.value, platform: await getPlatform() }),
          });
        } catch { /* fire-and-forget */ }
        resolve({ ok: true, token: t.value });
      });
      // Time out after 10s if no registration event.
      setTimeout(() => resolve({ ok: false, reason: "timeout" }), 10_000);
    });
  } catch (err) {
    return { ok: false, reason: String(err) };
  }
}

export async function getPlatform(): Promise<"ios" | "android" | "web"> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    const p = Capacitor.getPlatform();
    if (p === "ios" || p === "android") return p;
    return "web";
  } catch {
    return "web";
  }
}

/**
 * Geolocation via Capacitor on native (cleaner permission UX than the
 * Web API), fall back to navigator.geolocation on web.
 */
export async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  if (await isNative()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10_000 });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      return null;
    }
  }
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  });
}
