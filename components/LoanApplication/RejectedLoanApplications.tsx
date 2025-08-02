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
  adminRemarks: string;
}

const RejectedLoanApplications = () => {
  const rejectedApplications: LoanApplicationFormValues[] = [
    {
      customerName: 'John Doe',
      adminRemarks: 'Invalid documents',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rejected Loan Applications</CardTitle>
        <CardDescription>View all rejected loan applications.</CardDescription>
      </CardHeader>
      <CardContent>
        {rejectedApplications.length > 0 ? (
          rejectedApplications.map(application => (
            <div key={application.customerName} className="border rounded-md p-4 my-2">
              <h3 className="font-semibold">{application.customerName}</h3>
              <p>Reason: {application.adminRemarks}</p>
            </div>
          ))
        ) : (
          <p>No rejected loan applications.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default RejectedLoanApplications;
