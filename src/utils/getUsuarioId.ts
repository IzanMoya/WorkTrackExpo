import api from "../api/axiosConfig";


export const obtenerUsuarioId = async (email: string) => {
  try {
    // No necesitas el token, porque esa ruta es pública
    const response = await api.get(`/worktrack/usuarios/email/${email}`);

    return response.data.id;
  } catch (error) {
    console.error("❌ Error al obtener el ID del usuario:", error);
    throw error;
  }
};
