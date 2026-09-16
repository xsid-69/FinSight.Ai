import React, { useEffect, useRef, useState } from "react";
import { Text } from "tamagui";

import { currencySymbol, type CurrencyCode } from "../../constants/typography";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export interface AnimatedNumberProps {
  value: number;
  currency?: CurrencyCode;
  duration?: number;
  size?: number;
  weight?: "600" | "700" | "800";
  color?: string;
  /** Re-run the count-up whenever this key changes. */
  triggerKey?: string | number;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/** Counts up to `value` while exposing only the final value to assistive technology. */
export function AnimatedNumber({
  value,
  currency = "INR",
  duration = 700,
  size = 24,
  weight = "800",
  color = "$navy",
  triggerKey,
}: AnimatedNumberProps) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const raf = useRef<number | null>(null);
  const previousTarget = useRef({ value, duration, triggerKey });
  const previousReducedMotion = useRef(reducedMotion);
  const locale = currency === "INR" ? "en-IN" : "en-US";
  const finalText = `${currencySymbol(currency)}${value.toLocaleString(locale)}`;

  useEffect(() => {
    const previous = previousTarget.current;
    const targetChanged = previous.value !== value || previous.duration !== duration || previous.triggerKey !== triggerKey;
    const motionBecameAvailable = previousReducedMotion.current && !reducedMotion;
    previousTarget.current = { value, duration, triggerKey };
    previousReducedMotion.current = reducedMotion;

    if (raf.current != null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }

    if (reducedMotion || duration <= 0) {
      setDisplay(value);
      return undefined;
    }

    if (!targetChanged && !motionBecameAvailable) {
      return undefined;
    }

    setDisplay(0);
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(value * easeOutCubic(t)));
      if (t < 1) {
        raf.current = requestAnimationFrame(animate);
      } else {
        raf.current = null;
      }
    };
    raf.current = requestAnimationFrame(animate);

    return () => {
      if (raf.current != null) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };
  }, [value, duration, triggerKey, reducedMotion]);

  return (
    <Text
      fontSize={size}
      fontWeight={weight}
      color={color as any}
      letterSpacing={-0.5}
      accessible
      accessibilityLabel={finalText}
      accessibilityLiveRegion="none"
    >
      {currencySymbol(currency)}
      {display.toLocaleString(locale)}
    </Text>
  );
}
