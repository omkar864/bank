'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface LoanApplicationFormValues {
  customerName: string;
  loanAmountApproved: string;
  loanScheme: string;
}

const ApprovedLoanApplications = () => {
  const approvedApplications: LoanApplicationFormValues[] = [
    {
      customerName: 'John Doe',
      loanAmountApproved: '10000',
      loanScheme: 'Default Scheme',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approved Loan Applications</CardTitle>
        <CardDescription>View all approved loan applications.</CardDescription>
      </CardHeader>
      <CardContent>
        {approvedApplications.length > 0 ? (
          approvedApplications.map(application => (
            <div key={application.customerName} className="border rounded-md p-4 my-2">
              <h3 className="font-semibold">{application.customerName}</h3>
              <p>Loan Amount: {application.loanAmountApproved}</p>
              <p>Scheme: {application.loanScheme}</p>
            </div>
          ))
        ) : (
          <p>No approved loan applications.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ApprovedLoanApplications;
