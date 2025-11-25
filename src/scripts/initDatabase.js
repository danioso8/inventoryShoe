import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initDatabase() {
  let connection;
  
  try {
    console.log('🔌 Conectando a MySQL...');
    
    // Crear conexión
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || process.env.MYSQLHOST,
      port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
      user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
      password: process.env.MYSQL_ROOT_PASSWORD || process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
      database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'railway',
      multipleStatements: true
    });

    console.log('✅ Conectado a MySQL');

    // Leer el archivo SQL
    const sqlFilePath = join(__dirname, '../../init-database.sql');
    console.log('📄 Leyendo archivo SQL:', sqlFilePath);
    
    const sql = readFileSync(sqlFilePath, 'utf8');
    
    console.log('🚀 Ejecutando script SQL...');
    console.log('=' .repeat(50));

    // Ejecutar el SQL
    await connection.query(sql);

    console.log('=' .repeat(50));
    console.log('✅ ¡Base de datos inicializada correctamente!');
    console.log('');
    console.log('Tablas creadas:');
    console.log('  ✓ tiendas');
    console.log('  ✓ usuarios');
    console.log('  ✓ usuarios_tiendas');
    console.log('  ✓ categorias');
    console.log('  ✓ productos');
    console.log('  ✓ producto_tallas');
    console.log('  ✓ clientes');
    console.log('  ✓ facturas');
    console.log('  ✓ factura_items');
    console.log('  ✓ movimientos_inventario');
    console.log('  ✓ suscripciones');
    console.log('  ✓ pagos');
    console.log('  ✓ limites_planes');
    console.log('');
    console.log('✓ Límites de planes insertados');
    console.log('');

    // Verificar que las tablas se crearon
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`📊 Total de tablas en la base de datos: ${tables.length}`);
    
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:');
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
initDatabase();
