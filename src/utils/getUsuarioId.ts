import api from "../api/axiosConfig";

export const obtenerUsuarioId = async (email: string): Promise<number | null> => {
  try {
    const response = await api.get(`/worktrack/usuarios/email/${email}`);
    return response.data?.id ?? null;
  } catch (error) {
    console.error("❌ Error al obtener el ID del usuario:", error);
    return null;
  }
};
