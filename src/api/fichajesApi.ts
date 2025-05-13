import api from "./axiosConfig";

// POST: Registrar fichaje
export const registrarFichaje = async (
  usuarioId: number,
  latitudFin: number,
  longitudFin: number,
  fechaFin: string
) => {
  return await api.post("/worktrack/fichajes", {
    latitudFin,
    longitudFin,
    fechaFin,
    usuarios: {
      id: usuarioId,
    },
  });
};

// GET: Consultar estado de fichaje
export const getFichajeEstado = async (usuarioId: number) => {
  const res = await api.get(`/worktrack/fichajes/estado/${usuarioId}`);
  return res.data; // Devuelve "hecho" o "pendiente"
};
