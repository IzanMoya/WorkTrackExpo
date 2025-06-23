import { createDrawerNavigator } from "@react-navigation/drawer";
import React from "react";
import AdminPanelScreen from "../screens/AdminPanelScreen";
import HistorialScreen from "../screens/HistorialScreen";
import HomeScreen from "../screens/HomeScreen";
import CustomDrawerContent from "./CustomDrawerContent";
const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Fichar"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="Fichar" component={HomeScreen} />
      <Drawer.Screen name="Historial" component={HistorialScreen} />
      <Drawer.Screen name="AdminPanel" component={AdminPanelScreen} />
    </Drawer.Navigator>
  );
}
