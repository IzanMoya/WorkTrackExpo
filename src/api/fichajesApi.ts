import api from "./axiosConfig";

// POST: Registrar fichaje de ENTRADA
export const registrarFichajeEntrada = async (
  usuarioId: number,
  latitudInicio: number,
  longitudInicio: number
) => {
  const response = await api.post("/worktrack/fichajes", {
    usuarios: { id: usuarioId },
    latitudInicio,
    longitudInicio,
    fechaInicio: new Date().toISOString(),
  });

  return response.data; // devuelve el objeto creado con ID
};

// PUT: Registrar fichaje de SALIDA
export const registrarFichajeSalida = async (
  fichajeId: number,
  latitudFin: number,
  longitudFin: number
) => {
  const response = await api.put(`/worktrack/fichajes/${fichajeId}`, {
    latitudFin,
    longitudFin,
    fechaFin: new Date().toISOString(),
  });

  return response.data;
};

// GET: Consultar estado de fichaje
export const getFichajeEstado = async (usuarioId: number) => {
  const res = await api.get(`/worktrack/fichajes/estado/${usuarioId}`);
  return res.data; // Devuelve "hecho" o "pendiente"
};
