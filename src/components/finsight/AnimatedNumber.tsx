import React, { useEffect, useRef, useState } from "react";
import { Text } from "tamagui";
import { currencySymbol, type CurrencyCode } from "../../constants/typography";

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

/** Counts up to `value` (ease-out) — used for goal projections. */
export function AnimatedNumber({
  value,
  currency = "INR",
  duration = 700,
  size = 24,
  weight = "800",
  color = "$navy",
  triggerKey,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(value * easeOutCubic(t)));
      if (t < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, duration, triggerKey]);

  return (
    <Text fontSize={size} fontWeight={weight} color={color as any} letterSpacing={-0.5}>
      {currencySymbol(currency)}
      {display.toLocaleString(currency === "INR" ? "en-IN" : "en-US")}
    </Text>
  );
}
