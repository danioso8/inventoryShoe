import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';

function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=google_auth_failed');
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        
        // Guardar token y usuario
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Redirigir al dashboard
        navigate('/dashboard');
      } catch (err) {
        console.error('Error parsing user data:', err);
        navigate('/login?error=auth_callback_failed');
      }
    } else {
      navigate('/login');
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Procesando...</span>
        </div>
        <h5>Completando autenticación con Google...</h5>
        <p className="text-muted">Por favor espera un momento</p>
      </div>
    </div>
  );
}

export default AuthCallback;
