import React from "react";
import { StyleSheet, Text, Pressable, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LayoutDashboard, Sparkles, Trophy, Users } from "lucide-react-native";

import { HomeScreen } from "../screens/HomeScreen";
import { AIScreen } from "../screens/AIScreen";
import { CohortScreen } from "../screens/CohortScreen";
import { HomePagerCoordinatorProvider } from "../screens/home/HomePagerCoordinator";

const Tab = createBottomTabNavigator();

/**
 * Custom Tab Bar Bottom Dock adhering strictly to FinSight Red and Charcoal system
 */
export function BottomTabDock({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.dockContainer,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
      testID="bottom-tab-navigator-dock"
    >
      <View style={styles.dockSurface}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name === "CohortScreen"
              ? "Ranking"
              : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            void Haptics.selectionAsync();

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const IconComponent =
            route.name === "CohortScreen"
              ? Trophy
              : route.name === "AI"
              ? Sparkles
              : LayoutDashboard;

          return (
            <Pressable
              key={route.key}
              testID={`tab-button-${route.name}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.tabItem,
                pressed && styles.tabItemPressed,
              ]}
            >
              <View
                style={[
                  styles.iconGlowWrapper,
                  isFocused && styles.iconGlowActive,
                ]}
              >
                <IconComponent
                  size={20}
                  color={isFocused ? "#EB001B" : "#64748B"}
                  strokeWidth={isFocused ? 2.4 : 2}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
              {isFocused && <View style={styles.activeGlowIndicator} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function BottomTabNavigator() {
  return (
    <HomePagerCoordinatorProvider>
      <Tab.Navigator
        tabBar={(props) => <BottomTabDock {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: "Overview",
            tabBarLabel: "Overview",
          }}
        />
        <Tab.Screen
          name="AI"
          component={AIScreen}
          options={{
            title: "AI",
            tabBarLabel: "AI",
          }}
        />
        <Tab.Screen
          name="CohortScreen"
          component={CohortScreen}
          options={{
            title: "Ranking",
            tabBarLabel: "Ranking",
          }}
        />
      </Tab.Navigator>
    </HomePagerCoordinatorProvider>
  );
}

const styles = StyleSheet.create({
  dockContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    paddingHorizontal: 24,
  },
  dockSurface: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#171717",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    height: 64,
    width: "100%",
    maxWidth: 390,
    paddingHorizontal: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    paddingVertical: 6,
  },
  tabItemPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  iconGlowWrapper: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlowActive: {
    backgroundColor: "rgba(235, 0, 27, 0.12)",
    shadowColor: "#EB001B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 2,
    fontWeight: "700",
  },
  tabLabelActive: {
    color: "#EB001B",
    fontWeight: "800",
  },
  tabLabelInactive: {
    color: "#64748B",
  },
  activeGlowIndicator: {
    position: "absolute",
    bottom: 4,
    width: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#EB001B",
    shadowColor: "#EB001B",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});

export default BottomTabNavigator;
