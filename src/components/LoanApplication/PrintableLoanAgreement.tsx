import React from 'react';
import type { LoanApplicationData } from './LoanApplication';

interface PrintableLoanAgreementProps {
  applicationToView?: LoanApplicationData | null;
}

const PrintableLoanAgreement = React.forwardRef<HTMLDivElement, PrintableLoanAgreementProps>(
  ({ applicationToView }, ref) => {
    
    return (
      <div ref={ref}>
        {/* Placeholder for Loan Agreement */}
        <h1 className="text-2xl font-bold">Loan Agreement</h1>
        <p className="mt-4">This document is a placeholder for the loan agreement for:</p>
        <p className="font-semibold mt-2">{applicationToView?.customerName || 'N/A'}</p>
        <p className="text-sm text-muted-foreground">Loan ID: {applicationToView?.id || 'N/A'}</p>
        <div className="mt-8 p-8 border-dashed border-2 rounded-md">
            <p className="text-center text-muted-foreground">
                Loan agreement content will be dynamically generated here based on the application data.
            </p>
        </div>
      </div>
    );
  }
);

PrintableLoanAgreement.displayName = 'PrintableLoanAgreement';

export default PrintableLoanAgreement;
