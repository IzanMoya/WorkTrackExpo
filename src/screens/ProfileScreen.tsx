import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../api/axiosConfig";

export default function ProfileScreen() {
  const [user, setUser] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    rol: "",
  });
  const [image, setImage] = useState<string | null>(null);

  const cargarDatosUsuario = async () => {
    try {
      const id = await AsyncStorage.getItem("usuarioId");
      const token = await AsyncStorage.getItem("token");

      if (!id || !token) {
        throw new Error("Datos no encontrados");
      }

      console.log("📦 Token que se va a enviar:", token); // 👈 Añade este log

      const res = await api.get(`/worktrack/usuarios/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📦 Usuario cargado:", res.data);
      setUser(res.data);
    } catch (error) {
      console.error("❌ Error al cargar datos:", error);
      Alert.alert("Error", "No se pudieron cargar los datos del usuario.");
    }
  };

  const seleccionarImagen = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  useEffect(() => {
    cargarDatosUsuario();
  }, []);

  return(
    <View style={styles.container}>
      <TouchableOpacity onPress={seleccionarImagen}>
        <Image
          source={
            image
              ? { uri: image }
              : require("../../assets/images/profile-placeholder.png")
          }
          style={styles.avatar}
        />
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.name}>
          {user.nombre} {user.apellidos}
        </Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.rol}>Rol: {user.rol}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start", // <-- para subir todo arriba
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60, // <- espacio desde el top
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ccc",
    marginBottom: 30,
  },
  infoContainer: {
    alignItems: "center",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: "#888",
    marginBottom: 5,
  },
  rol: {
    fontSize: 16,
    color: "#000",
    marginTop: 5,
  },
});
