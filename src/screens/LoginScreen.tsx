import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../api/axiosConfig";
import { auth } from "../services/firebase"; // ← compat
import { useAuth } from "../utils/AuthContext";
import { obtenerUsuarioId } from "../utils/getUsuarioId"; // Ajusta la ruta si está en otra carpeta

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
      const usuarioId = await obtenerUsuarioId(email);

      if (!usuarioId) {
        Alert.alert("Error", "No se pudo obtener el ID del usuario.");
        return;
      }

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
    <View style={styles.container}>
      <Text style={styles.title}>¡Bienvenido!</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Tu correo"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Contraseña</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Tu contraseña"
          secureTextEntry={!showPassword}
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
        <Text style={styles.forgotText}>¿Contraseña olvidada?</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿No tienes cuenta?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerText}> Regístrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
  },
  label: { fontSize: 14, color: "#000", marginBottom: 5 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 20,
    paddingVertical: 5,
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
  loginButtonText: { color: "#fff", fontWeight: "bold" },
  footer: { flexDirection: "row", justifyContent: "center" },
  footerText: { color: "#888" },
  registerText: { fontWeight: "bold", color: "#000" },
});

export default LoginScreen;
