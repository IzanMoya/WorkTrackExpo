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
      if (!id) throw new Error("ID no encontrado");

      const res = await api.get(`/worktrack/usuarios/${id}`);
      setUser(res.data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
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

  return (
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
      <Text style={styles.name}>
        {user.nombre} {user.apellidos}
      </Text>
      <Text style={styles.email}>{user.email}</Text>
      <Text style={styles.rol}>Rol: {user.rol}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ccc",
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
  },
  email: {
    fontSize: 16,
    color: "#888",
    marginTop: 5,
  },
  rol: {
    fontSize: 16,
    color: "#000",
    marginTop: 10,
  },
});
