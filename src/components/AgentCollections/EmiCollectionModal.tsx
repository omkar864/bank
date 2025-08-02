
// src/components/AgentCollections/EmiCollectionModal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { CustomerLoanDetails, EmiPaymentInput, PaymentRecord, EditEmiPaymentInput } from './types';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase/clientApp';
import { Loader2 } from 'lucide-react';
import type { LoanApplicationData } from '../LoanApplication/LoanApplication';

interface EmiCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerLoanDetails | null;
  paymentToEdit?: PaymentRecord | null;
  onPaymentSuccess: (updatedLoanData: Partial<LoanApplicationData>) => void;
}

const EmiCollectionModal = ({ isOpen, onClose, customer, paymentToEdit, onPaymentSuccess }: EmiCollectionModalProps) => {
  const [collectedAmount, setCollectedAmount] = useState<string>('');
  const [fineAmount, setFineAmount] = useState<string>('');
  const [collectionDate, setCollectionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online' | 'Cheque'>('Cash');
  const [remarks, setRemarks] = useState<string>('');
  const [amountError, setAmountError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const isEditing = !!paymentToEdit;

  useEffect(() => {
    if (isOpen && customer) {
      if (isEditing && paymentToEdit) {
        setCollectedAmount(String(paymentToEdit.amountPaid));
        setFineAmount(String(paymentToEdit.fine || ''));
        const date = typeof paymentToEdit.collectionDate === 'string' ? new Date(paymentToEdit.collectionDate) : paymentToEdit.collectionDate.toDate();
        setCollectionDate(date.toISOString().split('T')[0]);
        setPaymentMode(paymentToEdit.paymentMode);
        setRemarks(paymentToEdit.remarks || '');
      } else {
        // Reset for new payment
        setCollectedAmount(customer.emiAmount?.toFixed(2) || '');
        setFineAmount('');
        setCollectionDate(new Date().toISOString().split('T')[0]);
        setPaymentMode('Cash');
        setRemarks('');
      }
      setAmountError('');
      setIsSubmitting(false);
      // Focus the amount input when dialog opens
      setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      }, 100);
    }
  }, [isOpen, customer, paymentToEdit, isEditing]);

  const handleSubmit = async () => {
    const amount = parseFloat(collectedAmount);
    if (isNaN(amount) || amount <= 0) {
      setAmountError('Please enter a valid positive amount.');
      amountInputRef.current?.focus();
      return;
    }
    setAmountError('');

    if (!customer) return;
    
    setIsSubmitting(true);
    const firebaseFunctions = getFunctions(app);
    const fine = parseFloat(fineAmount) || 0;

    try {
        let result: any;
        if (isEditing && paymentToEdit) {
            const editEmiPayment = httpsCallable(firebaseFunctions, 'editemipayment');
            const payload: EditEmiPaymentInput = {
                loanApplicationId: customer.id,
                paymentId: paymentToEdit.id,
                amount,
                fine,
                collectionDate,
                paymentMode,
                remarks,
            };
            result = await editEmiPayment(payload);
        } else {
            const recordEmiPayment = httpsCallable(firebaseFunctions, 'recordemipayment');
            const payload: EmiPaymentInput = {
                loanApplicationId: customer.id,
                amount,
                fine,
                collectionDate,
                paymentMode,
                remarks
            };
            result = await recordEmiPayment(payload);
        }

        if (result.data.success) {
            toast({
                title: "Success",
                description: result.data.message || "Payment processed successfully."
            });
            onPaymentSuccess(result.data.updatedLoan); 
            onClose();
        } else {
            throw new Error(result.data.message || `Failed to ${isEditing ? 'edit' : 'record'} payment.`);
        }
    } catch (error: any) {
        console.error(`Error ${isEditing ? 'editing' : 'recording'} payment:`, error);
        toast({
            title: "Operation Failed",
            description: error.message || "An unexpected error occurred.",
            variant: "destructive"
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {if (!open) onClose()}}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Record'} Collected EMI</DialogTitle>
          <DialogDescription>
            {isEditing ? `Editing payment for ${customer.customerName}.` : `Recording a payment for ${customer.customerName}.`}
            <br />
            Scheduled EMI: ₹{customer.emiAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="collected-amount" className="text-right col-span-1">
              Amount (₹)
            </Label>
            <div className="col-span-3">
              <Input
                ref={amountInputRef}
                id="collected-amount"
                type="number"
                value={collectedAmount}
                onChange={(e) => {
                  setCollectedAmount(e.target.value);
                  if (amountError) setAmountError('');
                }}
                placeholder={`e.g., ${customer.emiAmount.toFixed(2)}`}
                className={amountError ? "border-destructive focus-visible:ring-destructive" : ""}
                disabled={isSubmitting}
              />
              {amountError && <p className="text-xs text-destructive mt-1">{amountError}</p>}
            </div>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fine-amount" className="text-right col-span-1">
              Fine (₹)
            </Label>
            <div className="col-span-3">
              <Input
                id="fine-amount"
                type="number"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
                placeholder="e.g., 50 (optional)"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="collection-date" className="text-right col-span-1">
              Date
            </Label>
            <Input
              id="collection-date"
              type="date"
              value={collectionDate}
              onChange={(e) => setCollectionDate(e.target.value)}
              className="col-span-3"
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right col-span-1 pt-1">Mode</Label>
            <RadioGroup 
                value={paymentMode} 
                onValueChange={(value: 'Cash' | 'Online' | 'Cheque') => setPaymentMode(value)} 
                className="col-span-3 flex flex-wrap space-x-4 items-center"
                disabled={isSubmitting}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Cash" id="cash" />
                <Label htmlFor="cash" className="font-normal">Cash</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Online" id="online" />
                <Label htmlFor="online" className="font-normal">Online</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Cheque" id="cheque" />
                <Label htmlFor="cheque" className="font-normal">Cheque</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="remarks" className="text-right col-span-1 pt-2">
              Remarks
            </Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional notes about the collection..."
              className="col-span-3"
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmiCollectionModal;

    
