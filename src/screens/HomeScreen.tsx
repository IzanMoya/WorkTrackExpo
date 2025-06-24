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
  registrarDescanso,
  registrarFichajeEntrada,
  registrarFichajeSalida,
} from "../api/fichajesApi";

const HomeScreen = ({ navigation }: any) => {
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [fichando, setFichando] = useState(false);
  const [estado, setEstado] = useState("pendiente");
  const [estadoDescanso, setEstadoDescanso] = useState("pendiente");
  const [fichandoEntrada, setFichandoEntrada] = useState(false);
  const [fichandoDescanso, setFichandoDescanso] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchLocationAndEstado = async (retryCount = 0) => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Permiso denegado",
              "Activa la ubicación para continuar"
            );
            return;
          }

          const loc = await Location.getCurrentPositionAsync({});
          console.log("✅ Ubicación actual:", loc.coords);

          if (isActive) {
            setLocation(loc.coords);
          }

          const usuarioIdStr = await AsyncStorage.getItem("usuarioId");
          console.log("📦 ID recuperado en HomeScreen:", usuarioIdStr);

          if (!usuarioIdStr) {
            Alert.alert("Error", "No se encontró el ID del usuario");
            return;
          }

          const usuarioId = parseInt(usuarioIdStr!, 10);
          if (isNaN(usuarioId)) {
            console.error("❌ usuarioId no válido:", usuarioIdStr);
            Alert.alert("Error interno", "ID del usuario no válido.");
            return;
          }

          const estadoObtenido = await getFichajeEstado(usuarioId);
          console.log("📌 Estado fichaje backend:", estadoObtenido);

          if (isActive) {
            if (
              !estadoObtenido ||
              estadoObtenido === "" ||
              estadoObtenido === "pendiente"
            ) {
              setEstado("pendiente");
              await AsyncStorage.multiRemove([
                "fichajeId",
                "fichajeLat",
                "fichajeLng",
              ]);
            } else {
              setEstado("hecho");
            }
          }
        } catch (error: any) {
          console.error("❌ Error al obtener ubicación:", error);

          const msg = error?.message ?? "";
          const isGooglePlayError =
            msg.includes("Play services") ||
            msg.includes("service disconnection");

          if (isGooglePlayError && retryCount < 3) {
            console.log(`⏳ Reintentando ubicación (${retryCount + 1}/3)...`);
            setTimeout(() => fetchLocationAndEstado(retryCount + 1), 2000);
          } else {
            Alert.alert(
              "Error de ubicación",
              isGooglePlayError
                ? "Google Play Services falló. Revisa que esté actualizado o reinicia el dispositivo/emulador."
                : "No se pudo obtener la ubicación ni el estado."
            );
          }
        }
      };

      fetchLocationAndEstado();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleFicharDescanso = async () => {
    setFichandoDescanso(true);

    try {
      const fichajeIdStr = await AsyncStorage.getItem("fichajeId");

      if (!fichajeIdStr || !location) {
        Alert.alert("Error", "Faltan datos para registrar el descanso");
        setFichandoDescanso(false);
        return;
      }

      const fichajeId = parseInt(fichajeIdStr, 10);

      const actualizado = await registrarDescanso(
        fichajeId,
        location.latitude,
        location.longitude
      );

      if (actualizado.enDescanso) {
        setEstadoDescanso("Descansando...");
        Alert.alert("Inicio de descanso registrado");
      } else {
        setEstadoDescanso("pendiente");
        Alert.alert("Fin de descanso registrado");
      }
    } catch (error) {
      console.error("Error al fichar descanso:", error);
      Alert.alert("Error", "No se pudo registrar el descanso");
    } finally {
      setFichandoDescanso(false);
    }
  };

  const handleFichar = async () => {
    setFichandoEntrada(true);

    try {
      const usuarioIdStr = await AsyncStorage.getItem("usuarioId");

      console.log("📦 ID recuperado de AsyncStorage:", usuarioIdStr);

      if (!usuarioIdStr || !location) {
        Alert.alert("Error", "Faltan datos para registrar el fichaje");
        setFichandoEntrada(true);
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

        console.log(
          "🛠️ Fichaje recibido del backend:",
          JSON.stringify(nuevoFichaje, null, 2)
        );

        if (!nuevoFichaje || !nuevoFichaje.id) {
          throw new Error("⚠️ Error: El fichaje devuelto no tiene ID");
        }

        console.log("🆕 Fichaje guardado con ID:", nuevoFichaje.id);
        await AsyncStorage.setItem("fichajeId", nuevoFichaje.id.toString());
        console.log("🛠️ Fichaje recibido:", nuevoFichaje);
        console.log(await AsyncStorage.getItem("fichajeId"));
        await AsyncStorage.setItem("fichajeLat", location.latitude.toString());
        await AsyncStorage.setItem("fichajeLng", location.longitude.toString());
        console.log("📝 Guardando datos entrada:");
        console.log("ID:", nuevoFichaje.id);
        console.log("Lat:", location.latitude);
        console.log("Lng:", location.longitude);

        setEstado("hecho");
        Alert.alert("Fichaje de entrada registrado");
      } else {
        // 🔴 Fichaje de salida

        const fichajeId = await AsyncStorage.getItem("fichajeId");
        const fichajeLatStr = await AsyncStorage.getItem("fichajeLat");
        const fichajeLngStr = await AsyncStorage.getItem("fichajeLng");

        if (!fichajeId || !fichajeLatStr || !fichajeLngStr) {
          await AsyncStorage.removeItem("fichajeId");
          await AsyncStorage.removeItem("fichajeLat");
          await AsyncStorage.removeItem("fichajeLng");
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

        console.log("🧠 Estado actual:");
        console.log("fichajeId:", fichajeId);
        console.log("fichajeLat:", fichajeLatStr);
        console.log("fichajeLng:", fichajeLngStr);
      }
    } catch (error) {
      console.error("❌ Error al fichar:", error);
      Alert.alert("Error", "No se pudo registrar el fichaje");
    } finally {
      setFichandoEntrada(false);
    }
  };

  return (
    <View style={styles.container}>
      {location ? (
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
          />
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando mapa...</Text>
        </View>
      )}

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.button]}
          onPress={handleFichar}
          disabled={fichandoEntrada || fichandoDescanso}
        >
          <Text style={styles.buttonText}>
            {fichandoEntrada
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

        <View style={{ height: 20 }} />

        <TouchableOpacity
          style={[styles.button]}
          onPress={handleFicharDescanso}
          disabled={fichandoDescanso}
        >
          <Text style={styles.buttonText}>
            {fichandoDescanso
              ? "Fichando..."
              : estadoDescanso === "pendiente"
              ? "Iniciar descanso"
              : "Finalizar descanso"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.estadoLabel}>Estado Descanso</Text>
        <Text
          style={{
            color:
              estadoDescanso === "pendiente"
                ? "red"
                : estadoDescanso === "en_descanso"
                ? "orange"
                : "green",
            fontWeight: "bold",
          }}
        >
          {estadoDescanso}
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
    padding: 15,
    borderRadius: 15,
    marginBottom: 20, // más separación
    width: "80%",
    alignItems: "center",
    backgroundColor: "#007bff", // azul
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  buttonBlack: {
    backgroundColor: "#000000",
  },
  estadoLabel: {
    fontSize: 14,
    marginTop: 5,
    marginBottom: 5,
    color: "#333",
  },

  loadingContainer: {
    height: Dimensions.get("window").height * 0.45,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#888",
  },
  buttonBlue: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    width: "80%",
    alignItems: "center",
  },
});

export default HomeScreen;
