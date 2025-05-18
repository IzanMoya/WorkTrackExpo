import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";
import {
  getFichajeEstado,
  registrarFichajeEntrada,
  registrarFichajeSalida,
} from "../api/fichajesApi";

const HomeScreen = ({ navigation }: any) => {
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [fichando, setFichando] = useState(false);
  const [estado, setEstado] = useState("pendiente");

  // Ubicación del lugar de trabajo (mock o de tu base de datos)
  const ubicacionTrabajo = {
    latitude: 40.4168,
    longitude: -3.7038,
    radio: 100,
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Activa la ubicación para continuar");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      const usuarioIdStr = await AsyncStorage.getItem("usuarioId");

      console.log("📦 ID recuperado en HomeScreen:", usuarioIdStr);

      if (!usuarioIdStr) {
        Alert.alert("Error", "No se encontró el ID del usuario");
        return;
      }

      const usuarioId = parseInt(usuarioIdStr, 10);
      const estado = await getFichajeEstado(usuarioId);
      setEstado(estado); // "hecho" o "pendiente"
    })();
  }, []);

  const handleFichar = async () => {
    setFichando(true);

    try {
      const usuarioIdStr = await AsyncStorage.getItem("usuarioId");

      console.log("📦 ID recuperado de AsyncStorage:", usuarioIdStr); // ✅ CONSOLE.LOG

      if (!usuarioIdStr || !location) {
        Alert.alert("Error", "Faltan datos para registrar el fichaje");
        setFichando(false);
        return;
      }

      const usuarioId = parseInt(usuarioIdStr, 10);

      if (estado === "pendiente") {
        // Fichaje de entrada
        const nuevoFichaje = await registrarFichajeEntrada(
          usuarioId,
          location.latitude,
          location.longitude
        );

        await AsyncStorage.setItem("fichajeId", nuevoFichaje.id.toString());
        setEstado("hecho");
        Alert.alert("Fichaje de entrada registrado");
      } else {
        // Fichaje de salida
        const fichajeId = await AsyncStorage.getItem("fichajeId");

        console.log("🔄 Fichaje activo (id):", fichajeId); // opcional

        if (!fichajeId) throw new Error("No hay fichaje activo");

        await registrarFichajeSalida(
          parseInt(fichajeId),
          location.latitude,
          location.longitude
        );

        await AsyncStorage.removeItem("fichajeId");
        setEstado("pendiente");
        Alert.alert("Fichaje de salida registrado");
      }
    } catch (error) {
      console.error("❌ Error al fichar:", error);
      Alert.alert("Error", "No se pudo registrar el fichaje");
    } finally {
      setFichando(false);
    }
  };

  return (
    <View style={styles.container}>
      {location && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            showsUserLocation
          >
            <Marker
              coordinate={{
                latitude: ubicacionTrabajo.latitude,
                longitude: ubicacionTrabajo.longitude,
              }}
              title="Puesto de trabajo"
            />
            <Circle
              center={{
                latitude: ubicacionTrabajo.latitude,
                longitude: ubicacionTrabajo.longitude,
              }}
              radius={ubicacionTrabajo.radio}
              strokeColor="rgba(0,0,255,0.5)"
              fillColor="rgba(0,0,255,0.1)"
            />
          </MapView>
        </View>
      )}

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.button, fichando && { opacity: 0.5 }]}
          onPress={handleFichar}
          disabled={fichando}
        >
          <Text style={styles.buttonText}>
            {fichando
              ? "Fichando..."
              : estado === "pendiente"
              ? "Fichar Entrada"
              : "Fichar Salida"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.estadoLabel}>Estado Actual Fichaje</Text>
        <Text
          style={{
            color: estado === "hecho" ? "green" : "red",
            fontWeight: "bold",
          }}
        >
          {estado === "hecho" ? "Hecho" : "Pendiente"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.6,
  },
  bottomContainer: {
    padding: 20,
    alignItems: "center",
  },
  button: {
    backgroundColor: "black",
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  estadoLabel: {
    marginBottom: 5,
    fontSize: 16,
  },
  mapContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
    height: "45%", // Puedes ajustar esta altura
    borderWidth: 1,
    borderColor: "#ccc",
  },
});

export default HomeScreen;
