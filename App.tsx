import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/utils/AuthContext";
import { navigationRef } from "./src/utils/RootNavigator";

export default function App() {
  return (
    <NavigationContainer ref={navigationRef}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </NavigationContainer>
  );
}
