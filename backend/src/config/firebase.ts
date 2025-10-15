import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
const firebaseConfig = {
  projectId: process.env['FIREBASE_PROJECT_ID'] || '',
  privateKey: process.env['FIREBASE_PRIVATE_KEY']?.replace(/\\n/g, '\n') || '',
  clientEmail: process.env['FIREBASE_CLIENT_EMAIL'] || '',
};

// Check if Firebase app is already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: firebaseConfig.projectId,
      privateKey: firebaseConfig.privateKey,
      clientEmail: firebaseConfig.clientEmail,
    } as admin.ServiceAccount),
  });
  console.log('🔥 Firebase Admin SDK initialized');
} else {
  console.log('🔥 Firebase Admin SDK already initialized');
}

export const messaging = admin.messaging();
export const firebaseAdmin = admin;

