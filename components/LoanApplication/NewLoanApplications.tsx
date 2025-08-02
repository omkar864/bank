'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface LoanApplicationFormValues {
  customerName: string;
  mobileNumber: string;
  loanAmountApproved: string;
  loanScheme: string;
  isVerified: boolean;
  adminRemarks: string;
}

const NewLoanApplications = () => {
  const [newApplications, setNewApplications] = useState<LoanApplicationFormValues[]>([
    {
      customerName: 'John Doe',
      mobileNumber: '123-456-7890',
      loanAmountApproved: '',
      loanScheme: '',
      isVerified: false,
      adminRemarks: '',
    },
    {
      customerName: 'Jane Smith',
      mobileNumber: '987-654-3210',
      loanAmountApproved: '',
      loanScheme: '',
      isVerified: false,
      adminRemarks: '',
    },
  ]);

  const [approvedApplications, setApprovedApplications] = useState<LoanApplicationFormValues[]>([]);
  const [rejectedApplications, setRejectedApplications] = useState<LoanApplicationFormValues[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<LoanApplicationFormValues | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const approveLoan = (app: LoanApplicationFormValues) => {
    setNewApplications(prev => prev.filter(a => a.customerName !== app.customerName));
    setApprovedApplications(prev => [...prev, { ...app, isVerified: true }]);
  };

  const rejectLoan = () => {
    if (!selectedApplication || rejectionReason.trim() === '') return;
    setRejectedApplications(prev => [...prev, { ...selectedApplication, adminRemarks: rejectionReason }]);
    setNewApplications(prev => prev.filter(a => a.customerName !== selectedApplication.customerName));
    closeDialog();
  };

  const openDialog = (app: LoanApplicationFormValues) => {
    setSelectedApplication(app);
    setRejectionReason(app.adminRemarks || '');
    // THIS IS THE LINE THAT WAS CAUSING THE DELAY, IT IS NOW REMOVED.
    // The dialog will open immediately when setDialogOpen(true) is called.
    setDialogOpen(true); 
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedApplication(null);
    setRejectionReason('');
  };

  return (
    <>
      <Card className="shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle>New Loan Applications</CardTitle>
          <CardDescription>Review and manage incoming loan requests.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {newApplications.length > 0 ? (
            newApplications.map(app => (
              <div key={app.customerName} className="border p-4 my-4 rounded-lg shadow-sm bg-white">
                <h3 className="text-lg font-semibold text-gray-800">{app.customerName}</h3>
                <p className="text-sm text-gray-600">Mobile: {app.mobileNumber}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button
                    onClick={() => approveLoan(app)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openDialog(app)}
                    className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">No new loan applications to review.</p>
          )}
        </CardContent>
      </Card>

      {/* Dialog for rejecting an application */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Reject {selectedApplication?.customerName}'s Application
            </DialogTitle>
            <CardDescription>Please provide a reason for rejection.</CardDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason (e.g., 'Insufficient income', 'Incomplete documents')"
            className="mt-4 min-h-[100px]"
          />
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button variant="destructive" onClick={rejectLoan} disabled={rejectionReason.trim() === ''}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewLoanApplications;