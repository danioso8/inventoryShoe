import pool from '../config/database.js';

// Obtener categorías de la tienda
export const getCategories = async (req, res) => {
  try {
    const { tienda_id } = req.user;

    const [categories] = await pool.execute(
      `SELECT 
        c.*,
        COUNT(p.id) as total_productos
       FROM categorias c
       LEFT JOIN productos p ON c.id = p.categoria_id AND p.tienda_id = c.tienda_id
       WHERE c.tienda_id = ? AND c.estado = 'activo'
       GROUP BY c.id
       ORDER BY c.nombre ASC`,
      [tienda_id]
    );

    res.json(categories);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ 
      error: 'Error al obtener categorías',
      message: error.message 
    });
  }
};

// Crear nueva categoría
export const createCategory = async (req, res) => {
  try {
    const { tienda_id } = req.user;
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({ 
        error: 'Nombre requerido',
        message: 'El nombre de la categoría es obligatorio' 
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO categorias (tienda_id, nombre, descripcion) VALUES (?, ?, ?)',
      [tienda_id, nombre, descripcion || null]
    );

    const [newCategory] = await pool.execute(
      'SELECT * FROM categorias WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Categoría creada exitosamente',
      categoria: newCategory[0]
    });

  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ 
      error: 'Error al crear categoría',
      message: error.message 
    });
  }
};
