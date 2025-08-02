'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {useState} from 'react';
import type {LoanSchemeFormValues} from './SchemeCreateForm';
import SchemeCreateForm from './SchemeCreateForm';
import SchemeList from './SchemeList';

interface LoanSchemeManagementProps {
  loanSchemes?: LoanSchemeFormValues[];
  setLoanSchemes?: (schemes: LoanSchemeFormValues[]) => void;
}

const LoanSchemeManagement = ({
  loanSchemes: propLoanSchemes,
  setLoanSchemes: propSetLoanSchemes,
}: LoanSchemeManagementProps) => {
  const [loanSchemes, setLoanSchemes] = useState<LoanSchemeFormValues[]>([
    {
      schemeName: 'Default Scheme',
      loanType: 'Personal',
      interestRate: '12%',
      processingFee: '500',
      otherCharges: '100',
      loanPeriod: '12 Months',
      repaymentMode: 'Monthly',
      lateFine: '50',
    },
  ]);

  function onSchemeSubmit(values: LoanSchemeFormValues) {
    setLoanSchemes([...loanSchemes, values]);
    console.log('Loan Scheme Submitted:', values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan Scheme Management</CardTitle>
        <CardDescription>Create and manage loan schemes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SchemeCreateForm onSubmit={onSchemeSubmit} />
        <SchemeList loanSchemes={loanSchemes} />
      </CardContent>
    </Card>
  );
};

export default LoanSchemeManagement;
