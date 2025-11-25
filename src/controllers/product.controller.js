import pool from '../config/database.js';

// Obtener todos los productos de una tienda
export const getProducts = async (req, res) => {
  try {
    const { tienda_id } = req.user;
    const { categoria_id, search } = req.query;

    let query = `
      SELECT 
        p.*,
        c.nombre as categoria_nombre,
        (SELECT COUNT(*) FROM producto_tallas WHERE producto_id = p.id) as total_variantes,
        (SELECT COALESCE(SUM(stock), 0) FROM producto_tallas WHERE producto_id = p.id) as stock_total
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.tienda_id = ?
    `;
    
    const params = [tienda_id];

    if (categoria_id) {
      query += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    if (search) {
      query += ' AND (p.nombre LIKE ? OR p.codigo_barras LIKE ? OR p.sku LIKE ? OR p.marca LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY p.created_at DESC';

    const [products] = await pool.execute(query, params);

    // Obtener variantes para cada producto
    for (let product of products) {
      const [variantes] = await pool.execute(
        'SELECT id, talla, color, stock FROM producto_tallas WHERE producto_id = ? ORDER BY talla, color',
        [product.id]
      );
      product.variantes = variantes;
    }

    res.json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ 
      error: 'Error al obtener productos',
      message: error.message 
    });
  }
};

// Obtener un producto por ID
export const getProductById = async (req, res) => {
  try {
    const { tienda_id } = req.user;
    const { id } = req.params;

    const [products] = await pool.execute(
      `SELECT p.*, c.nombre as categoria_nombre
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.id = ? AND p.tienda_id = ?`,
      [id, tienda_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const product = products[0];

    // Obtener variantes
    const [variantes] = await pool.execute(
      'SELECT * FROM producto_tallas WHERE producto_id = ? ORDER BY talla, color',
      [id]
    );

    product.variantes = variantes;

    res.json(product);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ 
      error: 'Error al obtener producto',
      message: error.message 
    });
  }
};

// Crear nuevo producto
export const createProduct = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { tienda_id } = req.user;
    const {
      nombre,
      descripcion,
      marca,
      modelo,
      categoria_id,
      precio_compra,
      precio_venta,
      codigo_barras,
      sku,
      imagen_url,
      variantes
    } = req.body;

    // Validaciones
    if (!nombre || !precio_venta) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        message: 'El nombre y precio de venta son obligatorios' 
      });
    }

    await connection.beginTransaction();

    // Insertar producto
    const [result] = await connection.execute(
      `INSERT INTO productos (
        tienda_id, categoria_id, nombre, descripcion, marca, modelo,
        precio_compra, precio_venta, codigo_barras, sku, imagen_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tienda_id,
        categoria_id || null,
        nombre,
        descripcion || null,
        marca || null,
        modelo || null,
        precio_compra || 0,
        precio_venta,
        codigo_barras || null,
        sku || null,
        imagen_url || null
      ]
    );

    const producto_id = result.insertId;

    // Insertar variantes si existen
    if (variantes && Array.isArray(variantes) && variantes.length > 0) {
      for (const variante of variantes) {
        if (variante.talla || variante.color) {
          await connection.execute(
            'INSERT INTO producto_tallas (producto_id, talla, color, stock) VALUES (?, ?, ?, ?)',
            [
              producto_id,
              variante.talla || '',
              variante.color || '',
              variante.stock || 0
            ]
          );
        }
      }
    }

    // Calcular stock total
    const [stockResult] = await connection.execute(
      'SELECT COALESCE(SUM(stock), 0) as total FROM producto_tallas WHERE producto_id = ?',
      [producto_id]
    );

    const stock_total = stockResult[0].total;

    // Actualizar stock total del producto
    await connection.execute(
      'UPDATE productos SET stock_total = ? WHERE id = ?',
      [stock_total, producto_id]
    );

    await connection.commit();

    // Obtener el producto creado con sus variantes
    const [newProduct] = await connection.execute(
      `SELECT p.*, c.nombre as categoria_nombre
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.id = ?`,
      [producto_id]
    );

    const [newVariantes] = await connection.execute(
      'SELECT * FROM producto_tallas WHERE producto_id = ?',
      [producto_id]
    );

    newProduct[0].variantes = newVariantes;

    res.status(201).json({
      message: 'Producto creado exitosamente',
      producto: newProduct[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error al crear producto:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Código duplicado',
        message: 'El código de barras o SKU ya existe' 
      });
    }
    
    res.status(500).json({ 
      error: 'Error al crear producto',
      message: error.message 
    });
  } finally {
    connection.release();
  }
};

// Actualizar producto
export const updateProduct = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { tienda_id } = req.user;
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      marca,
      modelo,
      categoria_id,
      precio_compra,
      precio_venta,
      codigo_barras,
      sku,
      imagen_url,
      variantes
    } = req.body;

    // Verificar que el producto pertenece a la tienda
    const [existing] = await connection.execute(
      'SELECT id FROM productos WHERE id = ? AND tienda_id = ?',
      [id, tienda_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await connection.beginTransaction();

    // Actualizar producto
    await connection.execute(
      `UPDATE productos SET
        categoria_id = ?, nombre = ?, descripcion = ?, marca = ?, modelo = ?,
        precio_compra = ?, precio_venta = ?, codigo_barras = ?, sku = ?, imagen_url = ?
       WHERE id = ? AND tienda_id = ?`,
      [
        categoria_id || null,
        nombre,
        descripcion || null,
        marca || null,
        modelo || null,
        precio_compra || 0,
        precio_venta,
        codigo_barras || null,
        sku || null,
        imagen_url || null,
        id,
        tienda_id
      ]
    );

    // Eliminar variantes anteriores
    await connection.execute(
      'DELETE FROM producto_tallas WHERE producto_id = ?',
      [id]
    );

    // Insertar nuevas variantes
    if (variantes && Array.isArray(variantes) && variantes.length > 0) {
      for (const variante of variantes) {
        if (variante.talla || variante.color) {
          await connection.execute(
            'INSERT INTO producto_tallas (producto_id, talla, color, stock) VALUES (?, ?, ?, ?)',
            [
              id,
              variante.talla || '',
              variante.color || '',
              variante.stock || 0
            ]
          );
        }
      }
    }

    // Recalcular stock total
    const [stockResult] = await connection.execute(
      'SELECT COALESCE(SUM(stock), 0) as total FROM producto_tallas WHERE producto_id = ?',
      [id]
    );

    const stock_total = stockResult[0].total;

    await connection.execute(
      'UPDATE productos SET stock_total = ? WHERE id = ?',
      [stock_total, id]
    );

    await connection.commit();

    // Obtener producto actualizado
    const [updatedProduct] = await connection.execute(
      `SELECT p.*, c.nombre as categoria_nombre
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    const [updatedVariantes] = await connection.execute(
      'SELECT * FROM producto_tallas WHERE producto_id = ?',
      [id]
    );

    updatedProduct[0].variantes = updatedVariantes;

    res.json({
      message: 'Producto actualizado exitosamente',
      producto: updatedProduct[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar producto:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Código duplicado',
        message: 'El código de barras o SKU ya existe' 
      });
    }
    
    res.status(500).json({ 
      error: 'Error al actualizar producto',
      message: error.message 
    });
  } finally {
    connection.release();
  }
};

// Eliminar producto
export const deleteProduct = async (req, res) => {
  try {
    const { tienda_id } = req.user;
    const { id } = req.params;

    // Verificar que el producto pertenece a la tienda
    const [existing] = await pool.execute(
      'SELECT id FROM productos WHERE id = ? AND tienda_id = ?',
      [id, tienda_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Eliminar producto (las variantes se eliminan por CASCADE)
    await pool.execute(
      'DELETE FROM productos WHERE id = ? AND tienda_id = ?',
      [id, tienda_id]
    );

    res.json({ message: 'Producto eliminado exitosamente' });

  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ 
      error: 'Error al eliminar producto',
      message: error.message 
    });
  }
};
