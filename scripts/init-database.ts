/**
 * Initialize Database Schema
 *
 * This script creates all necessary tables for the Voice DNA pipeline.
 * Run this once to set up the PostgreSQL database.
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Remove sslmode=require from connection string (we'll handle SSL separately)
connectionString = connectionString.replace('?sslmode=require', '');

console.log('📌 Using database:', connectionString.split('@')[1]?.split(':')[0]);

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined,
  },
});

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔄 Connecting to database...');

    // Test connection
    const result = await client.query('SELECT NOW()');
    console.log('✅ Connected to database');

    // Read schema file
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('🔄 Creating tables...');

    // Split schema into individual statements and execute
    const statements = schema
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      try {
        await client.query(statement);
        console.log('✓', statement.substring(0, 50) + '...');
      } catch (error: any) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists')) {
          console.error('❌ Error:', error.message);
          throw error;
        }
        console.log('↳ (already exists)');
      }
    }

    console.log('\n✅ Database schema initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initializeDatabase();
