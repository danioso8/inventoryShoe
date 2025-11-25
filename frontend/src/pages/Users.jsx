import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import userService from "../services/userService";

function Users() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    role: "vendedor"
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate("/login");
      return;
    }
    
    // Solo owner y admin pueden acceder
    if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
      navigate("/dashboard");
      return;
    }
    
    setUser(currentUser);
    loadUsers();
  }, [navigate]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      alert(error.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.nombre,
        email: user.email,
        password: "",
        telefono: user.telefono || "",
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: "",
        email: "",
        password: "",
        telefono: "",
        role: "vendedor"
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingUser) {
        // No enviar password si está vacío en edición
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        delete updateData.email; // No se puede cambiar email
        
        await userService.update(editingUser.id, updateData);
        alert("Usuario actualizado exitosamente");
      } else {
        if (!formData.password) {
          alert("La contraseña es obligatoria");
          setLoading(false);
          return;
        }
        await userService.create(formData);
        alert("Usuario creado exitosamente");
      }
      
      handleCloseModal();
      loadUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      alert(error.message || "Error al guardar usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("¿Estás seguro de eliminar este usuario?")) return;
    
    try {
      await userService.delete(userId);
      alert("Usuario eliminado exitosamente");
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(error.message || "Error al eliminar usuario");
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      owner: { color: 'danger', text: 'Owner' },
      admin: { color: 'primary', text: 'Admin' },
      vendedor: { color: 'success', text: 'Vendedor' },
      solo_lectura: { color: 'secondary', text: 'Solo Lectura' }
    };
    const badge = badges[role] || badges.vendedor;
    return <span className={`badge bg-${badge.color}`}>{badge.text}</span>;
  };

  const getStatusBadge = (estado) => {
    const badges = {
      activo: { color: 'success', text: 'Activo' },
      inactivo: { color: 'warning', text: 'Inactivo' },
      bloqueado: { color: 'danger', text: 'Bloqueado' }
    };
    const badge = badges[estado] || badges.activo;
    return <span className={`badge bg-${badge.color}`}>{badge.text}</span>;
  };

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg shadow-sm" style={{ 
        background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)'
      }}>
        <div className="container-fluid px-4">
          <span 
            className="navbar-brand mb-0 fw-bold" 
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/admin/dashboard')}
          >
            👟 Inventory Shoes Online
          </span>
          <div className="d-flex align-items-center gap-3">
            {user && (
              <>
                <div className="text-white d-none d-md-block">
                  <div className="small opacity-75">Admin</div>
                  <div className="fw-semibold">{user.nombre}</div>
                </div>
                <span className="badge px-3 py-2" style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontSize: '0.85rem'
                }}>
                  {user.tienda_nombre}
                </span>
                <button 
                  className="btn btn-sm text-white border-0 px-3 py-2"
                  style={{ 
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                  onClick={handleLogout}
                >
                  Cerrar Sesión
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <div className="container-fluid px-4 py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>
              👥 Gestión de Usuarios
            </h2>
            <p className="text-muted mb-0">Administra los usuarios y sus roles</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary px-4"
              onClick={() => navigate('/admin/dashboard')}
            >
              ← Volver
            </button>
            <button 
              className="btn btn-lg px-4 text-white border-0 shadow"
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px'
              }}
              onClick={() => handleOpenModal()}
            >
              + Agregar Usuario
            </button>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
          <div className="card-body p-4">
            {loading && users.length === 0 ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-5">
                <div style={{ fontSize: '4rem', opacity: 0.3 }}>👥</div>
                <h4 className="fw-bold mb-2">No hay usuarios</h4>
                <p className="text-muted mb-4">Comienza agregando tu primer usuario vendedor</p>
                <button 
                  className="btn btn-primary px-4"
                  onClick={() => handleOpenModal()}
                >
                  Agregar Primer Usuario
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Último Login</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="fw-semibold">{u.nombre}</td>
                        <td>{u.email}</td>
                        <td>{u.telefono || '-'}</td>
                        <td>{getRoleBadge(u.role)}</td>
                        <td>{getStatusBadge(u.estado)}</td>
                        <td>
                          {u.fecha_ultimo_login 
                            ? new Date(u.fecha_ultimo_login).toLocaleDateString() 
                            : 'Nunca'}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleOpenModal(u)}
                              disabled={u.id === user?.id}
                            >
                              Editar
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(u.id)}
                              disabled={u.id === user?.id || u.role === 'owner'}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Agregar/Editar Usuario */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={handleCloseModal}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content" style={{ borderRadius: '20px' }}>
              <div className="modal-header border-0 pb-0">
                <h4 className="modal-title fw-bold">
                  {editingUser ? '✏️ Editar Usuario' : '➕ Agregar Nuevo Usuario'}
                </h4>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Nombre Completo *</label>
                    <input
                      type="text"
                      name="nombre"
                      className="form-control"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>

                  {!editingUser && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Email *</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      {editingUser ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={!editingUser}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Teléfono</label>
                    <input
                      type="tel"
                      name="telefono"
                      className="form-control"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      placeholder="Ej: 3001234567"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Rol *</label>
                    <select
                      name="role"
                      className="form-select"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="vendedor">Vendedor</option>
                      <option value="admin">Admin</option>
                      <option value="solo_lectura">Solo Lectura</option>
                    </select>
                    <small className="text-muted">
                      • Vendedor: Puede realizar ventas<br/>
                      • Admin: Acceso completo de administración<br/>
                      • Solo Lectura: Solo puede ver el inventario
                    </small>
                  </div>
                </div>

                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary px-4"
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : (editingUser ? 'Actualizar Usuario' : 'Crear Usuario')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
