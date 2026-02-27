import * as admin from 'firebase-admin';
import { config } from './config';

const firebaseAdminConfig = {
  projectId: config.firebase.projectId,
  clientEmail: config.firebase.clientEmail,
  privateKey: config.firebase.privateKey.replace(/\\n/g, '\n'),
};

export const initializeFirebaseAdmin = () => {
  if (!admin.apps.length) {
    // Validate required credentials
    if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
      console.error('Firebase Admin credentials missing:', {
        projectId: !!firebaseAdminConfig.projectId,
        clientEmail: !!firebaseAdminConfig.clientEmail,
        privateKey: !!firebaseAdminConfig.privateKey,
      });
      throw new Error('Firebase Admin credentials are not properly configured');
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseAdminConfig),
      });
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
      throw error;
    }
  }
  return admin;
};

export const getAuth = () => {
  const firebaseAdmin = initializeFirebaseAdmin();
  return firebaseAdmin.auth();
};

export const getFirestore = () => {
  const firebaseAdmin = initializeFirebaseAdmin();
  return firebaseAdmin.firestore();
};
