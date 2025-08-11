import type { Timestamp } from 'firebase/firestore';

// This is the primary data structure for a loan application as it exists in Firestore.
// It reflects the data after it has been processed by the backend Cloud Functions.
export interface LoanApplicationData {
  id: string; // The Firestore document ID
  applicationId: string;
  
  // Submitter Info
  submittedByUid: string;
  submissionTimestamp: Timestamp | string;
  lastUpdatedTimestamp: Timestamp | string;

  // Status and Admin
  status: 'Pending' | 'Approved' | 'Rejected' | 'VerificationRequired' | 'PaidInFull';
  isVerified?: boolean;
  verifiedBy?: string;
  verificationTimestamp?: Timestamp | string;
  approvedBy?: string;
  approvalDate?: Timestamp | string;
  rejectedBy?: string;
  rejectionDate?: Timestamp | string;
  adminRemarks?: string;
  
  // Personal Details
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
  
  // Address
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

  // Work
  companyShopName: string;
  companyShopAddress: string;

  // Documents (Types and Numbers)
  identityDocumentType: string;
  identityDocumentNumber: string; 
  addressProofDocumentType: string;
  addressProofDocumentNumber: string; 
  guarantorDocumentType: string;
  guarantorDocumentNumber: string;

  // File URLs from Cloud Storage
  identityDocumentFileUrl?: string;
  addressProofDocumentFileUrl?: string;
  customerPhotoUrl?: string;
  guarantorDocumentFileUrl?: string;
  
  // Guarantor
  guarantorName: string;
  guarantorMobileNumber: string;
  guarantorAddress: string;

  // Financial
  annualIncome: string;
  monthlyIncome: string;

  // Loan Terms
  loanAmountRequired: string;
  loanAmountApproved?: string;
  repaymentType: 'Daily' | 'Weekly' | 'Monthly';
  tenurePeriod: string;
  loanScheme: string;
  securityForLoan?: string;
  interestRate?: string;
  processingFee?: string;
  loanType?: string;
  lateFine?: string;
  
  // EMI & Payment Tracking
  totalAmountPaid?: number; // New field for live payment tracking
  dailyEMI?: string;
  weeklyEMI?: string;
  monthlyEMI?: string;
  
  // Fine
  autoFine?: boolean;
  finePerMissedPayment?: string;

  // Branch
  assignedBranchCode?: string;
  assignedSubBranchCode?: string;
}
