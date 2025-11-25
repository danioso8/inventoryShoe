
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    // Implementación de Google OAuth
    window.location.href = `${import.meta.env.VITE_API_URL || 'https://inventoryshoes-production.up.railway.app/api'}/auth/google`;
  };

  const handlesubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Por favor, completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      console.log("Login exitoso:", response);
      
      // Redirigir al dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Error en login:", err);
      setError(err.message || "Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            {/* Logo */}
            <div className="text-center mb-4">
              <h1 className="fw-black display-5" style={{fontFamily: 'Arial Black, sans-serif', letterSpacing: '2px'}}>
                INVENTORY SHOES ONLINE
              </h1>
            </div>

            {/* Tabs */}
            <div className="d-flex mb-4">
              <button className="btn btn-dark flex-fill text-uppercase fw-bold small rounded-0 py-2">
                Iniciar Sesión
              </button>
              <Link 
                to="/register" 
                className="btn btn-outline-dark flex-fill text-uppercase fw-bold small rounded-0 py-2"
              >
                Crear Cuenta
              </Link>
            </div>

            {/* Botón Google */}
            <button 
              className="btn btn-light w-100 d-flex align-items-center justify-content-center gap-3 mb-3 py-3 border shadow-sm"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                transition: 'all 0.2s',
                ':hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="fw-medium" style={{ color: '#3c4043' }}>Continuar con Google</span>
            </button>

            {/* Separador */}
            <div className="d-flex align-items-center my-3">
              <hr className="flex-grow-1" />
              <span className="px-3 text-muted small">O también puedes</span>
              <hr className="flex-grow-1" />
            </div>

            {error && (
              <div className="alert alert-danger alert-dismissible fade show small text-center" role="alert">
                {error}
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handlesubmit}>
              <div className="mb-3">
                <label className="form-label small fw-bold">
                  Correo Electrónico <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Ingresa tu correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control form-control-lg"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold">
                  Contraseña <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control form-control-lg"
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="showpass" />
                  <label className="form-check-label small" htmlFor="showpass">
                    Mostrar contraseña
                  </label>
                </div>
                <Link to="#" className="small text-primary text-decoration-none">
                  ¿Has olvidado tu contraseña?
                </Link>
              </div>

              {/* Espacio para reCAPTCHA */}
              <div className="d-flex justify-content-center mb-3">
                <div className="bg-light border rounded p-3 text-center text-muted small" style={{width: '100%', maxWidth: '300px', height: '64px'}}>
                  reCAPTCHA placeholder
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-dark w-100 text-uppercase fw-bold py-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Iniciando...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>

            <p className="mt-4 small text-muted text-center">
              Al continuar, confirmo que he leído y acepto{' '}
              <Link to="#" className="text-primary">Términos y Condiciones</Link> y{' '}
              <Link to="#" className="text-primary">Política de Privacidad</Link>.
            </p>
            <p className="small text-danger text-center">* Campos requeridos</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;