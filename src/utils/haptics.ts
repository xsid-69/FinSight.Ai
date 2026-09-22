import * as Haptics from "expo-haptics";

/**
 * Micro-Haptic Sensory Engine for FinSight AI
 * Provides tactile sensory feedback for button presses, threshold crossings, and success events.
 * Wrapped defensively to safely no-op in web or non-haptic environments.
 */

export const triggerButtonHaptic = async (): Promise<void> => {
  try {
    if (typeof Haptics.impactAsync === "function") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    // Safe no-op if unsupported or running in tests
  }
};

export const triggerThresholdHaptic = async (): Promise<void> => {
  try {
    if (typeof Haptics.impactAsync === "function") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch {
    // Safe no-op
  }
};

export const triggerSuccessHaptic = async (): Promise<void> => {
  try {
    if (typeof Haptics.notificationAsync === "function") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (typeof Haptics.impactAsync === "function") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  } catch {
    // Safe no-op
  }
};

export const triggerSelectionHaptic = async (): Promise<void> => {
  try {
    if (typeof Haptics.selectionAsync === "function") {
      await Haptics.selectionAsync();
    }
  } catch {
    // Safe no-op
  }
};
