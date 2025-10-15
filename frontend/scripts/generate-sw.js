import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read template
const templatePath = path.join(__dirname, '../public/firebase-messaging-sw-template.js');
const template = fs.readFileSync(templatePath, 'utf8');

// Replace placeholders with environment variables
const replacements = {
  '__VITE_FIREBASE_API_KEY__': process.env.VITE_FIREBASE_API_KEY || '',
  '__VITE_FIREBASE_AUTH_DOMAIN__': process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  '__VITE_FIREBASE_PROJECT_ID__': process.env.VITE_FIREBASE_PROJECT_ID || '',
  '__VITE_FIREBASE_STORAGE_BUCKET__': process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  '__VITE_FIREBASE_MESSAGING_SENDER_ID__': process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  '__VITE_FIREBASE_APP_ID__': process.env.VITE_FIREBASE_APP_ID || '',
};

let content = template;
for (const [key, value] of Object.entries(replacements)) {
  content = content.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
}

// Write to public directory
const outputPath = path.join(__dirname, '../public/firebase-messaging-sw.js');
fs.writeFileSync(outputPath, content);

console.log('✅ Service worker generated successfully');
console.log('Environment variables found:', Object.keys(replacements).filter(key => {
  const envKey = key.replace(/__/g, '').replace(/VITE_/, 'VITE_');
  return process.env[envKey] && process.env[envKey].length > 0;
}));

// Verify the generated file has non-empty values
const generatedContent = fs.readFileSync(outputPath, 'utf8');
const hasEmptyValues = generatedContent.includes("apiKey: '',") || generatedContent.includes("projectId: '',");
if (hasEmptyValues) {
  console.warn('⚠️  Warning: Generated service worker still has empty Firebase config values');
  console.log('Make sure your .env file is in the frontend directory and contains VITE_FIREBASE_* variables');
}