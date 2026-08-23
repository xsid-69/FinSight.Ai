import React from "react";
import { YStack, Text, View } from "tamagui";
import { Card } from "./Card";
import { PercentileBar } from "./PercentileBar";
import { PeerDistribution } from "./PeerDistribution";
import { currencySymbol } from "../../constants/typography";
import type { Cohort } from "../../data/intelligence";

export interface CohortMirrorProps {
  cohort: Cohort;
}

/** "Financial mirror": anonymized peer benchmark — percentile bars + KDE curve. */
export function CohortMirror({ cohort }: CohortMirrorProps) {
  const sym = currencySymbol("INR");
  return (
    <Card>
      <Text fontSize={16} fontWeight="800" color="$navy" letterSpacing={-0.3}>
        Your financial mirror
      </Text>
      <Text fontSize={12.5} color="$secondary" marginTop={2}>
        Compared with {cohort.label}
      </Text>

      <YStack gap={16} marginTop={16}>
        {cohort.categories.map((c, i) => (
          <PercentileBar
            key={c.id}
            name={c.name}
            percentile={c.percentile}
            peerMedian={c.peerMedian}
            currencySymbol={sym}
            delay={i * 120}
          />
        ))}
      </YStack>

      <View height={1} backgroundColor="$borderColor" marginVertical={16} />

      <Text fontSize={13} fontWeight="700" color="$navy" marginBottom={10}>
        Peer distribution
      </Text>
      <PeerDistribution distribution={cohort.distribution} userPosition={cohort.userPosition} />
    </Card>
  );
}
