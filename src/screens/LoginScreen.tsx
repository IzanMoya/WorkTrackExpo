import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import api from "../api/axiosConfig";
import { auth } from "../services/firebase"; // ← compat
import { useAuth } from "../utils/AuthContext";

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  App: undefined;
  PasswordReset: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
  route: RouteProp<RootStackParamList, "Login">;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Completa todos los campos");
      return;
    }

    try {
      // 1. Login con Firebase
      const userCredential = await auth.signInWithEmailAndPassword(
        email,
        password
      );
      const idToken = await userCredential.user!.getIdToken();

      // 2. Guardar token en almacenamiento local
      await AsyncStorage.setItem("token", idToken);

      // 3. Validar token en backend
      await api.post(
        "/auth/login",
        {},
        {
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );

      // 4. Obtener ID del usuario desde backend
      const usuarioResponse = await api.get(
        `/worktrack/usuarios/email/${email}`,
        {
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );

      const usuarioData = usuarioResponse.data;
      const usuarioId = usuarioData.id;
      const empresaId = usuarioData.empresaId;

      if (!usuarioId || !empresaId) {
        Alert.alert("Error", "No se pudo obtener la empresa o el usuario.");
        return;
      }

      await AsyncStorage.setItem("usuarioId", usuarioId.toString());
      await AsyncStorage.setItem("empresaId", empresaId.toString());

      console.log("✅ ID usuario backend:", usuarioId);

      // Guardamos y verificamos
      await AsyncStorage.setItem("usuarioId", usuarioId.toString());
      const check = await AsyncStorage.getItem("usuarioId");
      console.log("📦 Verificado en AsyncStorage:", check);

      // 5. Confirmamos login y navegamos
      login?.(); // actualiza el estado global
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "App" }],
        });
      }, 300); // ⏱️ pequeño delay para asegurar que AsyncStorage se completa

      console.log("✅ Login completo");
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert("Error", error.message || "Error al iniciar sesión");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>¡Bienvenido!</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Tu correo"
          placeholderTextColor="#aaa"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Tu contraseña"
            secureTextEntry={!showPassword}
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialCommunityIcons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#999"
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("PasswordReset")}
          style={{ marginBottom: 25 }} // MÁS espacio antes del botón
        >
          <Text style={styles.forgotPassword}>¿Contraseña olvidada?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerLink}>
            ¿No tienes cuenta?{" "}
            <Text style={{ fontWeight: "bold" }}>Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    color: "#000",
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 20,
    paddingVertical: 8,
    fontSize: 16,
    color: "#000",
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 25, // MÁS espacio entre contraseña y "¿Contraseña olvidada?"
  },

  forgotPassword: { alignSelf: "flex-end", marginBottom: 30 },
  forgotText: { color: "#aaa" },
  loginButton: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  registerLink: {
    textAlign: "center",
    fontSize: 14,
    color: "#555",
  },

  loginButtonText: { color: "#fff", fontWeight: "bold" },
  footer: { flexDirection: "row", justifyContent: "center" },
  footerText: { color: "#888" },
  registerText: { fontWeight: "bold", color: "#000" },
});

export default LoginScreen;
