"use strict";
/**
 * Firebase Cloud Functions to handle loan application submissions and admin claims.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmiPayment = exports.editEmiPayment = exports.updateUserPermissions = exports.getDailyCollectionReportData = exports.onUserDeleted = exports.deleteUserAuthAndProfile = exports.createUserAuthAndProfile = exports.setAdminClaim = exports.recordEmiPayment = exports.submitNewLoanApplication = exports.nextServer = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const date_fns_1 = require("date-fns");
const decimal_js_1 = __importDefault(require("decimal.js"));
// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
// --- Next.js Hosting Function ---
// All requests to the hosting domain will be handled by this function.
// It's defined in a separate file for clarity.
var next_1 = require("./next");
Object.defineProperty(exports, "nextServer", { enumerable: true, get: function () { return next_1.nextServer; } });
const validatePayload = (data) => {
    const errors = [];
    const requiredFields = [
        'customerName', 'dateOfBirth', 'gender', 'fatherName', 'motherName',
        'mobileNumber', 'residentialAddress', 'permanentAddress', 'companyShopName',
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
exports.submitNewLoanApplication = functions.https.onCall(async (data, context) => {
    // CRITICAL: Ensure the user is authenticated before proceeding.
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const payload = data;
    const { isValid, errors: validationErrors } = validatePayload(payload);
    if (!isValid) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid application data.', { details: validationErrors });
    }
    try {
        const newApplicationRef = db.collection('loanApplications').doc();
        const submitterUid = context.auth.uid; // Get UID from authenticated context
        const applicationToStore = Object.assign(Object.assign({}, payload), { id: newApplicationRef.id, applicationId: newApplicationRef.id, submittedByUid: submitterUid, submissionTimestamp: admin.firestore.FieldValue.serverTimestamp(), lastUpdatedTimestamp: admin.firestore.FieldValue.serverTimestamp(), status: 'Pending', isVerified: false, loanAmountApproved: payload.loanAmountRequired, actualInterestRate: payload.interestRate, actualProcessingFee: payload.processingFee, totalAmountPaid: 0 });
        await newApplicationRef.set(applicationToStore);
        console.log('Loan application submitted successfully by UID:', submitterUid, '. Document ID:', newApplicationRef.id);
        const resultDataForClient = Object.assign(Object.assign({}, applicationToStore), { submissionTimestamp: new Date().toISOString(), lastUpdatedTimestamp: new Date().toISOString() });
        return {
            success: true,
            message: 'Loan application submitted successfully.',
            applicationId: newApplicationRef.id,
            data: resultDataForClient
        };
    }
    catch (error) {
        console.error('Error submitting loan application:', error);
        throw new functions.https.HttpsError('internal', 'An error occurred while submitting the loan application.', { message: error.message });
    }
});
/**
 * Records an EMI payment against a loan application. This is a transactional function.
 */
exports.recordEmiPayment = functions.https.onCall(async (data, context) => {
    // 1. Authentication: Ensure caller is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to record a payment.');
    }
    // Authorization: Allow any authenticated user to record a payment.
    const collectorUid = context.auth.uid;
    // 3. Input Validation: Check for required fields and valid values
    const { loanApplicationId, amount, paymentMode, collectionDate } = data;
    if (!loanApplicationId || !amount || !paymentMode || !collectionDate) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required payment details (loanApplicationId, amount, paymentMode, collectionDate).');
    }
    if (typeof amount !== 'number' || amount <= 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Payment amount must be a positive number.');
    }
    if (isNaN(new Date(collectionDate).getTime())) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid collection date format.');
    }
    const loanRef = db.collection('loanApplications').doc(loanApplicationId);
    const paymentRef = loanRef.collection('payments').doc(); // Auto-generate ID for the payment record
    try {
        let updatedLoanData = null;
        // 4. Firestore Transaction: Perform reads and writes atomically
        await db.runTransaction(async (transaction) => {
            const loanDoc = await transaction.get(loanRef);
            // 4a. Data Integrity Check: Ensure the loan exists and is active
            if (!loanDoc.exists) {
                throw new Error('Loan application not found.');
            }
            const loanData = loanDoc.data();
            if (loanData.status !== 'Approved') {
                throw new Error(`Cannot record payment for a loan with status: ${loanData.status}`);
            }
            const fineAmount = data.fine || 0;
            const totalPayment = amount + fineAmount;
            const currentTotalPaid = loanData.totalAmountPaid || 0;
            const newTotalPaid = currentTotalPaid + totalPayment;
            // 4b. Create Payment Record
            const paymentRecord = {
                paymentId: paymentRef.id,
                amountPaid: amount,
                fine: fineAmount,
                paymentMode: paymentMode,
                collectionDate: new Date(collectionDate),
                remarks: data.remarks || '',
                collectedByUid: collectorUid,
                collectionTimestamp: admin.firestore.FieldValue.serverTimestamp(),
            };
            transaction.set(paymentRef, paymentRecord);
            // 4c. Update Loan Document
            const updatePayload = {
                totalAmountPaid: newTotalPaid,
                lastUpdatedTimestamp: admin.firestore.FieldValue.serverTimestamp()
            };
            transaction.update(loanRef, updatePayload);
            // Prepare the updated data to return to the client
            updatedLoanData = Object.assign(Object.assign(Object.assign({}, loanData), updatePayload), { lastUpdatedTimestamp: admin.firestore.Timestamp.now() });
        });
        console.log(`Payment of ${amount} (Fine: ${data.fine || 0}) recorded for loan ${loanApplicationId} by ${collectorUid}`);
        return {
            success: true,
            message: 'Payment recorded successfully.',
            paymentId: paymentRef.id,
            updatedLoan: updatedLoanData, // Return the updated loan data
        };
    }
    catch (error) {
        console.error(`Error recording payment for loan ${loanApplicationId}:`, error);
        // 5. Error Handling: Provide clear error messages back to the client.
        throw new functions.https.HttpsError('internal', error.message || 'An error occurred while recording the payment.', { details: error.toString() });
    }
});
/**
 * Callable Cloud Function to set or revoke a user's admin status.
 * This function now also creates the user profile in Firestore if it doesn't exist,
 * breaking the permission deadlock for the first admin.
 */
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
    var _a;
    // 1. Authenticate the caller
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    // Fetch the full user record from Firebase Auth to reliably get the email
    const callerRecord = await admin.auth().getUser(context.auth.uid);
    // 2. Authorize the caller: Allow existing admins OR the hardcoded super-admin email.
    const callerClaims = context.auth.token;
    const isCallerAdmin = callerClaims.isAdmin === true;
    const isSuperAdminEmail = callerRecord.email === 'admin@shagunam.com';
    if (!isCallerAdmin && !isSuperAdminEmail) {
        throw new functions.https.HttpsError('permission-denied', 'Only administrators can set admin claims.');
    }
    // 3. Validate input data
    const { targetUid, makeAdmin } = data;
    if (!targetUid || typeof makeAdmin !== 'boolean') {
        throw new functions.https.HttpsError('invalid-argument', 'Bad request. Provide targetUid (string) and makeAdmin (boolean).');
    }
    // Prevent other admins from changing their own status.
    if (context.auth.uid === targetUid && !isSuperAdminEmail) {
        throw new functions.https.HttpsError('permission-denied', "For security, admins cannot change their own admin status via this function.");
    }
    try {
        // Set the custom claim for the target user. This is a primary responsibility.
        await admin.auth().setCustomUserClaims(targetUid, { isAdmin: makeAdmin });
        // Now, use the Admin SDK to create/update the user profile in Firestore.
        // This bypasses security rules, breaking the chicken-and-egg deadlock for the first admin.
        const targetUserRecord = await admin.auth().getUser(targetUid);
        const userProfileRef = db.collection('users').doc(targetUid);
        // This data structure ensures the document is complete.
        const profileData = {
            id: targetUid,
            email: targetUserRecord.email,
            fullName: targetUserRecord.displayName || ((_a = targetUserRecord.email) === null || _a === void 0 ? void 0 : _a.split('@')[0]) || 'Administrator',
            role: 'Administrator', // Directly assign the role in the profile
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        // Use { merge: true } to avoid overwriting `createdAt` on subsequent updates.
        await userProfileRef.set(profileData, { merge: true });
        // Force refresh of the target user's ID token. This is crucial.
        await admin.auth().revokeRefreshTokens(targetUid);
        console.log(`Successfully set isAdmin=${makeAdmin} for user: ${targetUid} and updated Firestore profile.`);
        return {
            success: true,
            message: `Admin status for user ${targetUid} has been set to ${makeAdmin}. Please sign out and back in.`
        };
    }
    catch (error) {
        console.error(`Error setting admin claim for ${targetUid}:`, error);
        // Provide a more helpful error for the common IAM issue.
        if (error.code === 'auth/internal-error' && error.message.includes('IAM')) {
            throw new functions.https.HttpsError('permission-denied', 'The service account for Cloud Functions is missing the "Service Account Token Creator" IAM role. Please check your Google Cloud project IAM settings.', { originalCode: error.code });
        }
        // Fallback to a generic internal error
        throw new functions.https.HttpsError('internal', 'An unknown error occurred while setting the admin claim.', { details: { code: error.code, message: error.message } });
    }
});
/**
 * Callable Cloud Function to securely create a user in Firebase Authentication
 * and their corresponding profile in Firestore. This is a transactional operation.
 */
exports.createUserAuthAndProfile = functions.https.onCall(async (data, context) => {
    // 1. Authentication & Authorization Check (Only Admins can create users)
    if (!context.auth || context.auth.token.isAdmin !== true) {
        throw new functions.https.HttpsError('permission-denied', 'Only administrators are authorized to create new user accounts.');
    }
    // 2. Input Validation
    const { email, password, displayName, firestoreProfileData } = data;
    const { role, mobileNumber } = firestoreProfileData || {};
    if (typeof email !== 'string' || !email.includes('@')) {
        throw new functions.https.HttpsError('invalid-argument', 'A valid email address is required.');
    }
    if (!password || password.length < 6) {
        throw new functions.https.HttpsError('invalid-argument', 'A password of at least 6 characters is required.');
    }
    if (!role || !mobileNumber) {
        throw new functions.https.HttpsError('invalid-argument', 'Profile data with a role and mobile number is required.');
    }
    let userRecord = null;
    try {
        const userCreationRequest = {
            email,
            emailVerified: true, // Auto-verify email as it's created by an admin
            password: password,
            displayName: displayName,
        };
        // 3. Create User in Firebase Authentication
        userRecord = await admin.auth().createUser(userCreationRequest);
        // 4. If Auth creation is successful, create the Firestore profile
        const userProfileRef = db.collection('users').doc(userRecord.uid);
        await userProfileRef.set({
            id: userRecord.uid,
            email: userRecord.email,
            fullName: displayName,
            role: role,
            mobileNumber: mobileNumber,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            initialPassword: password,
        });
        console.log(`User created successfully in Auth and Firestore: ${userRecord.uid} (${userRecord.email})`);
        return {
            success: true,
            uid: userRecord.uid,
            email: userRecord.email,
            message: 'User created successfully in Auth and Firestore.'
        };
    }
    catch (error) {
        console.error("Error creating user:", error);
        // 5. Cleanup: If Firestore write fails after Auth creation, delete the Auth user to prevent orphans.
        if (userRecord) {
            console.warn(`Firestore profile creation failed for ${userRecord.uid}. Deleting orphaned Auth user.`);
            await admin.auth().deleteUser(userRecord.uid);
        }
        // 6. Return specific errors to the client
        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', `The email address ${email} is already in use. The user may have been deleted from the UI but not fully from the system. Please try deleting the user again; the system will attempt to clean it up.`, { email: email });
        }
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred while creating the user.', { details: { originalError: error.message } });
    }
});
/**
 * Callable Cloud Function to securely delete a user from both Firebase Authentication
 * and their corresponding Firestore profile. This is the definitive, robust version.
 */
exports.deleteUserAuthAndProfile = functions.https.onCall(async (data, context) => {
    // 1. Authorization: Ensure the caller is an admin
    if (!context.auth || context.auth.token.isAdmin !== true) {
        throw new functions.https.HttpsError('permission-denied', 'Only administrators can delete users.');
    }
    const { targetUid } = data;
    // 2. Validation: Ensure a UID was provided
    if (!targetUid) {
        throw new functions.https.HttpsError('invalid-argument', 'targetUid is required for deletion.');
    }
    // Prevent admin from deleting themselves
    if (targetUid === context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'For security, administrators cannot delete their own account.');
    }
    console.log(`Admin ${context.auth.uid} initiated deletion for user ${targetUid}.`);
    // This function will now ONLY delete the user from Authentication.
    // The `onUserDeleted` trigger below will handle deleting the Firestore profile automatically.
    try {
        await admin.auth().deleteUser(targetUid);
        console.log(`Successfully deleted user ${targetUid} from Firebase Authentication. The 'onDelete' trigger will handle the rest.`);
        return { success: true, message: `User ${targetUid} has been deleted successfully.` };
    }
    catch (error) {
        console.error(`Error deleting user from Auth: ${targetUid}`, error);
        // If the user is not found in Auth, it's possible they are a "ghost" profile in Firestore.
        // The `onUserDeleted` trigger won't run, so we attempt a manual cleanup of the Firestore record here.
        if (error.code === 'auth/user-not-found') {
            console.warn(`Auth user ${targetUid} was not found during deletion. Attempting to clean up orphaned Firestore profile.`);
            try {
                await db.collection('users').doc(targetUid).delete();
                return { success: true, message: `User was not found in Authentication, but orphaned Firestore profile was cleaned up.` };
            }
            catch (dbError) {
                console.error(`Failed to clean up orphaned Firestore user profile ${targetUid}:`, dbError);
                throw new functions.https.HttpsError('internal', `User not found in Auth, and failed to clean up Firestore profile.`, { details: dbError });
            }
        }
        throw new functions.https.HttpsError('internal', error.message || 'An unknown error occurred during Auth deletion.', {
            details: error.toString(),
        });
    }
});
/**
 * Background trigger that fires when a user is deleted from Firebase Authentication.
 * This function automatically deletes the corresponding user profile from Firestore,
 * solving the "ghost user" problem permanently.
 */
exports.onUserDeleted = functions.auth.user().onDelete(async (user) => {
    const { uid } = user;
    console.log(`User deletion detected for UID: ${uid}. Deleting associated Firestore profile.`);
    const userProfileRef = db.collection('users').doc(uid);
    try {
        await userProfileRef.delete();
        console.log(`Successfully deleted Firestore profile for user: ${uid}`);
    }
    catch (error) {
        console.error(`Error deleting Firestore profile for user ${uid}:`, error);
        // We log the error but don't re-throw, as the primary action (Auth user deletion) is already complete.
    }
});
/**
 * Generates a daily collection report for admins. This function runs on the
 * backend to bypass client-side permission issues with complex queries.
 */
exports.getDailyCollectionReportData = functions.https.onCall(async (data, context) => {
    // Authentication Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be authenticated to access this report.');
    }
    const { numberOfDays } = data;
    if (typeof numberOfDays !== 'number' || numberOfDays <= 0 || numberOfDays > 90) { // Safety cap
        throw new functions.https.HttpsError('invalid-argument', 'A valid numberOfDays (1-90) is required.');
    }
    try {
        const loansQuery = db.collection('loanApplications').where('status', '==', 'Approved');
        const loansSnapshot = await loansQuery.get();
        if (loansSnapshot.empty) {
            const emptyReport = [];
            const today = (0, date_fns_1.startOfDay)(new Date());
            for (let i = 0; i < numberOfDays; i++) {
                const targetDate = (0, date_fns_1.subDays)(today, i);
                const dateKey = (0, date_fns_1.format)(targetDate, 'yyyy-MM-dd');
                emptyReport.push({ date: dateKey, collectedToday: 0, expectedToday: 0 });
            }
            return { success: true, data: emptyReport.reverse() };
        }
        const approvedLoans = loansSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        const paymentPromises = approvedLoans.map(loan => db.collection('loanApplications').doc(loan.id).collection('payments').get());
        const paymentSnapshots = await Promise.all(paymentPromises);
        const allPayments = [];
        paymentSnapshots.forEach(snapshot => {
            snapshot.forEach(doc => allPayments.push(doc.data()));
        });
        const reportData = [];
        const today = (0, date_fns_1.startOfDay)(new Date());
        for (let i = 0; i < numberOfDays; i++) {
            const targetDate = (0, date_fns_1.subDays)(today, i);
            const dateKey = (0, date_fns_1.format)(targetDate, 'yyyy-MM-dd');
            let collectedToday = 0;
            let expectedToday = 0;
            allPayments.forEach(payment => {
                if (payment.collectionDate && typeof payment.collectionDate.toDate === 'function') {
                    const paymentDate = payment.collectionDate.toDate();
                    if ((0, date_fns_1.isSameDay)(paymentDate, targetDate)) {
                        collectedToday += (payment.amountPaid || 0) + (payment.fine || 0);
                    }
                }
            });
            approvedLoans.forEach(loan => {
                // Robustness: Ensure approvalDate is a valid timestamp to prevent crashes.
                if (!loan.approvalDate || typeof loan.approvalDate.toDate !== 'function') {
                    return;
                }
                const approvalD = (0, date_fns_1.startOfDay)(loan.approvalDate.toDate());
                // Safety checks for valid dates and ensuring loan was active on the target date.
                if (!(approvalD instanceof Date) || isNaN(approvalD.getTime()) || (0, date_fns_1.isBefore)(targetDate, approvalD)) {
                    return;
                }
                // Check if loan term has ended
                if (loan.tenurePeriod) {
                    const tenure = parseInt(loan.tenurePeriod, 10);
                    if (!isNaN(tenure)) {
                        let loanEndDate;
                        if (loan.repaymentType === 'Daily')
                            loanEndDate = (0, date_fns_1.addDays)(approvalD, tenure);
                        else if (loan.repaymentType === 'Weekly')
                            loanEndDate = (0, date_fns_1.addWeeks)(approvalD, tenure);
                        else if (loan.repaymentType === 'Monthly')
                            loanEndDate = (0, date_fns_1.addMonths)(approvalD, tenure);
                        if (loanEndDate && (0, date_fns_1.isBefore)(loanEndDate, targetDate)) {
                            return; // Loan has finished, no expected payment
                        }
                    }
                }
                const emiValueStr = loan.dailyEMI || loan.weeklyEMI || loan.monthlyEMI || '0';
                const emiValue = parseFloat(emiValueStr);
                // Safety check for valid EMI value
                if (isNaN(emiValue) || emiValue <= 0)
                    return;
                switch (loan.repaymentType) {
                    case 'Daily':
                        expectedToday += emiValue;
                        break;
                    case 'Weekly':
                        // Use date-fns for reliable day difference calculation
                        const diffInDaysForWeek = (0, date_fns_1.differenceInDays)(targetDate, approvalD);
                        if (diffInDaysForWeek >= 0 && diffInDaysForWeek % 7 === 0) {
                            expectedToday += emiValue;
                        }
                        break;
                    case 'Monthly':
                        if (targetDate.getDate() === approvalD.getDate() && targetDate >= approvalD) {
                            expectedToday += emiValue;
                        }
                        break;
                }
            });
            reportData.push({
                date: dateKey,
                collectedToday: Math.round(collectedToday * 100) / 100,
                expectedToday: Math.round(expectedToday * 100) / 100,
            });
        }
        return { success: true, data: reportData.reverse() };
    }
    catch (error) {
        console.error("Error generating daily collection report:", error);
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred while generating the report.', { details: { originalError: error.message } });
    }
});
/**
 * Callable Cloud Function for an admin to update a user's permissions.
 */
exports.updateUserPermissions = functions.https.onCall(async (data, context) => {
    var _a;
    // 1. Authentication & Authorization
    if (!context.auth || context.auth.token.isAdmin !== true) {
        throw new functions.https.HttpsError('permission-denied', 'Only administrators can update user permissions.');
    }
    // 2. Input Validation
    const { userId, permissions } = data;
    if (!userId || typeof userId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'A valid userId is required.');
    }
    if (!permissions || typeof permissions !== 'object') {
        throw new functions.https.HttpsError('invalid-argument', 'A valid permissions object is required.');
    }
    try {
        const userRef = db.collection('users').doc(userId);
        // Prevent an admin from accidentally removing their own role's permissions
        const userDoc = await userRef.get();
        if (userDoc.exists && ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) === 'Administrator') {
            throw new functions.https.HttpsError('permission-denied', 'Administrator permissions cannot be modified.');
        }
        // 3. Update Firestore
        await userRef.update({
            permissions: permissions,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Permissions updated for user ${userId} by admin ${context.auth.uid}.`);
        return { success: true, message: 'User permissions updated successfully.' };
    }
    catch (error) {
        console.error('Error updating permissions:', error);
        throw new functions.https.HttpsError('internal', error.message || 'An unexpected error occurred while updating permissions.');
    }
});
/**
 * Edits an existing EMI payment record. Admin only.
 */
exports.editEmiPayment = functions.https.onCall(async (data, context) => {
    if (!context.auth || context.auth.token.isAdmin !== true) {
        throw new functions.https.HttpsError('permission-denied', 'Only administrators can edit payments.');
    }
    const { loanApplicationId, paymentId, amount, fine, paymentMode, collectionDate, remarks } = data;
    if (!loanApplicationId || !paymentId || amount === undefined || amount === null || !paymentMode || !collectionDate) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields for editing a payment.');
    }
    const loanRef = db.collection('loanApplications').doc(loanApplicationId);
    const paymentRef = loanRef.collection('payments').doc(paymentId);
    try {
        let updatedLoanData = null;
        await db.runTransaction(async (transaction) => {
            var _a;
            const loanDoc = await transaction.get(loanRef);
            const paymentDoc = await transaction.get(paymentRef);
            if (!loanDoc.exists)
                throw new Error('Loan application not found.');
            if (!paymentDoc.exists)
                throw new Error('Payment record not found.');
            const loanData = loanDoc.data();
            const oldPaymentData = paymentDoc.data();
            // ** ROBUST DECIMAL CALCULATION **
            const oldAmount = new decimal_js_1.default(oldPaymentData.amountPaid || '0');
            const oldFine = new decimal_js_1.default(oldPaymentData.fine || '0');
            const oldTotalPayment = oldAmount.plus(oldFine);
            const newAmount = new decimal_js_1.default(amount || '0');
            const newFine = new decimal_js_1.default(fine || '0');
            const newTotalPayment = newAmount.plus(newFine);
            const currentTotalPaid = new decimal_js_1.default(loanData.totalAmountPaid || '0');
            const finalTotalPaid = currentTotalPaid.minus(oldTotalPayment).plus(newTotalPayment);
            if (finalTotalPaid.isNaN()) {
                throw new Error("Calculation resulted in NaN. Aborting transaction.");
            }
            const updatedPaymentRecord = {
                amountPaid: newAmount.toNumber(),
                fine: newFine.toNumber(),
                paymentMode,
                collectionDate: new Date(collectionDate),
                remarks: remarks || '',
                editedAt: admin.firestore.FieldValue.serverTimestamp(),
                editedBy: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid,
            };
            // Use set with merge:true for safer updates.
            transaction.set(paymentRef, updatedPaymentRecord, { merge: true });
            const updatePayload = {
                totalAmountPaid: finalTotalPaid.toNumber(),
                lastUpdatedTimestamp: admin.firestore.FieldValue.serverTimestamp(),
            };
            transaction.update(loanRef, updatePayload);
            updatedLoanData = Object.assign(Object.assign(Object.assign({}, loanData), updatePayload), { lastUpdatedTimestamp: admin.firestore.Timestamp.now() });
        });
        console.log(`Payment ${paymentId} edited for loan ${loanApplicationId} by admin ${context.auth.uid}`);
        return {
            success: true,
            message: 'Payment edited successfully.',
            updatedLoan: updatedLoanData,
        };
    }
    catch (error) {
        console.error(`Error editing payment ${paymentId}:`, error);
        throw new functions.https.HttpsError('internal', error.message || 'An error occurred while editing the payment.');
    }
});
/**
 * Deletes an existing EMI payment record. Admin only.
 */
exports.deleteEmiPayment = functions.https.onCall(async (data, context) => {
    if (!context.auth || context.auth.token.isAdmin !== true) {
        throw new functions.https.HttpsError('permission-denied', 'Only administrators can delete payments.');
    }
    const { loanApplicationId, paymentId } = data;
    if (!loanApplicationId || !paymentId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing loanApplicationId or paymentId.');
    }
    const loanRef = db.collection('loanApplications').doc(loanApplicationId);
    const paymentRef = loanRef.collection('payments').doc(paymentId);
    try {
        let updatedLoanData = null;
        await db.runTransaction(async (transaction) => {
            const loanDoc = await transaction.get(loanRef);
            const paymentDoc = await transaction.get(paymentRef);
            if (!loanDoc.exists)
                throw new Error('Loan application not found.');
            if (!paymentDoc.exists) {
                console.warn(`Payment record ${paymentId} already deleted. Skipping.`);
                updatedLoanData = loanDoc.data();
                return;
            }
            const loanData = loanDoc.data();
            const paymentData = paymentDoc.data();
            const amountToReverse = new decimal_js_1.default(paymentData.amountPaid || '0');
            const fineToReverse = new decimal_js_1.default(paymentData.fine || '0');
            const totalPaymentToReverse = amountToReverse.plus(fineToReverse);
            const currentTotalPaid = new decimal_js_1.default(loanData.totalAmountPaid || 0);
            const newTotalPaid = currentTotalPaid.minus(totalPaymentToReverse);
            if (newTotalPaid.isNaN()) {
                throw new Error("Calculation for deletion resulted in NaN. Aborting.");
            }
            transaction.delete(paymentRef);
            const updatePayload = {
                totalAmountPaid: newTotalPaid.toNumber(),
                lastUpdatedTimestamp: admin.firestore.FieldValue.serverTimestamp(),
            };
            transaction.update(loanRef, updatePayload);
            updatedLoanData = Object.assign(Object.assign(Object.assign({}, loanData), updatePayload), { lastUpdatedTimestamp: admin.firestore.Timestamp.now() });
        });
        console.log(`Payment ${paymentId} deleted for loan ${loanApplicationId} by admin ${context.auth.uid}`);
        return {
            success: true,
            message: 'Payment deleted successfully.',
            updatedLoan: updatedLoanData,
        };
    }
    catch (error) {
        console.error(`Error deleting payment ${paymentId}:`, error);
        throw new functions.https.HttpsError('internal', error.message || 'An error occurred while deleting the payment.');
    }
});
//# sourceMappingURL=index.js.map