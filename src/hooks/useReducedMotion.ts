import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** Tracks Android's remove-animations/reduced-motion accessibility preference. */
export function useReducedMotion() {
  // Start conservatively with motion disabled so the first frame never animates
  // before Android's accessibility preference resolves.
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReducedMotion(enabled);
      })
      .catch(() => {
        // Keep the safe no-motion default when the platform query is unavailable.
      });

    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}
