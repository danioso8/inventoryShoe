import api from './api';

const userService = {
  // Obtener todos los usuarios
  getAll: async () => {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener usuarios' };
    }
  },

  // Crear usuario
  create: async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al crear usuario' };
    }
  },

  // Actualizar usuario
  update: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar usuario' };
    }
  },

  // Eliminar usuario
  delete: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al eliminar usuario' };
    }
  }
};

export default userService;
