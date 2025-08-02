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
  DialogDescription,
} from '@/components/ui/dialog';
import { useState } from 'react';
import type { LoanApplicationData } from './LoanApplication';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, FileWarning, Eye, XCircle } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface NewLoanApplicationsProps {
  applications: LoanApplicationData[];
  onViewDetails: (application: LoanApplicationData) => void;
  onConfirmReject: (applicationId: string, reason: string) => void;
}

const NewLoanApplications = ({
  applications,
  onViewDetails,
  onConfirmReject,
}: NewLoanApplicationsProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<LoanApplicationData | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleRejectClick = (app: LoanApplicationData) => {
    setSelectedApplication(app);
    setRejectionReason(''); // Reset reason
    setDialogOpen(true);
  };

  const handleConfirmRejection = () => {
    if (!selectedApplication || !rejectionReason.trim()) {
      return; // Add toast feedback if needed
    }
    onConfirmReject(selectedApplication.id, rejectionReason);
    closeDialog();
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedApplication(null);
    setRejectionReason('');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>New Loan Applications</CardTitle>
          <CardDescription>
            Review incoming loan requests. Click 'View/Verify Details' to approve or make detailed modifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length > 0 ? (
            <ScrollArea className="h-[400px] w-full">
              <div className="space-y-4">
                {applications.map(app => (
                  <Card key={app.id} className="p-4 shadow-sm hover:shadow-md transition-shadow rounded-lg border-l-4 border-yellow-500">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold text-gray-800">{app.customerName}</h3>
                        <p className="text-xs text-muted-foreground">ID: {app.id}</p>
                        <div className="mt-2 space-y-1 text-sm">
                          <p><span className="font-medium">Mobile:</span> {app.mobileNumber}</p>
                          <p className="flex items-center"><span className="font-medium mr-1">Amount Requested:</span> <IndianRupee className="h-4 w-4 mr-0.5" /> {app.loanAmountRequired}</p>
                          <p><span className="font-medium">Scheme:</span> <Badge variant="secondary">{app.loanScheme}</Badge></p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                          onClick={() => onViewDetails(app)}
                          className="w-full"
                        >
                          <Eye className="mr-2 h-4 w-4" /> View/Verify Details
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleRejectClick(app)}
                          className="w-full border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <XCircle className="mr-2 h-4 w-4" /> Quick Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
             <div className="text-center text-muted-foreground py-12 flex flex-col items-center h-[200px] justify-center">
               <FileWarning className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg">No new loan applications.</p>
              <p className="text-sm">Applications waiting for review will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Reject {selectedApplication?.customerName}'s Application
            </DialogTitle>
            <DialogDescription>Please provide a reason for rejection.</DialogDescription>
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
            <Button variant="destructive" onClick={handleConfirmRejection} disabled={rejectionReason.trim() === ''}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewLoanApplications;
