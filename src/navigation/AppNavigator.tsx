import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { FloatingDock } from "../components/finsight";
import { useAuth } from "../context/AuthContext";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { AIScreen } from "../screens/AIScreen";
import { SimulatorScreen } from "../screens/SimulatorScreen";
import { StatementAnalyzerScreen } from "../screens/StatementAnalyzerScreen";
import { SavedStatementsScreen } from "../screens/SavedStatementsScreen";
import { StatementDetailScreen } from "../screens/StatementDetailScreen";
import { AIAssistantScreen } from "../screens/AIAssistantScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { CohortScreen } from "../screens/CohortScreen";
import { HomePagerCoordinatorProvider } from "../screens/home/HomePagerCoordinator";

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

function MainTabs() {
  return (
    <HomePagerCoordinatorProvider>
      <Tab.Navigator
        backBehavior="history"
        screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
        tabBar={(props) => <FloatingDock {...props} />}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="AI" component={AIScreen} />
        <Tab.Screen name="CohortScreen" component={CohortScreen} options={{ title: "Ranking" }} />
      </Tab.Navigator>
    </HomePagerCoordinatorProvider>
  );
}

export function AppNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <RootStack.Navigator
        key={user?.uid ? `authenticated-${user.uid}` : "public"}
        initialRouteName={user ? "Main" : "Onboarding"}
        screenOptions={{ headerShown: false }}
      >
        {user ? (
          <>
            <RootStack.Screen name="Main" component={MainTabs} />
            <RootStack.Screen
              name="AIAssistant"
              component={AIAssistantScreen}
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <RootStack.Screen
              name="Simulator"
              component={SimulatorScreen}
              options={{ presentation: "card", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="Analyzer"
              component={StatementAnalyzerScreen}
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <RootStack.Screen
              name="Statements"
              component={SavedStatementsScreen}
              options={{ presentation: "card", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="StatementDetail"
              component={StatementDetailScreen}
              options={{ presentation: "card", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ presentation: "card", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="Cohort"
              component={CohortScreen}
              options={{ presentation: "card", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="CohortScreen"
              component={CohortScreen}
              options={{ presentation: "card", animation: "slide_from_right" }}
            />
          </>
        ) : (
          <>
            <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
            <RootStack.Screen
              name="Login"
              component={LoginScreen}
              options={{ animation: "slide_from_right" }}
            />
            {__DEV__ ? (
              <RootStack.Screen
                name="Register"
                component={RegisterScreen}
                options={{ animation: "slide_from_right" }}
              />
            ) : null}
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
