"use client";

export function isNativeApp(): boolean {
  // Check if Capacitor is available and running natively
  try {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    return cap?.isNativePlatform?.() ?? false;
  } catch {
    return false;
  }
}

export async function triggerHaptic(style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium'): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
    if (style === 'success' || style === 'warning' || style === 'error') {
      const notifMap = { success: NotificationType.Success, warning: NotificationType.Warning, error: NotificationType.Error };
      await Haptics.notification({ type: notifMap[style] });
    } else {
      const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
      await Haptics.impact({ style: map[style] });
    }
  } catch {}
}

export async function nativeShare(data: { title?: string; text?: string; url?: string }): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { Share } = await import('@capacitor/share');
    await Share.share(data);
    return true;
  } catch {
    return false;
  }
}

export async function setStatusBarColor(color: string, style: 'light' | 'dark' = 'light'): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setBackgroundColor({ color });
    await StatusBar.setStyle({ style: style === 'light' ? Style.Light : Style.Dark });
  } catch {}
}
