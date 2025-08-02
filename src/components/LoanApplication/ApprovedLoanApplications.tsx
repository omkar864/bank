
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Download, CheckCircle } from 'lucide-react';
import type { LoanApplicationData } from './LoanApplication';
import PrintDialog from './PrintDialog';

interface ApprovedLoanApplicationsProps {
  applications: LoanApplicationData[];
}

const ApprovedLoanApplications = ({ applications }: ApprovedLoanApplicationsProps) => {
  const [applicationToPrint, setApplicationToPrint] = React.useState<LoanApplicationData | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = React.useState(false);
  const [documentTypeToPrint, setDocumentTypeToPrint] = React.useState<'application' | 'agreement'>('application');


  const triggerPrint = (application: LoanApplicationData, docType: 'application' | 'agreement') => {
    setApplicationToPrint(application);
    setDocumentTypeToPrint(docType);
    setIsPrintDialogOpen(true);
  };
  
  const getApprovalDate = (timestamp: LoanApplicationData['approvalDate']): string => {
    if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString();
    }
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString();
    }
    return 'N/A';
  }

  return (
    <>
      <PrintDialog
        isOpen={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
        applicationToView={applicationToPrint}
        documentType={documentTypeToPrint}
      />
      <Card>
        <CardHeader>
          <CardTitle>Approved Loan Applications</CardTitle>
          <CardDescription>View all active loans that have been approved.</CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length > 0 ? (
            <ScrollArea className="h-[400px] w-full">
              <div className="space-y-4">
              {applications.map(application => (
                <Card key={application.id} className="p-4 shadow-md hover:shadow-lg transition-shadow rounded-lg border border-green-500/50">
                  <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="flex-grow mb-3 sm:mb-0">
                          <div className="flex items-center mb-1">
                              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                              <h3 className="text-lg font-semibold text-green-700">{application.customerName}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground ml-8">ID: {application.id}</p>
                          <div className="mt-2 space-y-1 text-sm ml-8">
                              <p><span className="font-medium">Mobile:</span> {application.mobileNumber}</p>
                              <p><span className="font-medium">Approved Amount:</span> ₹{application.loanAmountApproved || application.loanAmountRequired}</p>
                              <p><span className="font-medium">Scheme:</span> {application.loanScheme || 'N/A'}</p>
                              <p><span className="font-medium">Interest Rate:</span> {application.interestRate || 'N/A'}%</p>
                              <p><span className="font-medium">Repayment:</span> {application.repaymentType || 'N/A'} (EMI: ₹{application.dailyEMI || application.weeklyEMI || application.monthlyEMI || 'N/A'})</p>
                              <p><span className="font-medium">Approved On:</span> {getApprovalDate(application.approvalDate)}</p>
                          </div>
                      </div>
                       <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0 self-center flex flex-col sm:flex-row gap-2">
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={() => triggerPrint(application, 'application')}
                              className="text-primary border-primary hover:bg-primary/10 w-full"
                          >
                              <Download className="mr-2 h-4 w-4" />
                              Download Form
                          </Button>
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={() => triggerPrint(application, 'agreement')}
                              className="text-primary border-primary hover:bg-primary/10 w-full"
                          >
                              <Download className="mr-2 h-4 w-4" />
                              Download Agreement
                          </Button>
                      </div>
                  </div>
                   <div className="mt-3 ml-8 sm:ml-0">
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">Approved</Badge>
                  </div>
                </Card>
              ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center text-muted-foreground py-12 flex flex-col items-center h-[200px] justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-check h-12 w-12 text-muted-foreground/50 mb-4"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>
              <p className="text-lg">No approved applications.</p>
              <p className="text-sm">Approved loan applications will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default ApprovedLoanApplications;
