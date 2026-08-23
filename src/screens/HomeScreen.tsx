import React, { useEffect, useState } from "react";
import { YStack } from "tamagui";
import { MotiView } from "moti";

import { FinSightShell, type MainTab } from "../components/finsight";
import { OverviewContent } from "./home/OverviewContent";
import { TransactionsContent } from "./home/TransactionsContent";
import { InsightsContent } from "./home/InsightsContent";

export function HomeScreen({ navigation, route }: { navigation?: any; route?: any }) {
  const paramTab = route?.params?.tab as MainTab | undefined;
  const [tab, setTab] = useState<MainTab>(paramTab ?? "Overview");

  // Keep in sync when the bottom dock changes the tab via route params.
  useEffect(() => {
    if (paramTab && paramTab !== tab) setTab(paramTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramTab]);

  const changeTab = (t: MainTab) => {
    setTab(t);
    navigation?.setParams?.({ tab: t });
  };

  return (
    <FinSightShell
      activeTab={tab}
      onChangeTab={changeTab}
      onProfile={() => navigation?.navigate?.("Profile")}
      onLogout={() => navigation?.getParent?.()?.reset?.({ index: 0, routes: [{ name: "Login" }] })}
    >
      <MotiView key={tab} style={{ flex: 1 }} from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 260 }}>
        <YStack flex={1}>
          {tab === "Overview" && <OverviewContent navigation={navigation} />}
          {tab === "Transactions" && <TransactionsContent />}
          {tab === "Insights" && <InsightsContent navigation={navigation} />}
        </YStack>
      </MotiView>
    </FinSightShell>
  );
}
