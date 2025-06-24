// src/utils/RootNavigator.ts
import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

export function resetToLogin() {
  if (navigationRef.isReady()) {
    console.log("✅ Navegando a Login con reset()");
    navigationRef.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  } else {
    console.log("⛔ navigationRef no está listo");
  }
}
