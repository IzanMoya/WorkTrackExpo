import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../api/axiosConfig";
import { useAuth } from "../utils/AuthContext";
import { resetToLogin } from "../utils/RootNavigator";

export default function AdminPanelScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const { forceLogout } = useAuth(); // ✅

  useEffect(() => {
    const obtenerId = async () => {
      const id = await AsyncStorage.getItem("usuarioId");
      setUserId(id);
    };
    obtenerId();
  }, []);

  const deleteUser = async () => {
  if (!userId) {
    Alert.alert("Error", "No se pudo obtener el ID del usuario.");
    return;
  }

  try {
    const token = await AsyncStorage.getItem("token");
    await api.delete(`/worktrack/usuarios/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    Alert.alert("Cuenta eliminada", "Tu cuenta ha sido eliminada correctamente.");
    await AsyncStorage.clear();

    forceLogout();        // ✅ actualiza estado de autenticación
    resetToLogin();       // ✅ navegación ahora sí funciona
  } catch (error) {
    console.error("❌ Error al borrar usuario:", error);
    Alert.alert("Error", "No se pudo eliminar el usuario.");
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla de Administración</Text>
      <TouchableOpacity style={styles.deleteButton} onPress={deleteUser}>
        <Text style={styles.deleteButtonText}>Borrar Mi Usuario</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 30,
    paddingTop: 80,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  deleteButton: {
    backgroundColor: "red",
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
