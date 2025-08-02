
'use server';
/**
 * This is the main entry point for all Firebase Functions.
 * It should only export the functions that need to be deployed.
 */

// Import and export the Next.js server function for Firebase Hosting.
import { nextServer } from './next';
export { nextServer };

// Import and export all other callable functions.
import * as api from './api';
export const { 
    submitnewloanapplication,
    scheduleemipayments,
    recordemipayment,
    setadminclaim,
    createuserauthandprofile,
    deleteuserauthandprofile,
    getdailycollectionreportdata,
    updateuserpermissions,
    editemipayment,
    deleteemipayment
} = api;

// Import and export background triggers.
import { onUserDeleted as onUserDeletedTrigger } from './triggers';
export const onuserdeleted = onUserDeletedTrigger;
