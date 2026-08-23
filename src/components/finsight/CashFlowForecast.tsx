import React, { useMemo, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import { XStack, YStack, Text, View } from "tamagui";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import Svg, { Path, Circle, Line, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { Card } from "./Card";
import { SectionHeading } from "./SectionHeading";
import { smoothPath, areaPath, bandPath, type Pt } from "./chartPaths";
import { buildForecast, type ForecastHorizon } from "../../data/intelligence";
import { palette } from "../../constants/colors";

const HORIZONS: ForecastHorizon[] = [12, 24, 36];
const CHART_H = 180;
const PAD_T = 12;
const PAD_B = 18;

function HorizonToggle({ value, onChange }: { value: ForecastHorizon; onChange: (h: ForecastHorizon) => void }) {
  return (
    <XStack backgroundColor="$surfaceAlt" borderRadius={10} padding={3}>
      {HORIZONS.map((h) => {
        const active = h === value;
        return (
          <View
            key={h}
            borderRadius={8}
            paddingHorizontal={12}
            paddingVertical={6}
            backgroundColor={active ? "$backgroundStrong" : "transparent"}
            shadowColor="#0B1220"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={active ? 0.08 : 0}
            shadowRadius={4}
            pressStyle={{ opacity: 0.7 }}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(h);
            }}
          >
            <Text fontSize={12} fontWeight={active ? "800" : "600"} color={active ? "$navy" : "$secondary"}>
              {h}M
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
    <Card>
      <SectionHeading title="Cash flow forecast" caption="Holt-Winters projection" />
      <XStack justifyContent="flex-end" marginTop={-24} marginBottom={8}>
        <HorizonToggle value={horizon} onChange={setHorizon} />
      </XStack>

      <View height={CHART_H} onLayout={onLayout}>
        {geom ? (
          <Svg width={w} height={CHART_H}>
            <Defs>
              <SvgGradient id="cfArea" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={palette.red} stopOpacity={0.22} />
                <Stop offset="1" stopColor={palette.red} stopOpacity={0} />
              </SvgGradient>
            </Defs>

            {/* gridlines */}
            {geom.gridYs.map((y, i) => (
              <Line key={i} x1={0} y1={y} x2={w} y2={y} stroke={palette.border} strokeWidth={1} />
            ))}

            {/* confidence band */}
            <Path d={geom.band} fill="rgba(24,35,61,0.06)" />

            {/* actual area + line */}
            <Path d={geom.actualArea} fill="url(#cfArea)" />
            <Path d={geom.actualLine} stroke={palette.red} strokeWidth={2.6} fill="none" strokeLinecap="round" />

            {/* forecast dashed line */}
            <Path
              d={geom.forecastLine}
              stroke={palette.navy2}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeDasharray="5 5"
            />

            {/* current position marker */}
            {geom.marker ? (
              <>
                <Circle cx={geom.marker.x} cy={geom.marker.y} r={7} fill={palette.red} opacity={0.18} />
                <Circle cx={geom.marker.x} cy={geom.marker.y} r={4} fill={palette.red} stroke="#fff" strokeWidth={1.5} />
              </>
            ) : null}
          </Svg>
        ) : null}
        {/* subtle reveal */}
        <MotiView
          key={horizon}
          from={{ opacity: 0.3 }}
          animate={{ opacity: 0 }}
          transition={{ type: "timing", duration: 500 }}
          pointerEvents="none"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: palette.surface }}
        />
      </View>

      <XStack gap={16} marginTop={10}>
        <XStack alignItems="center" gap={6}>
          <View width={14} height={3} borderRadius={2} backgroundColor="$red" />
          <Text fontSize={11.5} color="$secondary" fontWeight="600">
            Actual
          </Text>
        </XStack>
        <XStack alignItems="center" gap={6}>
          <View width={14} height={3} borderRadius={2} backgroundColor="$navy2" />
          <Text fontSize={11.5} color="$secondary" fontWeight="600">
            Forecast
          </Text>
        </XStack>
        <XStack alignItems="center" gap={6}>
          <View width={14} height={9} borderRadius={3} backgroundColor="rgba(24,35,61,0.10)" />
          <Text fontSize={11.5} color="$secondary" fontWeight="600">
            Confidence
          </Text>
        </XStack>
      </XStack>
    </Card>
  );
}
