import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import productService from "../services/productService";
import invoiceService from "../services/invoiceService";

function SellerDashboard() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setUser(currentUser);
    loadProducts();
  }, [navigate]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filtrar productos por búsqueda
  const filteredProducts = products.filter(product => {
    const search = searchTerm.toLowerCase();
    return (
      product.nombre?.toLowerCase().includes(search) ||
      product.marca?.toLowerCase().includes(search) ||
      product.codigo_barras?.includes(searchTerm) ||
      product.sku?.toLowerCase().includes(search)
    );
  });

  // Agregar al carrito
  const addToCart = (product, variant) => {
    const existingItem = cart.find(
      item => item.producto_id === product.id && 
              item.producto_talla_id === variant.id
    );

    if (existingItem) {
      // Incrementar cantidad
      setCart(cart.map(item =>
        item.producto_id === product.id && 
        item.producto_talla_id === variant.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      // Agregar nuevo item
      setCart([
        ...cart,
        {
          producto_id: product.id,
          producto_talla_id: variant.id,
          nombre: product.nombre,
          marca: product.marca,
          talla: variant.talla,
          color: variant.color,
          precio: product.precio_venta,
          cantidad: 1,
          stock_disponible: variant.stock
        }
      ]);
    }
    
    // Mostrar carrito automáticamente
    setShowCart(true);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    if (newQuantity > cart[index].stock_disponible) {
      alert(`Solo hay ${cart[index].stock_disponible} unidades disponibles`);
      return;
    }
    
    setCart(cart.map((item, i) =>
      i === index ? { ...item, cantidad: newQuantity } : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    // Solicitar datos del cliente
    const clienteNombre = prompt("Nombre del cliente:");
    if (!clienteNombre) return;

    const clienteDocumento = prompt("Documento del cliente (opcional):");
    const clienteTelefono = prompt("Teléfono del cliente (opcional):");
    
    const metodoPago = prompt("Método de pago:\n1. Efectivo\n2. Tarjeta\n3. Transferencia\nIngrese el número:");
    const metodosPago = {
      '1': 'efectivo',
      '2': 'tarjeta',
      '3': 'transferencia'
    };

    if (!metodosPago[metodoPago]) {
      alert("Método de pago inválido");
      return;
    }

    setLoading(true);
    try {
      // Preparar items de la factura
      const items = cart.map(item => ({
        producto_id: item.producto_id,
        producto_talla_id: item.producto_talla_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio
      }));

      const facturaData = {
        cliente_nombre: clienteNombre,
        cliente_documento: clienteDocumento || null,
        cliente_telefono: clienteTelefono || null,
        metodo_pago: metodosPago[metodoPago],
        items
      };

      const response = await invoiceService.create(facturaData);
      
      if (response.success) {
        alert(`✅ Factura creada exitosamente!\nTotal: $${calculateTotal().toLocaleString('es-CO')}`);
        setCart([]);
        setShowCart(false);
        loadProducts(); // Recargar productos para actualizar stock
      }
    } catch (error) {
      console.error("Error al crear factura:", error);
      alert("Error al procesar la venta: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg shadow-sm" style={{ 
        background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)'
      }}>
        <div className="container-fluid px-4">
          <span className="navbar-brand mb-0 fw-bold" style={{ 
            fontSize: '1.3rem',
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            👟 Punto de Venta
          </span>
          <div className="d-flex align-items-center gap-3">
            {user && (
              <>
                <div className="text-white d-none d-md-block">
                  <div className="small opacity-75">Vendedor</div>
                  <div className="fw-semibold">{user.nombre}</div>
                </div>
                <span className="badge px-3 py-2" style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontSize: '0.85rem'
                }}>
                  {user.tienda_nombre}
                </span>
                <button 
                  className="btn btn-sm text-white border-0 px-3 py-2 position-relative"
                  style={{ 
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                  onClick={() => setShowCart(!showCart)}
                >
                  🛒 Carrito
                  {cart.length > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {cart.length}
                    </span>
                  )}
                </button>
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

      <div className="container-fluid px-4 py-4">
        <div className="row">
          {/* Panel de búsqueda y productos */}
          <div className={showCart ? "col-lg-8" : "col-12"}>
            {/* Búsqueda */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3">🔍 Buscar Producto</h5>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Buscar por nombre, marca, código de barras o SKU..."
                  value={searchTerm}
                  onChange={handleSearch}
                  style={{ borderRadius: '10px' }}
                  autoFocus
                />
              </div>
            </div>

            {/* Lista de productos */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                <div className="card-body text-center py-5">
                  <div style={{ fontSize: '3rem', opacity: 0.3 }}>📦</div>
                  <h5 className="fw-bold mb-2">No se encontraron productos</h5>
                  <p className="text-muted">
                    {searchTerm 
                      ? "Intenta con otro término de búsqueda" 
                      : "No hay productos en el inventario"
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="row g-3">
                {filteredProducts.map(product => (
                  <div key={product.id} className="col-12">
                    <ProductCard 
                      product={product} 
                      onAddToCart={addToCart}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel del carrito */}
          {showCart && (
            <div className="col-lg-4">
              <div className="card border-0 shadow-lg sticky-top" style={{ 
                borderRadius: '16px',
                top: '20px'
              }}>
                <div className="card-header border-0 pt-4 px-4" style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px'
                }}>
                  <h5 className="fw-bold text-white mb-0">🛒 Carrito de Venta</h5>
                </div>
                <div className="card-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {cart.length === 0 ? (
                    <div className="text-center py-4">
                      <div style={{ fontSize: '3rem', opacity: 0.3 }}>🛒</div>
                      <p className="text-muted">Carrito vacío</p>
                    </div>
                  ) : (
                    <>
                      {cart.map((item, index) => (
                        <div key={index} className="card mb-2 border">
                          <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div className="flex-grow-1">
                                <h6 className="mb-1">{item.nombre}</h6>
                                <small className="text-muted">
                                  {item.marca} - Talla {item.talla} - {item.color}
                                </small>
                              </div>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeFromCart(index)}
                              >
                                ×
                              </button>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="input-group input-group-sm" style={{ width: '100px' }}>
                                <button 
                                  className="btn btn-outline-secondary"
                                  onClick={() => updateQuantity(index, item.cantidad - 1)}
                                >
                                  -
                                </button>
                                <input 
                                  type="text" 
                                  className="form-control text-center"
                                  value={item.cantidad}
                                  readOnly
                                />
                                <button 
                                  className="btn btn-outline-secondary"
                                  onClick={() => updateQuantity(index, item.cantidad + 1)}
                                >
                                  +
                                </button>
                              </div>
                              <div className="text-end">
                                <div className="small text-muted">${item.precio} c/u</div>
                                <div className="fw-bold">${(item.precio * item.cantidad).toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="border-top pt-3 mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="mb-0">Total:</h5>
                          <h4 className="mb-0 text-success fw-bold">${calculateTotal().toFixed(2)}</h4>
                        </div>
                        <button 
                          className="btn btn-lg w-100 text-white border-0"
                          style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '10px'
                          }}
                          onClick={handleCheckout}
                        >
                          Procesar Venta
                        </button>
                        <button 
                          className="btn btn-outline-secondary w-100 mt-2"
                          onClick={() => setCart([])}
                        >
                          Limpiar Carrito
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente de tarjeta de producto para vendedor
function ProductCard({ product, onAddToCart }) {
  const defaultImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='40' fill='%23999'%3E👟%3C/text%3E%3C/svg%3E";

  const totalStock = product.variantes?.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0) || 0;

  return (
    <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
      <div className="card-body p-3">
        <div className="row align-items-center">
          <div className="col-auto">
            <img 
              src={product.imagen_url || defaultImage} 
              alt={product.nombre}
              style={{ 
                width: '80px', 
                height: '80px', 
                objectFit: 'cover',
                borderRadius: '8px'
              }}
              onError={(e) => { e.target.src = defaultImage; }}
            />
          </div>
          <div className="col">
            <h6 className="fw-bold mb-1">{product.nombre}</h6>
            <p className="text-muted small mb-2">{product.marca} - {product.modelo}</p>
            <div className="d-flex gap-2 align-items-center">
              <span className="badge bg-success">${product.precio_venta}</span>
              <span className={`badge ${totalStock > 10 ? 'bg-primary' : totalStock > 0 ? 'bg-warning' : 'bg-danger'}`}>
                Stock: {totalStock}
              </span>
            </div>
          </div>
          <div className="col-auto">
            {product.variantes && product.variantes.length > 0 ? (
              <div className="btn-group-vertical">
                {product.variantes
                  .filter(v => v.stock > 0)
                  .slice(0, 3)
                  .map((variant, i) => (
                    <button
                      key={i}
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onAddToCart(product, variant)}
                      disabled={variant.stock === 0}
                    >
                      T{variant.talla} {variant.color}
                    </button>
                  ))}
                {product.variantes.filter(v => v.stock > 0).length > 3 && (
                  <small className="text-muted text-center mt-1">
                    +{product.variantes.filter(v => v.stock > 0).length - 3} más
                  </small>
                )}
              </div>
            ) : (
              <button 
                className="btn btn-primary"
                disabled={totalStock === 0}
              >
                Sin variantes
              </button>
            )}
          </div>
        </div>
        
        {/* Expandir todas las variantes */}
        {product.variantes && product.variantes.length > 3 && (
          <div className="mt-3 pt-3 border-top">
            <details>
              <summary className="btn btn-sm btn-link p-0 text-decoration-none">
                Ver todas las tallas ({product.variantes.length})
              </summary>
              <div className="mt-2 d-flex flex-wrap gap-2">
                {product.variantes.map((variant, i) => (
                  <button
                    key={i}
                    className={`btn btn-sm ${variant.stock > 0 ? 'btn-outline-primary' : 'btn-outline-secondary'}`}
                    onClick={() => onAddToCart(product, variant)}
                    disabled={variant.stock === 0}
                  >
                    T{variant.talla} {variant.color} ({variant.stock})
                  </button>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerDashboard;
