// =============================================
// SCRIPT PARA EJECUTAR SQL EN SUPABASE
// =============================================
// Ejecutar con: node scripts/setup-db.js
// Este script conecta directamente a PostgreSQL y crea el schema.

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de conexión a Supabase PostgreSQL
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
if (!DB_PASSWORD) {
  console.error('Error: SUPABASE_DB_PASSWORD no está definido.');
  console.error('Ejecuta: $env:SUPABASE_DB_PASSWORD="tu_contraseña"');
  process.exit(1);
}

const pool = new Pool({
  connectionString: `postgresql://postgres:${DB_PASSWORD}@db.uarjzimujqwflmgytohf.supabase.co:5432/postgres`,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Conectado a Supabase PostgreSQL...');
    
    // Leer y ejecutar schema.sql
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Ejecutando schema.sql...');
    await client.query(schema);
    console.log('Schema creado exitosamente.');
    
    // Leer y ejecutar seed.sql
    const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');
    const seed = fs.readFileSync(seedPath, 'utf8');
    
    console.log('Ejecutando seed.sql...');
    await client.query(seed);
    console.log('Datos iniciales insertados exitosamente.');
    
    // Verificar tablas
    console.log('\nVerificando tablas creadas...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\nTablas creadas:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Detalles:', error.detail || 'No hay detalles adicionales');
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
