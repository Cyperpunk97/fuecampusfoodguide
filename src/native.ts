import { useEffect, useRef } from 'react';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardStyle } from '@capacitor/keyboard';

export type HapticFeedback = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning';

/**
 * Android haptic feedback: uses Capacitor Haptics on native Android,
 * falls back to navigator.vibrate on Android browsers.
 */
export async function triggerHaptic(type: HapticFeedback = 'light'): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      switch (type) {
        case 'selection':
          await Haptics.selectionChanged();
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'light':
        default:
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
      }
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      switch (type) {
        case 'selection':
          navigator.vibrate(8);
          break;
        case 'success':
          navigator.vibrate([12, 40, 12]);
          break;
        case 'warning':
          navigator.vibrate([25, 40, 25]);
          break;
        case 'medium':
          navigator.vibrate(18);
          break;
        case 'heavy':
          navigator.vibrate(30);
          break;
        case 'light':
        default:
          navigator.vibrate(12);
          break;
      }
    }
  } catch {
    // Fail silently if vibration permission or hardware is unavailable
  }
}

export async function setNativeTheme(darkMode: boolean): Promise<void> {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('StatusBar')) return;
  try {
    await StatusBar.setStyle({ style: darkMode ? Style.Light : Style.Dark });
    await StatusBar.setBackgroundColor({ color: darkMode ? '#1b1b20' : '#faf8f5' });
  } catch {
    // Native status-bar styling is optional in browser builds.
  }
}

/**
 * Configure native Android status bar, splash screen, and keyboard behavior.
 */
export async function initNativeAndroid(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    if (Capacitor.getPlatform() === 'ios' && Capacitor.isPluginAvailable('Keyboard')) {
      await Keyboard.setStyle({ style: KeyboardStyle.Light });
    }
    if (Capacitor.isPluginAvailable('SplashScreen')) {
      // Hide splash after web runtime has loaded
      await SplashScreen.hide({ fadeOutDuration: 250 });
    }
  } catch {
    // Ignore native setup errors if running in browser
  }
}

type AndroidNavigation = {
  page: string;
  hasDialog: boolean;
  hasVenue: boolean;
  hasMemory: boolean;
  hasNotifications: boolean;
  closeDialog: () => void;
  closeVenue: () => void;
  closeMemory: () => void;
  closeNotifications: () => void;
  goHome: () => void;
  showToast?: (message: string) => void;
  exitPromptText?: string;
};

/**
 * Android hardware-back handling:
 * 1. Dismisses open modals/sheets first
 * 2. Navigates back to 'discover' if on other tabs
 * 3. Shows "Press back again to exit" with 2.5s window before closing the app
 */
export function useAndroidBackButton(navigation: AndroidNavigation) {
  const current = useRef(navigation);
  current.current = navigation;
  const lastBackPressTime = useRef<number>(0);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;
    let disposed = false;
    let handle: PluginListenerHandle | undefined;

    NativeApp.addListener('backButton', () => {
      const state = current.current;
      void triggerHaptic('selection');

      if (state.hasDialog) {
        state.closeDialog();
      } else if (state.hasMemory) {
        state.closeMemory();
      } else if (state.hasVenue) {
        state.closeVenue();
      } else if (state.hasNotifications) {
        state.closeNotifications();
      } else if (state.page !== 'discover') {
        state.goHome();
      } else {
        const now = Date.now();
        // If pressed twice within 2.5 seconds, exit
        if (now - lastBackPressTime.current < 2500) {
          void triggerHaptic('medium');
          void NativeApp.exitApp();
        } else {
          lastBackPressTime.current = now;
          void triggerHaptic('light');
          state.showToast?.(state.exitPromptText || 'Press back again to exit');
        }
      }
    }).then(listener => {
      if (disposed) void listener.remove();
      else handle = listener;
    }).catch(() => {
      /* Missing bridge in web tests */
    });

    return () => {
      disposed = true;
      if (handle) void handle.remove();
    };
  }, []);
}
