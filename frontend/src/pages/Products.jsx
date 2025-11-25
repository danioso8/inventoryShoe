import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import productService from "../services/productService";
import categoryService from "../services/categoryService";

function Products() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    marca: "",
    modelo: "",
    categoria_id: "",
    precio_compra: "",
    precio_venta: "",
    codigo_barras: "",
    sku: "",
    imagen_url: "",
    variantes: [{ talla: "", color: "", stock: "" }]
  });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setUser(currentUser);
    loadCategories();
    loadProducts();
  }, [navigate]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
      // No mostrar alert, solo log
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
      // Usar categorías por defecto si falla
      setCategories([
        { id: 1, nombre: "Deportivos" },
        { id: 2, nombre: "Casuales" },
        { id: 3, nombre: "Formales" },
        { id: 4, nombre: "Botas" },
        { id: 5, nombre: "Sandalias" }
      ]);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        ...product,
        variantes: product.variantes || [{ talla: "", color: "", stock: "" }]
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nombre: "",
        descripcion: "",
        marca: "",
        modelo: "",
        categoria_id: "",
        precio_compra: "",
        precio_venta: "",
        codigo_barras: "",
        sku: "",
        imagen_url: "",
        variantes: [{ talla: "", color: "", stock: "" }]
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariantes = [...formData.variantes];
    newVariantes[index][field] = value;
    setFormData(prev => ({ ...prev, variantes: newVariantes }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variantes: [...prev.variantes, { talla: "", color: "", stock: "" }]
    }));
  };

  const removeVariant = (index) => {
    if (formData.variantes.length > 1) {
      const newVariantes = formData.variantes.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, variantes: newVariantes }));
    }
  };

  const generateSKU = () => {
    const sku = `SKU-${Date.now().toString().slice(-8)}`;
    setFormData(prev => ({ ...prev, sku }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingProduct) {
        await productService.update(editingProduct.id, formData);
        alert("Producto actualizado exitosamente");
      } else {
        await productService.create(formData);
        alert("Producto creado exitosamente");
      }
      
      handleCloseModal();
      loadProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      alert(error.message || "Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("¿Estás seguro de eliminar este producto?")) return;
    
    try {
      await productService.delete(productId);
      alert("Producto eliminado exitosamente");
      loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(error.message || "Error al eliminar el producto");
    }
  };  console.log("Eliminando producto:", productId);
      alert("Producto eliminado exitosamente");
      loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error al eliminar el producto");
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.codigo_barras?.includes(searchTerm) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.categoria_id === parseInt(filterCategory);
    return matchesSearch && matchesCategory;
  });

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
            onClick={() => navigate('/dashboard')}
          >
            👟 Inventory Shoes Online
          </span>
          <div className="d-flex align-items-center gap-3">
            {user && (
              <>
                <div className="text-white d-none d-md-block">
                  <div className="small opacity-75">Bienvenido</div>
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
              📦 Inventario de Productos
            </h2>
            <p className="text-muted mb-0">Gestiona tus productos, variantes y stock</p>
          </div>
          <button 
            className="btn btn-lg px-4 text-white border-0 shadow"
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px'
            }}
            onClick={() => handleOpenModal()}
          >
            + Agregar Producto
          </button>
        </div>

        {/* Filtros */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="🔍 Buscar por nombre, código de barras o SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ borderRadius: '10px' }}
                />
              </div>
              <div className="col-md-4">
                <select
                  className="form-select form-select-lg"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{ borderRadius: '10px' }}
                >
                  <option value="">Todas las categorías</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <button 
                  className="btn btn-outline-secondary btn-lg w-100"
                  onClick={() => { setSearchTerm(""); setFilterCategory(""); }}
                  style={{ borderRadius: '10px' }}
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Productos */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="card-body text-center py-5">
              <div style={{ fontSize: '4rem', opacity: 0.3 }}>📦</div>
              <h4 className="fw-bold mb-2">No hay productos</h4>
              <p className="text-muted mb-4">
                {products.length === 0 
                  ? "Comienza agregando tu primer producto al inventario"
                  : "No se encontraron productos con los filtros aplicados"
                }
              </p>
              {products.length === 0 && (
                <button 
                  className="btn btn-primary px-4"
                  onClick={() => handleOpenModal()}
                >
                  Agregar Primer Producto
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="col-12 col-md-6 col-xl-4">
                <ProductCard 
                  product={product} 
                  onEdit={handleOpenModal}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Agregar/Editar Producto */}
      {showModal && (
        <ProductModal
          show={showModal}
          onClose={handleCloseModal}
          formData={formData}
          onInputChange={handleInputChange}
          onVariantChange={handleVariantChange}
          addVariant={addVariant}
          removeVariant={removeVariant}
          onSubmit={handleSubmit}
          categories={categories}
          generateSKU={generateSKU}
          generateBarcode={generateBarcode}
          isEditing={!!editingProduct}
          loading={loading}
        />
      )}
    </div>
  );
}

// Componente de Tarjeta de Producto
function ProductCard({ product, onEdit, onDelete }) {
  const defaultImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23f0f0f0' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='60' fill='%23999'%3E👟%3C/text%3E%3C/svg%3E";

  const totalStock = product.variantes?.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0) || 0;

  return (
    <div className="card border-0 shadow-sm h-100" style={{ 
      borderRadius: '16px',
      transition: 'all 0.3s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    }}>
      {/* Imagen */}
      <div style={{ 
        height: '200px', 
        overflow: 'hidden',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
        background: '#f8f9fa'
      }}>
        <img 
          src={product.imagen_url || defaultImage} 
          alt={product.nombre}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover' 
          }}
          onError={(e) => { e.target.src = defaultImage; }}
        />
      </div>

      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="card-title fw-bold mb-0 flex-grow-1">{product.nombre}</h5>
          <span className={`badge ${totalStock > 10 ? 'bg-success' : totalStock > 0 ? 'bg-warning' : 'bg-danger'}`}>
            Stock: {totalStock}
          </span>
        </div>

        <p className="text-muted small mb-2">{product.marca} - {product.modelo}</p>
        
        <div className="mb-2">
          <div className="small text-muted">Precio Venta</div>
          <div className="h5 mb-0 fw-bold text-success">${product.precio_venta}</div>
        </div>

        {product.variantes && product.variantes.length > 0 && (
          <div className="mb-3">
            <small className="text-muted">Variantes:</small>
            <div className="d-flex flex-wrap gap-1 mt-1">
              {product.variantes.slice(0, 5).map((v, i) => (
                <span key={i} className="badge bg-light text-dark" style={{ fontSize: '0.7rem' }}>
                  {v.talla} - {v.color}
                </span>
              ))}
              {product.variantes.length > 5 && (
                <span className="badge bg-light text-dark" style={{ fontSize: '0.7rem' }}>
                  +{product.variantes.length - 5} más
                </span>
              )}
            </div>
          </div>
        )}

        <div className="d-flex gap-2">
          <button 
            className="btn btn-sm btn-outline-primary flex-grow-1"
            onClick={() => onEdit(product)}
          >
            Editar
          </button>
          <button 
            className="btn btn-sm btn-outline-danger"
            onClick={() => onDelete(product.id)}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente Modal
function ProductModal({ 
  show, 
  onClose, 
  formData, 
  onInputChange, 
  onVariantChange,
  addVariant,
  removeVariant,
  onSubmit, 
  categories,
  generateSKU,
  generateBarcode,
  isEditing,
  loading
}) {
  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content" style={{ borderRadius: '20px' }}>
          <div className="modal-header border-0 pb-0">
            <h4 className="modal-title fw-bold">
              {isEditing ? '✏️ Editar Producto' : '➕ Agregar Nuevo Producto'}
            </h4>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              {/* Información Básica */}
              <div className="card border-0 bg-light mb-3">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">📝 Información Básica</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Nombre del Producto *</label>
                      <input
                        type="text"
                        name="nombre"
                        className="form-control"
                        value={formData.nombre}
                        onChange={onInputChange}
                        required
                        placeholder="Ej: Nike Air Max 270"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Marca</label>
                      <input
                        type="text"
                        name="marca"
                        className="form-control"
                        value={formData.marca}
                        onChange={onInputChange}
                        placeholder="Ej: Nike"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Modelo</label>
                      <input
                        type="text"
                        name="modelo"
                        className="form-control"
                        value={formData.modelo}
                        onChange={onInputChange}
                        placeholder="Ej: Air Max 270"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Descripción</label>
                      <textarea
                        name="descripcion"
                        className="form-control"
                        rows="2"
                        value={formData.descripcion}
                        onChange={onInputChange}
                        placeholder="Descripción detallada del producto..."
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Categoría</label>
                      <select
                        name="categoria_id"
                        className="form-select"
                        value={formData.categoria_id}
                        onChange={onInputChange}
                      >
                        <option value="">Seleccionar...</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">URL de Imagen</label>
                      <input
                        type="url"
                        name="imagen_url"
                        className="form-control"
                        value={formData.imagen_url}
                        onChange={onInputChange}
                        placeholder="https://..."
                      />
                      <small className="text-muted">Si no agregas imagen, se mostrará un ícono de zapato</small>
                    </div>
                    <div className="col-md-4">
                      {formData.imagen_url && (
                        <div className="mt-4">
                          <img 
                            src={formData.imagen_url} 
                            alt="Preview" 
                            style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }}
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Códigos */}
              <div className="card border-0 bg-light mb-3">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">🔢 Códigos de Identificación</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">SKU (Código Interno)</label>
                      <div className="input-group">
                        <input
                          type="text"
                          name="sku"
                          className="form-control"
                          value={formData.sku}
                          onChange={onInputChange}
                          placeholder="SKU-12345678"
                        />
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary"
                          onClick={generateSKU}
                        >
                          Generar
                        </button>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Código de Barras</label>
                      <div className="input-group">
                        <input
                          type="text"
                          name="codigo_barras"
                          className="form-control"
                          value={formData.codigo_barras}
                          onChange={onInputChange}
                          placeholder="1234567890123"
                        />
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary"
                          onClick={generateBarcode}
                        >
                          Generar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Precios */}
              <div className="card border-0 bg-light mb-3">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">💰 Precios</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Precio de Compra</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          name="precio_compra"
                          className="form-control"
                          value={formData.precio_compra}
                          onChange={onInputChange}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Precio de Venta *</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          name="precio_venta"
                          className="form-control"
                          value={formData.precio_venta}
                          onChange={onInputChange}
                          min="0"
                          step="0.01"
                          required
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                  {formData.precio_compra && formData.precio_venta && (
                    <div className="alert alert-info mt-3 mb-0">
                      <strong>Margen de ganancia:</strong> ${(formData.precio_venta - formData.precio_compra).toFixed(2)} 
                      ({(((formData.precio_venta - formData.precio_compra) / formData.precio_compra) * 100).toFixed(1)}%)
                    </div>
                  )}
                </div>
              </div>

              {/* Variantes */}
              <div className="card border-0 bg-light">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">👕 Variantes (Tallas y Colores)</h6>
                    <button 
                      type="button" 
                      className="btn btn-sm btn-primary"
                      onClick={addVariant}
                    >
                      + Agregar Variante
                    </button>
                  </div>

                  {formData.variantes.map((variante, index) => (
                    <div key={index} className="row g-2 mb-2 align-items-end">
                      <div className="col-md-3">
                        <label className="form-label small fw-semibold">Talla</label>
                        <input
                          type="text"
                          className="form-control"
                          value={variante.talla}
                          onChange={(e) => onVariantChange(index, 'talla', e.target.value)}
                          placeholder="Ej: 42, L, XL"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold">Color</label>
                        <input
                          type="text"
                          className="form-control"
                          value={variante.color}
                          onChange={(e) => onVariantChange(index, 'color', e.target.value)}
                          placeholder="Ej: Negro, Rojo"
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-semibold">Stock</label>
                        <input
                          type="number"
                          className="form-control"
                          value={variante.stock}
                          onChange={(e) => onVariantChange(index, 'stock', e.target.value)}
                          min="0"
                          placeholder="0"
                        />
                      </div>
                      <div className="col-md-2">
                        <button 
                          type="button"
                          className="btn btn-outline-danger w-100"
                          onClick={() => removeVariant(index)}
                          disabled={formData.variantes.length === 1}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer border-0">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary px-4"
                disabled={loading}
              >
                {loading ? 'Guardando...' : (isEditing ? 'Actualizar Producto' : 'Crear Producto')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Products;
