
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NewLoanApplications from '@/components/LoanApplication/NewLoanApplications';
import ApprovedLoanApplications from '@/components/LoanApplication/ApprovedLoanApplications';
import RejectedLoanApplications from '@/components/LoanApplication/RejectedLoanApplications';
import type { LoanApplicationFormValues } from './LoanApplicationForm';
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


interface LoanApplicationProps {
  newApplicationsList: LoanApplicationData[];
  approvedApplicationsList: LoanApplicationData[];
  rejectedApplicationsList: LoanApplicationData[];
  onViewDetailsRequest: (application: LoanApplicationData) => void;
  onConfirmQuickReject: (applicationId: string, reason: string) => void;
  onDeleteApplication: (applicationId: string) => void;
  currentUserIsAdmin: boolean;
  userPermissions: any;
}

const LoanApplication = ({
  newApplicationsList,
  approvedApplicationsList,
  rejectedApplicationsList,
  onViewDetailsRequest,
  onConfirmQuickReject,
  onDeleteApplication,
}: LoanApplicationProps) => {

  return (
    <Tabs defaultValue="new" className="w-full">
      <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 h-auto sm:h-10">
        <TabsTrigger value="new" className="whitespace-normal sm:whitespace-nowrap text-center">
          New Applications ({newApplicationsList.length})
        </TabsTrigger>
        <TabsTrigger value="approved" className="whitespace-normal sm:whitespace-nowrap text-center">
          Approved Applications ({approvedApplicationsList.length})
        </TabsTrigger>
        <TabsTrigger value="rejected" className="whitespace-normal sm:whitespace-nowrap text-center">
          Rejected Applications ({rejectedApplicationsList.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="new">
        <NewLoanApplications
            applications={newApplicationsList}
            onViewDetails={onViewDetailsRequest}
            onConfirmReject={onConfirmQuickReject}
        />
      </TabsContent>
      <TabsContent value="approved">
        <ApprovedLoanApplications applications={approvedApplicationsList} />
      </TabsContent>
      <TabsContent value="rejected">
        <RejectedLoanApplications applications={rejectedApplicationsList} />
      </TabsContent>
    </Tabs>
  );
};

export default LoanApplication;
