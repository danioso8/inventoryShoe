import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  try {
    // Obtener token del header
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Acceso denegado',
        message: 'No se proporcionó token de autenticación' 
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Agregar información del usuario al request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        message: 'Tu sesión ha expirado, por favor inicia sesión nuevamente' 
      });
    }
    
    return res.status(401).json({ 
      error: 'Token inválido',
      message: 'El token de autenticación no es válido' 
    });
  }
};

export default authMiddleware;
