
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NewLoanApplications from '@/components/LoanApplication/NewLoanApplications';
import ApprovedLoanApplications from '@/components/LoanApplication/ApprovedLoanApplications';
import RejectedLoanApplications from '@/components/LoanApplication/RejectedLoanApplications';
import type { LoanApplicationData } from './types'; // Corrected import
import type { LoanApplicationFormValues } from './LoanApplicationForm';
import type { Timestamp } from 'firebase/firestore';

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
