import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

// Registrar nuevo usuario con tienda
export const register = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { nombre, email, password, nombre_tienda, telefono } = req.body;

    // Validaciones
    if (!nombre || !email || !password || !nombre_tienda) {
      return res.status(400).json({ 
        error: 'Campos incompletos',
        message: 'Todos los campos son obligatorios' 
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Email inválido',
        message: 'Por favor ingresa un email válido' 
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Contraseña débil',
        message: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    await connection.beginTransaction();

    // Verificar si el email ya existe
    const [existingUser] = await connection.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      await connection.rollback();
      return res.status(409).json({ 
        error: 'Email en uso',
        message: 'Este email ya está registrado' 
      });
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Crear usuario
    const [userResult] = await connection.execute(
      'INSERT INTO usuarios (nombre, email, password_hash, telefono, email_verificado) VALUES (?, ?, ?, ?, TRUE)',
      [nombre, email, password_hash, telefono || null]
    );

    const usuario_id = userResult.insertId;

    // Crear tienda con 3 meses gratis
    const [tiendaResult] = await connection.execute(
      'INSERT INTO tiendas (nombre, email, telefono, plan, fecha_fin_trial) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 3 MONTH))',
      [nombre_tienda, email, telefono || null, 'free']
    );

    const tienda_id = tiendaResult.insertId;

    // Relacionar usuario con tienda como owner
    await connection.execute(
      'INSERT INTO usuarios_tiendas (usuario_id, tienda_id, role) VALUES (?, ?, ?)',
      [usuario_id, tienda_id, 'owner']
    );

    await connection.commit();

    // Generar token JWT
    const token = jwt.sign(
      { 
        usuario_id, 
        tienda_id, 
        email, 
        role: 'owner' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      usuario: {
        id: usuario_id,
        nombre,
        email,
        tienda_id,
        tienda_nombre: nombre_tienda,
        role: 'owner'
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error en registro:', error);
    res.status(500).json({ 
      error: 'Error en el servidor',
      message: 'No se pudo completar el registro' 
    });
  } finally {
    connection.release();
  }
};

// Login de usuario
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Campos incompletos',
        message: 'Email y contraseña son obligatorios' 
      });
    }

    // Buscar usuario
    const [users] = await pool.execute(
      `SELECT u.id, u.nombre, u.email, u.password_hash, u.estado,
              ut.tienda_id, ut.role, t.nombre as tienda_nombre, t.plan, t.estado as tienda_estado
       FROM usuarios u
       INNER JOIN usuarios_tiendas ut ON u.id = ut.usuario_id
       INNER JOIN tiendas t ON ut.tienda_id = t.id
       WHERE u.email = ?
       LIMIT 1`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos' 
      });
    }

    const usuario = users[0];

    // Verificar estado del usuario
    if (usuario.estado !== 'activo') {
      return res.status(403).json({ 
        error: 'Usuario inactivo',
        message: 'Tu cuenta ha sido desactivada. Contacta con soporte.' 
      });
    }

    // Verificar estado de la tienda
    if (usuario.tienda_estado !== 'activo') {
      return res.status(403).json({ 
        error: 'Tienda suspendida',
        message: 'La tienda está suspendida. Contacta con soporte.' 
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, usuario.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos' 
      });
    }

    // Actualizar fecha de último login
    await pool.execute(
      'UPDATE usuarios SET fecha_ultimo_login = NOW() WHERE id = ?',
      [usuario.id]
    );

    // Generar token JWT
    const token = jwt.sign(
      { 
        usuario_id: usuario.id,
        tienda_id: usuario.tienda_id,
        email: usuario.email,
        role: usuario.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        tienda_id: usuario.tienda_id,
        tienda_nombre: usuario.tienda_nombre,
        plan: usuario.plan,
        role: usuario.role
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      error: 'Error en el servidor',
      message: 'No se pudo completar el login' 
    });
  }
};

// Obtener perfil del usuario autenticado
export const getProfile = async (req, res) => {
  try {
    const { usuario_id } = req.user;

    const [users] = await pool.execute(
      `SELECT u.id, u.nombre, u.email, u.telefono, u.fecha_ultimo_login,
              ut.tienda_id, ut.role, t.nombre as tienda_nombre, t.plan, t.estado as tienda_estado
       FROM usuarios u
       INNER JOIN usuarios_tiendas ut ON u.id = ut.usuario_id
       INNER JOIN tiendas t ON ut.tienda_id = t.id
       WHERE u.id = ?`,
      [usuario_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        message: 'No se encontró el perfil del usuario' 
      });
    }

    res.json({ usuario: users[0] });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ 
      error: 'Error en el servidor',
      message: 'No se pudo obtener el perfil' 
    });
  }
};
