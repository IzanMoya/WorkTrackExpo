import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import haversine from "haversine-distance";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView from "react-native-maps";
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

  useFocusEffect(
    useCallback(() => {
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
        setEstado(estado);
      })();
    }, [])
  );

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
        // 🟢 Fichaje de entrada

        // Guardar ubicación real como referencia para salida
        await AsyncStorage.setItem("fichajeLat", location.latitude.toString());
        await AsyncStorage.setItem("fichajeLng", location.longitude.toString());

        const nuevoFichaje = await registrarFichajeEntrada(
          usuarioId,
          location.latitude,
          location.longitude
        );

        await AsyncStorage.setItem("fichajeId", nuevoFichaje.id.toString());
        setEstado("hecho");
        Alert.alert("Fichaje de entrada registrado");
      } else {
        // 🔴 Fichaje de salida

        const fichajeId = await AsyncStorage.getItem("fichajeId");
        const fichajeLatStr = await AsyncStorage.getItem("fichajeLat");
        const fichajeLngStr = await AsyncStorage.getItem("fichajeLng");

        if (!fichajeId || !fichajeLatStr || !fichajeLngStr) {
          throw new Error("Datos del fichaje anterior no encontrados");
        }

        const entradaLocation = {
          lat: parseFloat(fichajeLatStr),
          lng: parseFloat(fichajeLngStr),
        };

        const salidaLocation = {
          lat: location.latitude,
          lng: location.longitude,
        };

        const distanciaSalida = haversine(salidaLocation, entradaLocation);

        if (distanciaSalida > 100) {
          Alert.alert(
            "Fuera de zona",
            `Estás a ${Math.round(
              distanciaSalida
            )} metros del punto donde fichaste entrada. Debes estar dentro de 100 metros para fichar salida.`
          );
          setFichando(false);
          return;
        }

        await registrarFichajeSalida(
          parseInt(fichajeId),
          location.latitude,
          location.longitude
        );

        await AsyncStorage.removeItem("fichajeId");
        await AsyncStorage.removeItem("fichajeLat");
        await AsyncStorage.removeItem("fichajeLng");

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
          {estado}
        </Text>
      </View>
    </View>
  );
}; // <--- asegúrate de cerrar aquí el componente antes de definir estilos

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  mapContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
    height: Dimensions.get("window").height * 0.45,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  map: {
    width: "100%",
    height: "100%",
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
