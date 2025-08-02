
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { LoanApplicationData } from './LoanApplication';
import { XCircle } from 'lucide-react';

interface RejectedLoanApplicationsProps {
  applications: LoanApplicationData[];
}

const RejectedLoanApplications = ({ applications }: RejectedLoanApplicationsProps) => {

  const getRejectionDate = (timestamp: LoanApplicationData['rejectionDate']): string => {
    if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString();
    }
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString();
    }
    return 'N/A';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rejected Loan Applications</CardTitle>
        <CardDescription>View all loan applications that have been rejected.</CardDescription>
      </CardHeader>
      <CardContent>
        {applications.length > 0 ? (
          <ScrollArea className="h-[400px] w-full">
            <div className="space-y-4">
            {applications.map(application => (
              <Card key={application.id} className="p-4 shadow-sm hover:shadow-md transition-shadow rounded-lg border border-destructive/60">
                <div className="flex flex-col sm:flex-row justify-between items-start">
                    <div className="flex-grow mb-3 sm:mb-0">
                        <div className="flex items-center mb-1">
                           <XCircle className="h-6 w-6 text-destructive mr-2" />
                           <h3 className="text-lg font-semibold text-destructive/90">{application.customerName}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground ml-8">ID: {application.id}</p>
                        <div className="mt-2 space-y-1 text-sm ml-8">
                            {application.mobileNumber && <p><span className="font-medium">Mobile:</span> {application.mobileNumber}</p>}
                            {application.loanAmountRequired && <p><span className="font-medium">Amount Requested:</span> ₹{application.loanAmountRequired}</p>}
                            <p className="mt-1">
                                <span className="font-medium">Reason for Rejection:</span> {application.adminRemarks || 'N/A'}
                            </p>
                            <p><span className="font-medium">Rejected On:</span> {getRejectionDate(application.rejectionDate)}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-3 ml-8 sm:ml-0">
                    <Badge variant="destructive">Rejected</Badge>
                </div>
              </Card>
            ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center text-muted-foreground py-12 flex flex-col items-center h-[200px] justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-x-2 h-12 w-12 text-muted-foreground/50 mb-4"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><path d="M14 2v6h6"/><path d="m14.5 12.5-5 5"/><path d="m9.5 12.5 5 5"/><path d="M3 15h7V8H3Z"/></svg>
            <p className="text-lg">No rejected applications.</p>
            <p className="text-sm">Rejected loan applications will appear here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RejectedLoanApplications;
