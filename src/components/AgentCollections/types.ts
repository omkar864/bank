
// src/components/AgentCollections/types.ts

import type { LoanApplicationData } from '@/components/LoanApplication/LoanApplication';
import type { Timestamp } from 'firebase/firestore';

// This represents derived data calculated on the client for display purposes.
// It is NOT a data structure stored in Firestore.
export interface CustomerLoanDetails extends LoanApplicationData {
  totalLoanPrincipal: number;
  totalInterest: number;
  totalLoanAmountWithInterest: number; // Principal + Interest
  emiAmount: number;
  numberOfInstallments: number;
  amountPending: number;
}

// This represents an actual payment record from the 'payments' subcollection in Firestore.
export interface PaymentRecord {
    id: string; // Firestore document ID
    paymentId: string;
    amountPaid: number;
    fine?: number; // Optional fine amount
    paymentMode: 'Cash' | 'Online' | 'Cheque';
    collectionDate: Timestamp | string; // Stored as Timestamp, may be received as string
    remarks?: string;
    collectedByUid: string;
    collectionTimestamp: Timestamp | string; // Stored as Timestamp, may be received as string
    editedAt?: Timestamp | string;
    editedBy?: string;
}

// This represents the data payload sent from the client-side modal to the Cloud Function for creating a new payment.
export interface EmiPaymentInput {
  loanApplicationId: string;
  amount: number;
  fine?: number;
  collectionDate: string; // YYYY-MM-DD
  paymentMode: 'Cash' | 'Online' | 'Cheque';
  remarks?: string;
}

// This represents the data payload for editing an existing payment.
export interface EditEmiPaymentInput extends EmiPaymentInput {
    paymentId: string;
}
