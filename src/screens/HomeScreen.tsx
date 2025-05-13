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
import { getFichajeEstado, registrarFichaje } from "../api/fichajesApi"; // debes crearlo tú

const HomeScreen = ({ navigation }: any) => {
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [fichando, setFichando] = useState(false);
  const [estado, setEstado] = useState("Pendiente");

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

      const usuarioId = 1; // ⚠️ Sustituye por ID real
      const estado = await getFichajeEstado(usuarioId);
      setEstado(estado); // "hecho" o "pendiente"
    })();
  }, []);

  const handleFicharSalida = async () => {
    setFichando(true);
    const usuarioId = await AsyncStorage.getItem("usuarioId");
    console.log(usuarioId)

    if (!usuarioId || !location) {
      Alert.alert("Error", "Faltan datos para registrar el fichaje");
      setFichando(false);
      return;
    }

    try {
      await registrarFichaje(
        parseInt(usuarioId), // Enviado como número
        location.latitude,
        location.longitude,
        new Date().toISOString()
      );
      setEstado("hecho");
      Alert.alert("Fichaje exitoso", "Has fichado la salida correctamente.");
    } catch (e) {
      Alert.alert("Error", "No se pudo registrar el fichaje");
    } finally {
      setFichando(false);
    }
  };

  return (
    <View style={styles.container}>
      {location && (
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
      )}

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.button, fichando && { opacity: 0.5 }]}
          onPress={handleFicharSalida}
          disabled={fichando}
        >
          <Text style={styles.buttonText}>
            {fichando ? "Fichando..." : "Fichar Salida"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.estadoLabel}>Estado Actual Fichaje</Text>
        <Text
          style={{
            color: estado === "Hecho" ? "green" : "red",
            fontWeight: "bold",
          }}
        >
          {estado}
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
});

export default HomeScreen;
