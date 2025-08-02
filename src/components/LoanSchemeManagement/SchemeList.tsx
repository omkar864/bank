
'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { LoanSchemeFormValues } from './SchemeCreateForm.tsx';

interface SchemeListProps {
  loanSchemes: LoanSchemeFormValues[];
  onEdit: (scheme: LoanSchemeFormValues) => void;
  onDelete: (schemeName: string) => void;
}

const SchemeList = ({loanSchemes, onEdit, onDelete}: SchemeListProps) => {
  if (!loanSchemes || loanSchemes.length === 0) {
    return (
      <div className="mt-6 text-center">
        <p className="text-muted-foreground">No loan schemes created yet.</p>
        <p className="text-sm text-muted-foreground">Use the form above to create your first loan scheme.</p>
      </div>
    );
  }
  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Existing Loan Schemes</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loanSchemes.map((scheme) => (
          <Card key={scheme.schemeName} className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{scheme.schemeName}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-1 text-sm">
              <p><span className="font-medium">Loan Type:</span> {scheme.loanType}</p>
              <p><span className="font-medium">Interest:</span> {scheme.interestRate}%</p>
              <p><span className="font-medium">Processing Fee:</span> ₹{scheme.processingFee}</p>
              {scheme.otherCharges && <p><span className="font-medium">Other Charges:</span> ₹{scheme.otherCharges}</p>}
              <p><span className="font-medium">Period:</span> {scheme.loanPeriod}</p>
              <p><span className="font-medium">Repayment:</span> {scheme.repaymentMode}</p>
              <p><span className="font-medium">Late Fine:</span> ₹{scheme.lateFine}</p>
            </CardContent>
            <div className="p-4 pt-2 border-t flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(scheme)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the loan scheme
                      "{scheme.schemeName}". Ensure this scheme is not currently in use by active loans
                      before proceeding.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(scheme.schemeName)}>
                      Yes, delete scheme
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SchemeList;
