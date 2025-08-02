
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { LoanApplicationData } from './LoanApplication';

interface RejectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmSubmit: (reason: string) => void;
  application: LoanApplicationData | null;
  initialReason?: string;
}

const RejectionDialog = React.memo(
  ({
    isOpen,
    onOpenChange,
    onConfirmSubmit,
    application,
    initialReason,
  }: RejectionDialogProps) => {
    const reasonTextareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Key to force re-mount of Textarea when application context or initialReason changes
    const textareaKey = React.useMemo(
      () => `rejection-reason-${application?.id || 'new'}-${initialReason || 'empty'}`,
      [application?.id, initialReason]
    );

    React.useEffect(() => {
      if (isOpen && reasonTextareaRef.current) {
        const timer = setTimeout(() => {
          reasonTextareaRef.current?.focus();
          // reasonTextareaRef.current?.select(); // Optional: select text on focus
        }, 50); // Delay to allow dialog to fully render
        return () => clearTimeout(timer);
      }
    }, [isOpen, textareaKey]); // Re-run if dialog opens or key changes (new app/reason)

    const handleConfirmClick = () => {
      const reason = reasonTextareaRef.current?.value.trim() || '';
      if (reason) {
        onConfirmSubmit(reason);
      } else {
        console.warn("Rejection reason cannot be empty.");
        reasonTextareaRef.current?.focus(); // Re-focus if empty
        // Optionally, show a toast message to the user that reason is required.
      }
    };

    const handleCloseDialog = () => {
      onOpenChange(false);
    };

    if (!application) {
      return null;
    }

    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent
          onEscapeKeyDown={handleCloseDialog}
          // Prevent closing if clicking on elements that might be outside the Radix focus scope
           onPointerDownOutside={(e) => {
             if (reasonTextareaRef.current?.contains(e.target as Node)) {
               e.preventDefault();
             }
           }}
        >
          <DialogHeader>
            <DialogTitle>
              Reject Loan Application for: {application.customerName}
            </DialogTitle>
            <DialogDescription>
              ID: {application.id}. Please provide a clear reason for rejecting this application.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor={textareaKey} className="block text-sm font-medium">
              Rejection Reason
            </Label>
            <Textarea
              ref={reasonTextareaRef}
              id={textareaKey}
              key={textareaKey} // Crucial for re-initializing with new defaultValue
              defaultValue={initialReason || ''}
              placeholder="Enter reason for rejection..."
              className="w-full"
              rows={5}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmClick}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

RejectionDialog.displayName = 'RejectionDialog';
export default RejectionDialog;
