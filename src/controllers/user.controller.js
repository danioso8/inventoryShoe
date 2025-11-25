import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

// Obtener todos los usuarios de la tienda
export const getUsers = async (req, res) => {
  try {
    const { tienda_id } = req.user;

    const [users] = await pool.execute(
      `SELECT 
        u.id, u.nombre, u.email, u.telefono, u.estado, u.fecha_ultimo_login,
        ut.role, ut.fecha_asignacion,
        u.created_at
       FROM usuarios u
       INNER JOIN usuarios_tiendas ut ON u.id = ut.usuario_id
       WHERE ut.tienda_id = ?
       ORDER BY u.created_at DESC`,
      [tienda_id]
    );

    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ 
      error: 'Error al obtener usuarios',
      message: error.message 
    });
  }
};

// Crear nuevo usuario (vendedor/admin)
export const createUser = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { tienda_id, role: userRole } = req.user;
    const { nombre, email, password, telefono, role } = req.body;

    // Solo owner y admin pueden crear usuarios
    if (userRole !== 'owner' && userRole !== 'admin') {
      return res.status(403).json({ 
        error: 'Sin permisos',
        message: 'No tienes permisos para crear usuarios' 
      });
    }

    // Validaciones
    if (!nombre || !email || !password || !role) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        message: 'Nombre, email, contraseña y rol son obligatorios' 
      });
    }

    // Validar email
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

    // Validar rol
    const validRoles = ['admin', 'vendedor', 'solo_lectura'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Rol inválido',
        message: 'El rol debe ser: admin, vendedor o solo_lectura' 
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

    // Relacionar usuario con tienda
    await connection.execute(
      'INSERT INTO usuarios_tiendas (usuario_id, tienda_id, role) VALUES (?, ?, ?)',
      [usuario_id, tienda_id, role]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: {
        id: usuario_id,
        nombre,
        email,
        telefono,
        role
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error al crear usuario:', error);
    res.status(500).json({ 
      error: 'Error al crear usuario',
      message: error.message 
    });
  } finally {
    connection.release();
  }
};

// Actualizar usuario
export const updateUser = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { tienda_id, role: userRole } = req.user;
    const { id } = req.params;
    const { nombre, telefono, role, estado } = req.body;

    // Solo owner y admin pueden actualizar usuarios
    if (userRole !== 'owner' && userRole !== 'admin') {
      return res.status(403).json({ 
        error: 'Sin permisos',
        message: 'No tienes permisos para actualizar usuarios' 
      });
    }

    await connection.beginTransaction();

    // Verificar que el usuario pertenece a la tienda
    const [existing] = await connection.execute(
      'SELECT u.id FROM usuarios u INNER JOIN usuarios_tiendas ut ON u.id = ut.usuario_id WHERE u.id = ? AND ut.tienda_id = ?',
      [id, tienda_id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualizar datos del usuario
    if (nombre || telefono || estado) {
      await connection.execute(
        'UPDATE usuarios SET nombre = COALESCE(?, nombre), telefono = COALESCE(?, telefono), estado = COALESCE(?, estado) WHERE id = ?',
        [nombre, telefono, estado, id]
      );
    }

    // Actualizar rol si se proporciona
    if (role) {
      const validRoles = ['admin', 'vendedor', 'solo_lectura'];
      if (!validRoles.includes(role)) {
        await connection.rollback();
        return res.status(400).json({ 
          error: 'Rol inválido',
          message: 'El rol debe ser: admin, vendedor o solo_lectura' 
        });
      }

      await connection.execute(
        'UPDATE usuarios_tiendas SET role = ? WHERE usuario_id = ? AND tienda_id = ?',
        [role, id, tienda_id]
      );
    }

    await connection.commit();

    res.json({ message: 'Usuario actualizado exitosamente' });

  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ 
      error: 'Error al actualizar usuario',
      message: error.message 
    });
  } finally {
    connection.release();
  }
};

// Eliminar usuario
export const deleteUser = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { tienda_id, role: userRole, usuario_id: currentUserId } = req.user;
    const { id } = req.params;

    // Solo owner y admin pueden eliminar usuarios
    if (userRole !== 'owner' && userRole !== 'admin') {
      return res.status(403).json({ 
        error: 'Sin permisos',
        message: 'No tienes permisos para eliminar usuarios' 
      });
    }

    // No puede eliminarse a sí mismo
    if (parseInt(id) === currentUserId) {
      return res.status(400).json({ 
        error: 'Operación inválida',
        message: 'No puedes eliminarte a ti mismo' 
      });
    }

    await connection.beginTransaction();

    // Verificar que el usuario pertenece a la tienda y obtener su rol
    const [existing] = await connection.execute(
      'SELECT ut.role FROM usuarios u INNER JOIN usuarios_tiendas ut ON u.id = ut.usuario_id WHERE u.id = ? AND ut.tienda_id = ?',
      [id, tienda_id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Solo owner puede eliminar otros owners
    if (existing[0].role === 'owner' && userRole !== 'owner') {
      await connection.rollback();
      return res.status(403).json({ 
        error: 'Sin permisos',
        message: 'Solo el owner puede eliminar otros owners' 
      });
    }

    // Eliminar relación con la tienda (el usuario se elimina por CASCADE)
    await connection.execute(
      'DELETE FROM usuarios_tiendas WHERE usuario_id = ? AND tienda_id = ?',
      [id, tienda_id]
    );

    await connection.commit();

    res.json({ message: 'Usuario eliminado exitosamente' });

  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ 
      error: 'Error al eliminar usuario',
      message: error.message 
    });
  } finally {
    connection.release();
  }
};
