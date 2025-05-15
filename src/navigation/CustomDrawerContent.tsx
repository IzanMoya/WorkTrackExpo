import {
    DrawerContentScrollView,
    DrawerItem,
    DrawerItemList,
} from "@react-navigation/drawer";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useAuth } from "../utils/AuthContext";

const CustomDrawerContent = (props: any) => {
  const { logout } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scroll}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <DrawerItem
          label="Cerrar Sesión"
          onPress={logout}
          labelStyle={{ color: "red" }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingTop: 0,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingBottom: 20,
  },
});

export default CustomDrawerContent;
