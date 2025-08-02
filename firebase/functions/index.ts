

'use server';

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onUserDeleted } from 'firebase-functions/v2/auth';
import * as admin from 'firebase-admin';
import { addDays, addWeeks, addMonths, startOfDay } from 'date-fns';
import Decimal from 'decimal.js';
import { generateDailyCollectionReport } from './lib/report-logic';


// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// --- Next.js Hosting Function ---
// This will be handled by a separate setup. We no longer export it from here
// to avoid conflicts with function deployments.

// Interface for the data expected by the Cloud Function from the frontend
interface NewLoanApplicationPayload {
  customerName: string;
  customerNameHindi?: string;
  dateOfBirth: string;
  gender: string;
  fatherName: string;
  fatherNameHindi?: string;
  motherName: string;
  motherNameHindi?: string;
  husbandWifeName?: string;
  husbandWifeNameHindi?: string;
  mobileNumber: string;
  alternateMobileNumber?: string;
  
  residentialAddress: string;
  residentialAddressHindi?: string;
  city: string;
  cityHindi?: string;
  state: string;
  stateHindi?: string;
  pincode: string;
  pincodeHindi?: string;

  permanentAddress: string;
  permanentAddressHindi?: string;
  companyShopName: string;
  companyShopAddress: string;

  identityDocumentType: string;
  identityDocumentNumber: string; 
  identityDocumentFileUrl?: string;

  addressProofDocumentType: string;
  addressProofDocumentNumber: string; 
  addressProofDocumentFileUrl?: string;

  customerPhotoUrl?: string;

  guarantorName: string;
  guarantorMobileNumber: string;
  guarantorAddress: string;
  guarantorDocumentType: string;
  guarantorDocumentNumber: string;
  guarantorDocumentFileUrl?: string;

  annualIncome: string;
  monthlyIncome: string;
  loanAmountRequired: string;
  repaymentType: 'Daily' | 'Weekly' | 'Monthly';
  tenurePeriod: string;
  loanScheme: string;
  securityForLoan?: string;

  assignedBranchCode?: string;
  assignedSubBranchCode?: string;

  interestRate?: string;
  processingFee?: string;
  loanType?: string;
  lateFine?: string;
}

// Data structure to be stored in Firestore, extending the payload
interface FirestoreLoanApplicationData extends NewLoanApplicationPayload {
  id: string; // The Firestore document ID
  applicationId: string;
  submittedByUid: string; // Added to track who submitted
  submissionTimestamp: admin.firestore.FieldValue;
  lastUpdatedTimestamp: admin.firestore.FieldValue;
  status: 'Pending' | 'Approved' | 'Rejected' | 'VerificationRequired' | 'PaidInFull';
  loanAmountApproved?: string;
  actualInterestRate?: string;
  actualProcessingFee?: string;
  dailyEMI?: string;
  weeklyEMI?: string;
  monthlyEMI?: string;
  adminRemarks?: string;
  isVerified?: boolean;
  verifiedBy?: string;
  verificationTimestamp?: admin.firestore.Timestamp;
  approvedBy?: string;
  approvalDate?: admin.firestore.Timestamp;
  rejectedBy?: string;
  rejectionDate?: admin.firestore.Timestamp;
  autoFine?: boolean;
  finePerMissedPayment?: string;
  totalAmountPaid?: number; // Added to track payments
}

interface EmiPaymentPayload {
    loanApplicationId: string;
    amount: number;
    fine?: number; // Optional fine
    paymentMode: 'Cash' | 'Online' | 'Cheque';
    collectionDate: string; // ISO string date
    remarks?: string;
}

interface EditEmiPaymentPayload extends EmiPaymentPayload {
    paymentId: string;
}


interface ApprovedLoanForReport {
    id: string;
    approvalDate?: admin.firestore.Timestamp;
    repaymentType: 'Daily' | 'Weekly' | 'Monthly';
    dailyEMI?: string;
    weeklyEMI?: string;
    monthlyEMI?: string;
    tenurePeriod?: string;
}


const validatePayload = (data: any): { isValid: boolean, errors: string[] } => {
  const errors: string[] = [];
  const requiredFields: (keyof NewLoanApplicationPayload)[] = [
    'customerName', 'dateOfBirth', 'gender', 'fatherName', 'motherName',
    'mobileNumber', 'residentialAddress', 'city', 'state', 'pincode', 'permanentAddress', 'companyShopName',
    'companyShopAddress', 'identityDocumentType', 'identityDocumentNumber',
    'addressProofDocumentType', 'addressProofDocumentNumber', 'guarantorName',
    'guarantorMobileNumber', 'guarantorAddress', 'guarantorDocumentType',
    'guarantorDocumentNumber', 'annualIncome', 'monthlyIncome', 'loanAmountRequired',
    'repaymentType', 'tenurePeriod', 'loanScheme'
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (data.mobileNumber && !/^\d{10,}$/.test(data.mobileNumber)) {
    errors.push('Invalid mobile number format.');
  }
  if (data.loanAmountRequired && isNaN(parseFloat(data.loanAmountRequired))) {
    errors.push('Loan amount required must be a number.');
  }

  return { isValid: errors.length === 0, errors };
};


export const submitnewloanapplication = onCall(async (request) => {
  // CRITICAL: Ensure the user is authenticated before proceeding.
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const payload = request.data as NewLoanApplicationPayload;

  const { isValid, errors: validationErrors } = validatePayload(payload);
  if (!isValid) {
    throw new HttpsError(
      'invalid-argument',
      'Invalid application data.',
      { details: validationErrors }
    );
  }

  try {
    const newApplicationRef = db.collection('loanApplications').doc();
    const submitterUid = request.auth.uid; // Get UID from authenticated context

    const applicationToStore: FirestoreLoanApplicationData = {
      ...payload,
      id: newApplicationRef.id,
      applicationId: newApplicationRef.id,
      submittedByUid: submitterUid, // Securely stamp the application with the user's UID
      submissionTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdatedTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'Pending',
      isVerified: false,
      loanAmountApproved: payload.loanAmountRequired,
      actualInterestRate: payload.interestRate,
      actualProcessingFee: payload.processingFee,
      totalAmountPaid: 0,
    };

    await newApplicationRef.set(applicationToStore);

    console.log('Loan application submitted successfully by UID:', submitterUid, '. Document ID:', newApplicationRef.id);
    const resultDataForClient = { ...applicationToStore, submissionTimestamp: new Date().toISOString(), lastUpdatedTimestamp: new Date().toISOString() };

    return {
      success: true,
      message: 'Loan application submitted successfully.',
      applicationId: newApplicationRef.id,
      data: resultDataForClient
    };

  } catch (error: any) {
    console.error('Error submitting loan application:', error);
    throw new HttpsError(
      'internal',
      'An error occurred while submitting the loan application.',
      { message: error.message }
    );
  }
});

/**
 * [NEW] Generates the full EMI schedule for a loan upon approval.
 */
export const scheduleemipayments = onCall(async (request) => {
    if (!request.auth || request.auth.token.isAdmin !== true) {
        throw new HttpsError('permission-denied', 'Only administrators can schedule payments.');
    }
    const { loanId } = request.data;
    if (!loanId) {
        throw new HttpsError('invalid-argument', 'loanId is required.');
    }

    try {
        const loanRef = db.collection('loanApplications').doc(loanId);
        const loanDoc = await loanRef.get();
        if (!loanDoc.exists) {
            throw new HttpsError('not-found', 'Loan application not found.');
        }
        const loanData = loanDoc.data() as FirestoreLoanApplicationData;
        
        const { approvalDate, tenurePeriod, repaymentType, dailyEMI, weeklyEMI, monthlyEMI } = loanData;
        const approvalDateObj = (approvalDate as admin.firestore.Timestamp)?.toDate();

        if (loanData.status !== 'Approved' || !approvalDateObj || !tenurePeriod || !repaymentType) {
            throw new HttpsError('failed-precondition', 'Loan is not in a valid state for scheduling (missing approval date, tenure, or repayment type).');
        }
        
        const scheduleBatch = db.batch();
        const scheduleCollection = loanRef.collection('scheduledPayments');
        const startDate = startOfDay(approvalDateObj);
        const tenure = parseInt(tenurePeriod, 10);
        let emiAmount = 0;

        if (repaymentType === 'Daily' && dailyEMI) emiAmount = parseFloat(dailyEMI);
        else if (repaymentType === 'Weekly' && weeklyEMI) emiAmount = parseFloat(weeklyEMI);
        else if (repaymentType === 'Monthly' && monthlyEMI) emiAmount = parseFloat(monthlyEMI);
        
        if (isNaN(tenure) || tenure <= 0 || isNaN(emiAmount) || emiAmount <= 0) {
            throw new HttpsError('failed-precondition', `Invalid tenure ('${tenurePeriod}') or EMI amount for scheduling.`);
        }
        
        for (let i = 0; i < tenure; i++) {
            let dueDate: Date;
            if (repaymentType === 'Daily') dueDate = addDays(startDate, i + 1);
            else if (repaymentType === 'Weekly') dueDate = addWeeks(startDate, i + 1);
            else dueDate = addMonths(startDate, i + 1);
            
            const scheduleDocRef = scheduleCollection.doc();
            scheduleBatch.set(scheduleDocRef, {
                dueDate: admin.firestore.Timestamp.fromDate(dueDate),
                expectedAmount: emiAmount,
                status: 'Pending', // 'Pending', 'Paid', 'Missed'
                paymentId: null // Link to actual payment doc when paid
            });
        }

        await scheduleBatch.commit();
        console.log(`Successfully created ${tenure} scheduled payments for loan ${loanId}.`);
        return { success: true, message: 'EMI schedule created successfully.' };

    } catch (error: any) {
        console.error(`Error scheduling payments for loan ${loanId}:`, error);
        throw new HttpsError('internal', error.message || 'An unexpected error occurred during scheduling.');
    }
});


/**
 * Records an EMI payment and updates the corresponding scheduled payment.
 */
export const recordemipayment = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated','You must be logged in to record a payment.');
    }
    
    const data = request.data as EmiPaymentPayload;
    const collectorUid = request.auth.uid;

    const { loanApplicationId, amount, paymentMode, collectionDate } = data;
    if (!loanApplicationId || !amount || !paymentMode || !collectionDate) {
        throw new HttpsError('invalid-argument','Missing required payment details.');
    }

    const loanRef = db.collection('loanApplications').doc(loanApplicationId);
    const paymentRef = loanRef.collection('payments').doc();
    const scheduleCollection = loanRef.collection('scheduledPayments');

    try {
        let updatedLoanData: FirestoreLoanApplicationData | null = null;
        await db.runTransaction(async (transaction) => {
            const loanDoc = await transaction.get(loanRef);
            if (!loanDoc.exists) throw new Error('Loan application not found.');
            const loanData = loanDoc.data() as FirestoreLoanApplicationData;
            if (loanData.status !== 'Approved') throw new Error(`Cannot record payment for a loan with status: ${loanData.status}`);
            
            // Find the next pending scheduled payment to mark as paid.
            const pendingScheduleQuery = scheduleCollection.where('status', '==', 'Pending').orderBy('dueDate').limit(1);
            const pendingScheduleSnapshot = await transaction.get(pendingScheduleQuery);

            const paymentRecord = {
                paymentId: paymentRef.id,
                amountPaid: amount,
                fine: data.fine || 0,
                paymentMode: paymentMode,
                collectionDate: new Date(collectionDate),
                remarks: data.remarks || '',
                collectedByUid: collectorUid,
                collectionTimestamp: admin.firestore.FieldValue.serverTimestamp(),
            };
            transaction.set(paymentRef, paymentRecord);

            if (!pendingScheduleSnapshot.empty) {
                const scheduleDocToUpdate = pendingScheduleSnapshot.docs[0];
                transaction.update(scheduleDocToUpdate.ref, {
                    status: 'Paid',
                    actualPaymentId: paymentRef.id,
                    amountPaid: amount,
                    paidOn: new Date(collectionDate),
                });
            } else {
                console.warn(`No pending scheduled payment found for loan ${loanApplicationId}. Recording as overpayment.`);
            }

            const newTotalPaid = new Decimal(loanData.totalAmountPaid || 0).plus(new Decimal(amount)).plus(new Decimal(data.fine || 0));
            const updatePayload = {
                totalAmountPaid: newTotalPaid.toNumber(),
                lastUpdatedTimestamp: admin.firestore.FieldValue.serverTimestamp()
            };
            transaction.update(loanRef, updatePayload);
            
            updatedLoanData = { ...loanData, ...updatePayload, lastUpdatedTimestamp: admin.firestore.Timestamp.now() };
        });

        console.log(`Payment recorded for loan ${loanApplicationId}`);
        return { 
            success: true, 
            message: 'Payment recorded successfully.', 
            paymentId: paymentRef.id,
            updatedLoan: updatedLoanData,
        };

    } catch (error: any) {
        console.error(`Error recording payment for loan ${loanApplicationId}:`, error);
        throw new HttpsError('internal', error.message || 'An error occurred while recording the payment.');
    }
});


/**
 * Callable Cloud Function to set or revoke a user's admin status.
 */
export const setadminclaim = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const callerRecord = await admin.auth().getUser(request.auth.uid);
  const isCallerAdmin = request.auth.token.isAdmin === true;
  const isSuperAdminEmail = callerRecord.email === 'admin@shagunam.com';

  if (!isCallerAdmin && !isSuperAdminEmail) {
    throw new HttpsError('permission-denied', 'Only administrators can set admin claims.');
  }

  const { targetUid, makeAdmin } = request.data;
  if (!targetUid || typeof makeAdmin !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Bad request. Provide targetUid and makeAdmin.');
  }
  
  if (request.auth.uid === targetUid && !isSuperAdminEmail) {
      throw new HttpsError('permission-denied', "Admins cannot change their own admin status.");
  }

  try {
    await admin.auth().setCustomUserClaims(targetUid, { isAdmin: makeAdmin });
    const targetUserRecord = await admin.auth().getUser(targetUid);
    const userProfileRef = db.collection('users').doc(targetUid);
    
    await userProfileRef.set({
        id: targetUid,
        email: targetUserRecord.email,
        fullName: targetUserRecord.displayName || targetUserRecord.email?.split('@')[0] || 'Administrator',
        role: 'Administrator',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    await admin.auth().revokeRefreshTokens(targetUid);
    
    return { success: true, message: `Admin status for user ${targetUid} has been set to ${makeAdmin}.` };
  } catch (error: any) {
    console.error(`Error setting admin claim for ${targetUid}:`, error);
    if (error.code === 'auth/internal-error' && error.message.includes('IAM')) {
      throw new HttpsError('permission-denied','Service account is missing IAM role.');
    }
    throw new HttpsError('internal', 'An unknown error occurred.');
  }
});


/**
 * Callable Cloud Function to securely create a user.
 */
export const createuserauthandprofile = onCall(async (request) => {
  if (!request.auth || request.auth.token.isAdmin !== true) {
    throw new HttpsError('permission-denied','Only administrators can create users.');
  }

  const { email, password, displayName, firestoreProfileData } = request.data;
  const { role, mobileNumber } = firestoreProfileData || {};

  if (!email || !password || !role || !mobileNumber) {
    throw new HttpsError('invalid-argument', 'Missing required user data.');
  }

  let userRecord: admin.auth.UserRecord | null = null;
  try {
    userRecord = await admin.auth().createUser({ email, emailVerified: true, password, displayName });
    
    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email: userRecord.email,
      fullName: displayName,
      role: role,
      mobileNumber: mobileNumber,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      initialPassword: password,
    });

    return { success: true, uid: userRecord.uid, email: userRecord.email };
  } catch (error: any) {
    if (userRecord) await admin.auth().deleteUser(userRecord.uid);
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', `The email address ${email} is already in use.`);
    }
    throw new HttpsError('internal', 'An error occurred while creating the user.');
  }
});


/**
 * Callable Cloud Function to securely delete a user.
 */
export const deleteuserauthandprofile = onCall(async (request) => {
  if (!request.auth || request.auth.token.isAdmin !== true) {
    throw new HttpsError('permission-denied', 'Only administrators can delete users.');
  }
  const { targetUid } = request.data;
  if (!targetUid) {
    throw new HttpsError('invalid-argument', 'targetUid is required.');
  }
  if (targetUid === request.auth.uid) {
    throw new HttpsError('permission-denied', 'Administrators cannot delete themselves.');
  }

  try {
    await admin.auth().deleteUser(targetUid);
    return { success: true, message: `User ${targetUid} has been deleted.` };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
        try {
            await db.collection('users').doc(targetUid).delete();
            return { success: true, message: `Orphaned Firestore profile for ${targetUid} was cleaned up.` };
        } catch (dbError) {
            throw new HttpsError('internal', `User not in Auth, and failed to clean up Firestore profile.`);
        }
    }
    throw new HttpsError('internal', error.message || 'Unknown error during deletion.');
  }
});


/**
 * Background trigger that fires when a user is deleted from Firebase Authentication.
 */
exports.onuserdeleted = onUserDeleted(async (event) => {
    const { uid } = event.data;
    const userProfileRef = db.collection('users').doc(uid);
    try {
        await userProfileRef.delete();
        console.log(`Successfully deleted Firestore profile for user: ${uid}`);
    } catch (error) {
        console.error(`Error deleting Firestore profile for user ${uid}:`, error);
    }
});


/**
 * Generates a daily collection report. This is a lean wrapper around the core logic.
 */
export const getdailycollectionreportdata = onCall(async (request) => {
    if (!request.auth || request.auth.token.isAdmin !== true) {
        throw new HttpsError('permission-denied', 'You must be an administrator to access this report.');
    }
    
    const { numberOfDays } = request.data;
    if (typeof numberOfDays !== 'number' || numberOfDays <= 0 || numberOfDays > 90) {
        throw new HttpsError('invalid-argument', 'A valid numberOfDays (1-90) is required.');
    }

    try {
        const reportData = await generateDailyCollectionReport(numberOfDays);
        return { success: true, data: reportData };

    } catch (error: any) {
        console.error("Critical error in getdailycollectionreportdata wrapper:", error);
        throw new HttpsError('internal', 'An unexpected error occurred generating the report.', { details: error.message });
    }
});


/**
 * Callable Cloud Function for an admin to update a user's permissions.
 */
export const updateuserpermissions = onCall(async (request) => {
    if (!request.auth || request.auth.token.isAdmin !== true) {
        throw new HttpsError('permission-denied', 'Only administrators can update user permissions.');
    }
    const { userId, permissions } = request.data;
    if (!userId || !permissions) {
        throw new HttpsError('invalid-argument', 'userId and permissions are required.');
    }

    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (userDoc.exists && userDoc.data()?.role === 'Administrator') {
             throw new HttpsError('permission-denied', 'Administrator permissions cannot be modified.');
        }

        await userRef.update({
            permissions: permissions,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return { success: true, message: 'User permissions updated successfully.' };
    } catch (error: any) {
        throw new HttpsError('internal', error.message || 'An error occurred while updating permissions.');
    }
});


/**
 * Edits an existing EMI payment record.
 */
export const editemipayment = onCall(async (request) => {
    if (!request.auth || request.auth.token.isAdmin !== true) {
        throw new HttpsError('permission-denied', 'Only administrators can edit payments.');
    }

    const data = request.data as EditEmiPaymentPayload;
    const { loanApplicationId, paymentId, amount, fine, paymentMode, collectionDate, remarks } = data;
    if (!loanApplicationId || !paymentId || amount === undefined || !paymentMode || !collectionDate) {
        throw new HttpsError('invalid-argument', 'Missing required fields for editing a payment.');
    }

    const loanRef = db.collection('loanApplications').doc(loanApplicationId);
    const paymentRef = loanRef.collection('payments').doc(paymentId);

    try {
        let updatedLoanData: FirestoreLoanApplicationData | null = null;
        await db.runTransaction(async (transaction) => {
            const loanDoc = await transaction.get(loanRef);
            const paymentDoc = await transaction.get(paymentRef);

            if (!loanDoc.exists) throw new Error('Loan application not found.');
            if (!paymentDoc.exists) throw new Error('Payment record not found.');

            const loanData = loanDoc.data() as FirestoreLoanApplicationData;
            const oldPaymentData = paymentDoc.data() as any;

            const oldTotalPayment = new Decimal(oldPaymentData.amountPaid || '0').plus(new Decimal(oldPaymentData.fine || '0'));
            const newTotalPayment = new Decimal(amount || '0').plus(new Decimal(fine || '0'));
            const finalTotalPaid = new Decimal(loanData.totalAmountPaid || '0').minus(oldTotalPayment).plus(newTotalPayment);

            if (finalTotalPaid.isNaN()) throw new Error("Calculation resulted in NaN.");

            transaction.set(paymentRef, {
                amountPaid: new Decimal(amount).toNumber(),
                fine: new Decimal(fine || '0').toNumber(),
                paymentMode,
                collectionDate: new Date(collectionDate),
                remarks: remarks || '',
                editedAt: admin.firestore.FieldValue.serverTimestamp(),
                editedBy: request.auth?.uid,
            }, { merge: true });

            transaction.update(loanRef, {
                totalAmountPaid: finalTotalPaid.toNumber(),
                lastUpdatedTimestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
            updatedLoanData = { ...loanData, totalAmountPaid: finalTotalPaid.toNumber(), lastUpdatedTimestamp: admin.firestore.Timestamp.now() };
        });

        return { success: true, message: 'Payment edited successfully.', updatedLoan: updatedLoanData };
    } catch (error: any) {
        throw new HttpsError('internal', error.message || 'An error occurred while editing the payment.');
    }
});

/**
 * Deletes an existing EMI payment record.
 */
export const deleteemipayment = onCall(async (request) => {
    if (!request.auth || request.auth.token.isAdmin !== true) {
        throw new HttpsError('permission-denied', 'Only administrators can delete payments.');
    }
    const { loanApplicationId, paymentId } = request.data as { loanApplicationId: string, paymentId: string };
    if (!loanApplicationId || !paymentId) {
        throw new HttpsError('invalid-argument', 'Missing loanApplicationId or paymentId.');
    }

    const loanRef = db.collection('loanApplications').doc(loanApplicationId);
    const paymentRef = loanRef.collection('payments').doc(paymentId);

    try {
        let updatedLoanData: FirestoreLoanApplicationData | null = null;
        await db.runTransaction(async (transaction) => {
            const loanDoc = await transaction.get(loanRef);
            const paymentDoc = await transaction.get(paymentRef);

            if (!loanDoc.exists) throw new Error('Loan application not found.');
            if (!paymentDoc.exists) {
                updatedLoanData = loanDoc.data() as FirestoreLoanApplicationData;
                return; 
            }

            const loanData = loanDoc.data() as FirestoreLoanApplicationData;
            const paymentData = paymentDoc.data() as any;
            
            const totalPaymentToReverse = new Decimal(paymentData.amountPaid || '0').plus(new Decimal(paymentData.fine || '0'));
            const newTotalPaid = new Decimal(loanData.totalAmountPaid || 0).minus(totalPaymentToReverse);

            if (newTotalPaid.isNaN()) throw new Error("Calculation for deletion resulted in NaN.");

            transaction.delete(paymentRef);
            
            transaction.update(loanRef, {
                totalAmountPaid: newTotalPaid.toNumber(),
                lastUpdatedTimestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
            updatedLoanData = { ...loanData, totalAmountPaid: newTotalPaid.toNumber(), lastUpdatedTimestamp: admin.firestore.Timestamp.now() };
        });

        return { success: true, message: 'Payment deleted successfully.', updatedLoan: updatedLoanData };
    } catch (error: any) {
        throw new HttpsError('internal', error.message || 'An error occurred while deleting the payment.');
    }
});
