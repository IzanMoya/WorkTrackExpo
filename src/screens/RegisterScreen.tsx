// src/screens/RegisterScreen.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { createUserWithEmailAndPassword } from "firebase/auth";
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
import api from "../api/axiosConfig";
import { auth } from "../services/firebase";
import { useAuth } from "../utils/AuthContext";

const RegisterScreen = ({ navigation }: any) => {
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rol, setRol] = useState("empleado");
  const [empresaNombre, setEmpresaNombre] = useState("");
  const { login } = useAuth();

  const handleRegister = async () => {
    if (
      !nombre ||
      !apellidos ||
      !email ||
      !password ||
      !rol ||
      !empresaNombre
    ) {
      Alert.alert("Completa todos los campos");
      return;
    }

    try {
      // 1. Crear cuenta en Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const idToken = await userCredential.user.getIdToken(true);

      await AsyncStorage.setItem("token", idToken);
      await AsyncStorage.setItem("email", userCredential.user.email || "");

      // 2. Comprobar si la empresa ya existe (nombre normalizado)
      const nombreEmpresaNormalizado = empresaNombre.trim().toLowerCase();
      let empresaId: number | null = null;

      try {
        const empresaResponse = await api.get(
          `/worktrack/empresas/nombre/${encodeURIComponent(
            nombreEmpresaNormalizado
          )}`,
          {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );
        empresaId = empresaResponse.data.id;
      } catch (err: any) {
        if (err.response?.status === 404) {
          // 3. Crear empresa si no existe
          const nuevaEmpresa = await api.post(
            "/worktrack/empresas",
            {
              nombre: empresaNombre,
              direccion: "",
              telefono: "",
              createdAt: new Date().toISOString(),
            },
            {
              headers: { Authorization: `Bearer ${idToken}` },
            }
          );
          console.log("🆕 Empresa creada:", nuevaEmpresa.data); // <--- Añade esto

          empresaId = nuevaEmpresa.data.id;
          if (!empresaId || isNaN(empresaId)) {
            throw new Error("❌ ID de empresa inválido tras creación");
          }
          
        } else {
          console.error("Error al buscar/crear empresa:", err);
          Alert.alert("Error", "Fallo al obtener o crear la empresa.");
          return;
        }
      }
      console.log("empresaId final:", empresaId);
      // 4. Verificación final
      if (!empresaId || isNaN(empresaId)) {
        Alert.alert("Error", "ID de empresa no válido");
        return;
      }

      console.log("✅ ID empresa usado:", empresaId);

      // 5. Crear usuario con empresa vinculada
      await api.post(
        "/worktrack/usuarios/registro",
        {
          nombre,
          apellidos,
          email,
          rol,
          empresa: { id: empresaId },
        },
        {
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );

      Alert.alert("Usuario creado correctamente");

      // 6. Obtener el ID del nuevo usuario
      const usuarioData = await api.get(`/worktrack/usuarios/email/${email}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      const usuarioId = usuarioData.data.id;
      const empresaIdFinal = usuarioData.data.empresaId || empresaId;

      await AsyncStorage.setItem("usuarioId", usuarioId.toString());
      await AsyncStorage.setItem("empresaId", empresaIdFinal.toString());

      console.log("📦 usuarioId:", usuarioId);
      console.log("🏢 empresaId:", empresaIdFinal);

      // 7. Autenticación y redirección
      login?.();
      navigation.reset({
        index: 0,
        routes: [{ name: "App" }],
      });
    } catch (error: any) {
      console.error("Error al registrar usuario:", error);
      Alert.alert("Error al registrar", error.message || "Error desconocido");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Introduce tus datos</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre"
          placeholderTextColor="#999"
          value={nombre}
          onChangeText={setNombre}
        />
        <TextInput
          style={styles.input}
          placeholder="Apellidos"
          placeholderTextColor="#999"
          value={apellidos}
          onChangeText={setApellidos}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Nombre de la empresa"
          placeholderTextColor="#999"
          value={empresaNombre}
          onChangeText={setEmpresaNombre}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Contraseña"
            placeholderTextColor="#999"
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

        <Text style={styles.label}>Selecciona tu rol</Text>

        {Platform.OS === "android" ? (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={rol}
              onValueChange={(itemValue) => setRol(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Selecciona un rol..." value="" />
              <Picker.Item label="Empleado" value="empleado" />
              <Picker.Item label="Admin" value="admin" />
            </Picker>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.iosPickerButton}
            onPress={() =>
              Alert.alert(
                "Selecciona tu rol",
                "",
                [
                  { text: "Empleado", onPress: () => setRol("empleado") },
                  { text: "Admin", onPress: () => setRol("admin") },
                  { text: "Cancelar", style: "cancel" },
                ],
                { cancelable: true }
              )
            }
          >
            <Text style={styles.iosPickerText}>
              {rol
                ? rol === "admin"
                  ? "Admin"
                  : "Empleado"
                : "Selecciona un rol..."}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Registrarte</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 20,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginBottom: 20,
    overflow: "hidden",
    height: 50,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  pickerAndroid: {
    height: 48,
    width: "100%",
  },
  picker: {
    height: Platform.OS === "ios" ? 150 : 50,
    width: "100%",
    color: "#000",
  },
  pickerItemIOS: {
    fontSize: 18,
    height: 150,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  iosPickerButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
    justifyContent: "center",
  },

  iosPickerText: {
    color: "#000",
    fontSize: 16,
  },
});

export default RegisterScreen;
function login() {
  throw new Error("Function not implemented.");
}
