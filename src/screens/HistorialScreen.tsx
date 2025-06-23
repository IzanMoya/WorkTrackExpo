import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import api from "../api/axiosConfig";

const HistorialScreen = ({ navigation }: any) => {
  const [fichajes, setFichajes] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const usuarioIdStr = await AsyncStorage.getItem("usuarioId");
        if (!token || !usuarioIdStr) {
          Alert.alert("Error", "No se encontró sesión.");
          navigation.navigate("Login");
          return;
        }

        // Obtener usuario completo
        const resUsuario = await api.get(
          `/worktrack/usuarios/${usuarioIdStr}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const usuario = resUsuario.data;

        if (usuario.rol !== "admin") {
          Alert.alert(
            "Acceso denegado",
            "No tienes permisos para ver el historial."
          );
          navigation.goBack();
          return;
        }

        setIsAdmin(true);

        // Obtener fichajes filtrados por empresa
        const empresaId = usuario.empresa?.id;
        if (!empresaId) {
          Alert.alert("Error", "No se encontró la empresa del usuario.");
          return;
        }

        const resFichajes = await api.get(
          `/worktrack/fichajes/empresa/${empresaId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Ordenar los fichajes por fecha de entrada descendente
        const fichajesOrdenados = resFichajes.data.sort(
          (a: any, b: any) =>
            new Date(b.fechaInicio).getTime() -
            new Date(a.fechaInicio).getTime()
        );

        setFichajes(fichajesOrdenados);
      } catch (error) {
        console.error("Error al obtener historial:", error);
        Alert.alert("Error", "No se pudo cargar el historial.");
      }
    };

    fetchData();
  }, []);

  if (!isAdmin) return null;

  const renderItem = ({ item }: any) => {
    const entrada = item.fechaInicio
      ? moment(item.fechaInicio).format("DD/MM/YYYY HH:mm")
      : "Sin entrada";
    const salida = item.fechaFin
      ? moment(item.fechaFin).format("DD/MM/YYYY HH:mm")
      : "Sin salida";
    const latInicio = item.latitudInicio?.toFixed(4) ?? "N/A";
    const lonInicio = item.longitudInicio?.toFixed(4) ?? "N/A";
    const latFin = item.latitudFin?.toFixed(4) ?? "N/A";
    const lonFin = item.longitudFin?.toFixed(4) ?? "N/A";

    return (
      <View style={styles.card}>
        <Text
          style={styles.employee}
        >{`${item.usuarios.nombre} ${item.usuarios.apellidos}`}</Text>
        <Text>📅 Entrada: {entrada}</Text>
        <Text>📅 Salida: {salida}</Text>
        <Text>
          📍 Punto de inicio: ({latInicio}, {lonInicio})
        </Text>
        <Text>
          📍 Punto de fin: ({latFin}, {lonFin})
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de Fichajes</Text>
      <FlatList
        data={fichajes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text>No hay fichajes aún.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 15 },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  employee: { fontWeight: "bold", fontSize: 16, marginBottom: 5 },
});

export default HistorialScreen;
