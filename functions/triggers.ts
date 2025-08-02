
'use server';

import { onUserDeleted } from 'firebase-functions/v2/auth';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Background trigger that fires when a user is deleted from Firebase Authentication.
 */
export const onUserDeletedTrigger = onUserDeleted(async (event) => {
    const { uid } = event.data;
    const userProfileRef = db.collection('users').doc(uid);
    try {
        await userProfileRef.delete();
        console.log(`Successfully deleted Firestore profile for user: ${uid}`);
    } catch (error) {
        console.error(`Error deleting Firestore profile for user ${uid}:`, error);
    }
});
