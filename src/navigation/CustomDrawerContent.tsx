import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
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
import { useAuth } from "../utils/AuthContext";

const CustomDrawerContent = (props: any) => {
  const { logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const usuarioIdStr = await AsyncStorage.getItem("usuarioId");
        const token = await AsyncStorage.getItem("token");

        if (usuarioIdStr && token) {
          const res = await api.get(`/worktrack/usuarios/${usuarioIdStr}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data);
          setIsAdmin(res.data.rol === "admin");

          // Recuperar imagen específica del usuario
          const savedImage = await AsyncStorage.getItem(
            `userProfileImage_${usuarioIdStr}`
          );
          if (savedImage) setImage(savedImage);
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
      }
    };

    fetchUserData();
  }, []);

  const seleccionarImagen = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && user) {
      const uri = result.assets[0].uri;
      setImage(uri);
      await AsyncStorage.setItem(`userProfileImage_${user.id}`, uri);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
      >
        {user && (
          <View style={styles.userHeader}>
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
            <Text style={styles.userName}>
              {user.nombre} {user.apellidos}
            </Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userId}>ID: {user.id}</Text>
          </View>
        )}

        <View style={styles.menuItems}>
          <DrawerItem
            label="Fichar"
            onPress={() => props.navigation.navigate("Fichar")}
          />

          {isAdmin && (
            <DrawerItem
              label="Historial"
              onPress={() => props.navigation.navigate("Historial")}
            />
          )}

          {/* Sección Administración visible para todos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Administración</Text>
            <DrawerItem
              label="Panel de Administración"
              icon={({ color, size }) => (
                <Ionicons name="settings-outline" size={size} color={color} />
              )}
              onPress={() => props.navigation.navigate("AdminPanel")}
            />
          </View>
        </View> 
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <DrawerItem
          label="Cerrar Sesión"
          onPress={() => {
            Alert.alert("Cerrar Sesión", "¿Seguro que deseas salir?", [
              { text: "Cancelar", style: "cancel" },
              { text: "Salir", style: "destructive", onPress: logout },
            ]);
          }}
          labelStyle={{ color: "red" }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 0,
  },
  userHeader: {
    backgroundColor: "#141C2B", // 💡 Usa el color principal de tu app aquí
    alignItems: "center",
    paddingTop: 60, // ⬆️ Baja todo un poco
    paddingBottom: 30, // ⬇️ Añade más fondo
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 14,
    color: "#ccc",
  },
  menuItems: {
    paddingVertical: 20,
    paddingLeft: 10,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingBottom: 20,
    paddingLeft: 10,
  },
  section: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#444",
    paddingTop: 15,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#888",
    marginBottom: 5,
    paddingLeft: 5,
  },
  userId: {
    fontSize: 12,
    color: "#ccc", // o gris claro
    marginTop: 2,
  },
});

export default CustomDrawerContent;
