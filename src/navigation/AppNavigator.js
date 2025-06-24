import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { Text, View } from "react-native";
import LoginScreen from "../screens/LoginScreen";
import PasswordResetScreen from "../screens/PasswordResetScreen";
import RegisterScreen from "../screens/RegisterScreen";
import { useAuth } from "../utils/AuthContext";
import DrawerNavigator from "./DrawerNavigator";

const RootStack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <RootStack.Screen name="App" component={DrawerNavigator} />
      ) : (
        <>
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="Register" component={RegisterScreen} />
          <RootStack.Screen
            name="PasswordReset"
            component={PasswordResetScreen}
          />
        </>
      )}
    </RootStack.Navigator>
  );
}
