import * as admin from 'firebase-admin';
import { config } from './config';

const firebaseAdminConfig = {
  projectId: config.firebase.projectId,
  clientEmail: config.firebase.clientEmail,
  privateKey: config.firebase.privateKey.replace(/\\n/g, '\n'),
};

export const initializeFirebaseAdmin = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseAdminConfig),
    });
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
