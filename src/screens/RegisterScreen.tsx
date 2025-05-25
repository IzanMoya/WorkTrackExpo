// src/screens/RegisterScreen.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { createUserWithEmailAndPassword } from "firebase/auth";
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
import { auth } from "../services/firebase";

const RegisterScreen = ({ navigation }: any) => {
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rol, setRol] = useState("");

  const handleRegister = async () => {
    if (!nombre || !apellidos || !email || !password || !rol) {
      Alert.alert("Completa todos los campos");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const idToken = await userCredential.user.getIdToken();
      await AsyncStorage.setItem("token", idToken);

      await api.post(
        "/worktrack/usuarios/registro",
        {
          nombre,
          apellidos,
          email,
          rol,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      Alert.alert("Usuario creado correctamente");
      navigation.navigate("Login");
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error al registrar", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Introduce tus datos</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
      />
      <TextInput
        style={styles.input}
        placeholder="Apellidos"
        value={apellidos}
        onChangeText={setApellidos}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Contraseña"
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
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={rol}
          onValueChange={(itemValue) => setRol(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Rol..." value="" enabled={false} />
          <Picker.Item label="Empleado" value="empleado" />
          <Picker.Item label="Admin" value="admin" />
        </Picker>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registrarte</Text>
      </TouchableOpacity>
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 20,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 20,
  },
});

export default RegisterScreen;
