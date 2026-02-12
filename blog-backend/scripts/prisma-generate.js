// Helper script to run prisma generate with a fallback DATABASE_URL
// This is needed because prisma generate validates env("DATABASE_URL") from schema.prisma
// even though it doesn't actually connect to the database during generation.
const { execSync } = require('child_process');

if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
}

execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
