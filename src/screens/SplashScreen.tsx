import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { auth } from "../services/firebase";

const SplashScreen = ({ navigation }: any) => {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user: typeof auth.currentUser) => {
        if (user) {
          user.getIdToken().then((token: string) => {
            navigation.replace("Home", { token });
          });
        } else {
          navigation.replace("Login");
        }
      }
    );

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#000" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SplashScreen;
