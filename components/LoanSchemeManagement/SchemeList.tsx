'use client';

import {Card, CardContent} from '@/components/ui/card';

interface LoanSchemeFormValues {
  schemeName: string;
  loanType: string;
  interestRate: string;
  processingFee: string;
  otherCharges: string;
  loanPeriod: string;
  repaymentMode: 'Daily' | 'Weekly' | 'Monthly';
  lateFine: string;
}

interface SchemeListProps {
  loanSchemes: LoanSchemeFormValues[];
}

const SchemeList = ({loanSchemes}: SchemeListProps) => {
  return (
    <>
      <h2 className="text-lg font-semibold mt-4">Existing Loan Schemes</h2>
      {loanSchemes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loanSchemes.map((scheme, index) => (
            <Card key={index} className="border rounded-md p-4 my-2">
              <CardContent className="p-0">
                <h3 className="font-semibold">{scheme.schemeName}</h3>
                <p>Loan Type: {scheme.loanType}</p>
                <p>Interest Rate: {scheme.interestRate}</p>
                <p>Processing Fee: {scheme.processingFee}</p>
                <p>Other Charges: {scheme.otherCharges}</p>
                <p>Loan Period: {scheme.loanPeriod}</p>
                <p>Repayment Mode: {scheme.repaymentMode}</p>
                <p>Late Fine: {scheme.lateFine}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>No loan schemes created yet.</p>
      )}
    </>
  );
};

export default SchemeList;
