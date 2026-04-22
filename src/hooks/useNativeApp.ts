"use client";
import { useState } from 'react';
import { isNativeApp } from '@/lib/capacitor';

// Lazy init so the first render has the correct value. The old
// useEffect → setState bounce triggered React 19's
// cascading-renders warning for no functional benefit (isNativeApp
// is a synchronous capability check).
export function useNativeApp() {
  const [isNative] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return isNativeApp();
    } catch {
      return false;
    }
  });

  return { isNative };
}
