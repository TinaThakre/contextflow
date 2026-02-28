// Database Setup Script - Initialize AWS RDS PostgreSQL

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

async function setupDatabase() {
  console.log('🚀 Setting up Voice DNA database...\n');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
    console.log('\nPlease set your AWS RDS connection string in .env:');
    console.log('DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/voicedna\n');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Test connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');

    // Read schema file
    console.log('📄 Reading schema file...');
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    console.log('✅ Schema file loaded\n');

    // Execute schema
    console.log('🔨 Creating tables...');
    await pool.query(schema);
    console.log('✅ All tables created successfully!\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📊 Created tables:');
    result.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n✨ Database setup complete!\n');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
