"use client";
import { useState, useEffect } from 'react';
import { isNativeApp } from '@/lib/capacitor';

export function useNativeApp() {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(isNativeApp());
  }, []);

  return { isNative };
}
