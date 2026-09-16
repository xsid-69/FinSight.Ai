import React, { useMemo, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import { XStack, YStack, Text, View } from "tamagui";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import Svg, { Path, Circle, Line, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";

import { Card } from "./Card";
import { smoothPath, areaPath, bandPath, type Pt } from "./chartPaths";
import { buildForecast, type ForecastHorizon } from "../../data/intelligence";
import { overlays, palette } from "../../constants/colors";
import { useReducedMotion } from "../../hooks/useReducedMotion";

const HORIZONS: ForecastHorizon[] = [12, 24, 36];
const CHART_H = 180;
const PAD_T = 12;
const PAD_B = 18;

function HorizonToggle({ value, onChange }: { value: ForecastHorizon; onChange: (h: ForecastHorizon) => void }) {
  return (
    <XStack
      minHeight={48}
      backgroundColor="$surfaceAlt"
      borderRadius={14}
      padding={3}
      accessibilityRole="radiogroup"
      accessibilityLabel="Forecast horizon"
    >
      {HORIZONS.map((h) => {
        const active = h === value;
        return (
          <View
            key={h}
            flex={1}
            minHeight={48}
            borderRadius={11}
            alignItems="center"
            justifyContent="center"
            backgroundColor={active ? "$charcoal" : "transparent"}
            pressStyle={{ scale: 0.98, opacity: 0.78 }}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(h);
            }}
            accessibilityRole="radio"
            accessibilityLabel={`${h} month forecast`}
            accessibilityState={{ selected: active }}
          >
            <Text fontSize={12.5} fontWeight="800" color={active ? "white" : "$secondary"}>
              {h} months
            </Text>
          </View>
        );
      })}
    </XStack>
  );
}

/** Cash-flow forecast: solid actual line + gradient fill, dashed forecast,
 *  soft confidence band, and a current-position marker. */
export function CashFlowForecast() {
  const reducedMotion = useReducedMotion();
  const [horizon, setHorizon] = useState<ForecastHorizon>(12);
  const [w, setW] = useState(0);
  const points = useMemo(() => buildForecast(horizon), [horizon]);

  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const geom = useMemo(() => {
    if (w <= 0) return null;
    const values: number[] = [];
    points.forEach((p) => {
      [p.actual, p.forecast, p.lower, p.upper].forEach((v) => v != null && values.push(v));
    });
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const n = points.length - 1;

    const X = (t: number) => (t / n) * w;
    const Y = (v: number) => PAD_T + (1 - (v - min) / span) * (CHART_H - PAD_T - PAD_B);

    const actualPts: Pt[] = points.filter((p) => p.actual != null).map((p) => ({ x: X(p.t), y: Y(p.actual as number) }));
    const forecastPts: Pt[] = points.filter((p) => p.forecast != null).map((p) => ({ x: X(p.t), y: Y(p.forecast as number) }));
    const upperPts: Pt[] = points.filter((p) => p.upper != null).map((p) => ({ x: X(p.t), y: Y(p.upper as number) }));
    const lowerPts: Pt[] = points.filter((p) => p.lower != null).map((p) => ({ x: X(p.t), y: Y(p.lower as number) }));

    const baselineY = CHART_H - PAD_B;
    const marker = actualPts[actualPts.length - 1];

    return {
      actualLine: smoothPath(actualPts),
      actualArea: areaPath(actualPts, baselineY),
      forecastLine: smoothPath(forecastPts),
      band: bandPath(upperPts, lowerPts),
      marker,
      gridYs: [0.25, 0.5, 0.75].map((f) => PAD_T + f * (CHART_H - PAD_T - PAD_B)),
    };
  }, [w, points]);

  return (
    <Card gap={16}>
      <XStack alignItems="flex-start" justifyContent="space-between" gap={12}>
        <YStack flex={1} gap={3}>
          <Text fontSize={18} lineHeight={24} fontWeight="800" color="$navy" accessibilityRole="header">Cash flow forecast</Text>
          <Text fontSize={12.5} lineHeight={18} color="$secondary">Illustrative Holt-Winters-style trend</Text>
        </YStack>
        <View borderRadius={999} backgroundColor="$orangeSoft" paddingHorizontal={9} paddingVertical={5}>
          <Text fontSize={10} lineHeight={14} fontWeight="800" color="$orangeDeep" letterSpacing={0.6}>MODELLED</Text>
        </View>
      </XStack>

      <HorizonToggle value={horizon} onChange={setHorizon} />

      <View
        height={CHART_H}
        onLayout={onLayout}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Cash flow chart with six months of illustrative historical values and a ${horizon} month illustrative forecast with a confidence range`}
      >
        {geom ? (
          <Svg
            width={w}
            height={CHART_H}
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Defs>
              <SvgGradient id="cfArea" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={palette.red} stopOpacity={0.22} />
                <Stop offset="1" stopColor={palette.red} stopOpacity={0} />
              </SvgGradient>
            </Defs>

            {geom.gridYs.map((y, i) => (
              <Line key={i} x1={0} y1={y} x2={w} y2={y} stroke={palette.border} strokeWidth={1} />
            ))}

            <Path d={geom.band} fill={overlays.orange14} />
            <Path d={geom.actualArea} fill="url(#cfArea)" />
            <Path d={geom.actualLine} stroke={palette.red} strokeWidth={2.8} fill="none" strokeLinecap="round" />
            <Path
              d={geom.forecastLine}
              stroke={palette.charcoal}
              strokeWidth={2.2}
              fill="none"
              strokeLinecap="round"
              strokeDasharray="5 5"
            />

            {geom.marker ? (
              <>
                <Circle cx={geom.marker.x} cy={geom.marker.y} r={8} fill={palette.red} opacity={0.16} />
                <Circle cx={geom.marker.x} cy={geom.marker.y} r={4} fill={palette.red} stroke={palette.surface} strokeWidth={1.5} />
              </>
            ) : null}
          </Svg>
        ) : null}
        <MotiView
          key={horizon}
          from={{ opacity: reducedMotion ? 0 : 0.42 }}
          animate={{ opacity: 0 }}
          transition={{ type: "timing", duration: reducedMotion ? 1 : 500 }}
          pointerEvents="none"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 12, backgroundColor: overlays.orange14 }}
        />
      </View>

      <XStack gap={14} flexWrap="wrap">
        <XStack alignItems="center" gap={6}>
          <View width={15} height={3} borderRadius={2} backgroundColor="$red" />
          <Text fontSize={11.5} color="$secondary" fontWeight="700">Actual</Text>
        </XStack>
        <XStack alignItems="center" gap={6}>
          <View width={15} height={3} borderRadius={2} backgroundColor="$charcoal" />
          <Text fontSize={11.5} color="$secondary" fontWeight="700">Forecast</Text>
        </XStack>
        <XStack alignItems="center" gap={6}>
          <View width={15} height={9} borderRadius={3} backgroundColor="$orangeSoft" />
          <Text fontSize={11.5} color="$secondary" fontWeight="700">Confidence range</Text>
        </XStack>
      </XStack>
    </Card>
  );
}
