import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from '../config/database.js';
import jwt from 'jsonwebtoken';

// Configurar estrategia de Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const nombre = profile.displayName;
      const googleId = profile.id;

      // Buscar si el usuario ya existe
      const [existingUsers] = await pool.execute(
        `SELECT u.*, ut.tienda_id, ut.role, t.nombre as tienda_nombre, t.plan
         FROM usuarios u
         LEFT JOIN usuarios_tiendas ut ON u.id = ut.usuario_id
         LEFT JOIN tiendas t ON ut.tienda_id = t.id
         WHERE u.email = ?`,
        [email]
      );

      if (existingUsers.length > 0) {
        // Usuario existente, hacer login
        return done(null, existingUsers[0]);
      }

      // Nuevo usuario, crear cuenta automáticamente
      const connection = await pool.getConnection();
      
      try {
        await connection.beginTransaction();

        // Crear usuario sin contraseña (usa Google OAuth)
        const [userResult] = await connection.execute(
          'INSERT INTO usuarios (nombre, email, password_hash, email_verificado) VALUES (?, ?, ?, TRUE)',
          [nombre, email, 'GOOGLE_OAUTH'] // Placeholder para password
        );

        const usuario_id = userResult.insertId;

        // Crear tienda automáticamente con nombre basado en el usuario
        const nombreTienda = `Tienda de ${nombre.split(' ')[0]}`;
        const [tiendaResult] = await connection.execute(
          'INSERT INTO tiendas (nombre, email, plan, fecha_fin_trial) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 3 MONTH))',
          [nombreTienda, email, 'free']
        );

        const tienda_id = tiendaResult.insertId;

        // Relacionar usuario con tienda
        await connection.execute(
          'INSERT INTO usuarios_tiendas (usuario_id, tienda_id, role) VALUES (?, ?, ?)',
          [usuario_id, tienda_id, 'owner']
        );

        await connection.commit();

        const newUser = {
          id: usuario_id,
          nombre,
          email,
          tienda_id,
          tienda_nombre: nombreTienda,
          role: 'owner',
          plan: 'free'
        };

        return done(null, newUser);

      } catch (error) {
        await connection.rollback();
        return done(error);
      } finally {
        connection.release();
      }

    } catch (error) {
      return done(error);
    }
  }
));

// Serializar usuario
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserializar usuario
passport.deserializeUser(async (id, done) => {
  try {
    const [users] = await pool.execute(
      `SELECT u.*, ut.tienda_id, ut.role, t.nombre as tienda_nombre, t.plan
       FROM usuarios u
       LEFT JOIN usuarios_tiendas ut ON u.id = ut.usuario_id
       LEFT JOIN tiendas t ON ut.tienda_id = t.id
       WHERE u.id = ?`,
      [id]
    );
    done(null, users[0]);
  } catch (error) {
    done(error);
  }
});

// Middleware para iniciar autenticación con Google
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email']
});

// Callback de Google
export const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`);
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        usuario_id: user.id,
        tienda_id: user.tienda_id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirigir al frontend con el token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      tienda_id: user.tienda_id,
      tienda_nombre: user.tienda_nombre,
      plan: user.plan,
      role: user.role
    }))}`);
  })(req, res, next);
};

export default passport;
