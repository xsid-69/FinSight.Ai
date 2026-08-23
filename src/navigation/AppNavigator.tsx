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
import { StatementAnalyzerScreen } from "../screens/StatementAnalyzerScreen";
import { AIAssistantScreen } from "../screens/AIAssistantScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
      tabBar={(props) => <FloatingDock {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="AI" component={AIScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <RootStack.Navigator
        key={user ? "authenticated" : "public"}
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
              name="Analyzer"
              component={StatementAnalyzerScreen}
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <RootStack.Screen
              name="Profile"
              component={ProfileScreen}
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
