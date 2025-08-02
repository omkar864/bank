
import type { LoanApplicationData } from '../LoanApplication/LoanApplication';
import type { Timestamp } from 'firebase/firestore';

export interface PaymentRecord {
    id: string; // Firestore document ID
    paymentId: string;
    amountPaid: number;
    fine?: number;
    paymentMode: 'Cash' | 'Online' | 'Cheque';
    collectionDate: Timestamp | string;
    remarks?: string;
    collectedByUid: string;
    collectionTimestamp: Timestamp | string;
}

export interface CustomerReportInfo extends LoanApplicationData {
    collectedAmount?: number;
    collectorName?: string;
}

export interface ReportData {
    paidCustomers: CustomerReportInfo[];
    pendingCustomers: CustomerReportInfo[];
    collected: number;
    expected: number;
}
