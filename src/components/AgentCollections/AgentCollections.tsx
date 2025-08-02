
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Users, Search, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db, auth, app } from '@/lib/firebase/clientApp';
import { collection, query, getDocs, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';

import type { Branch } from '@/components/BranchManagement/BranchManagement';
import type { LoanApplicationData } from '@/components/LoanApplication/LoanApplication';
import type { CustomerLoanDetails, PaymentRecord } from './types';

import CustomerLoanSummary from './CustomerLoanSummary';
import EmiCollectionTable from './EmiCollectionTable';
import EmiCollectionModal from './EmiCollectionModal';
import { Button } from '../ui/button';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuthState } from 'react-firebase-hooks/auth';
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


function calculateLoanDetails(loan: LoanApplicationData): CustomerLoanDetails {
    const loanAmountApproved = parseFloat(loan.loanAmountApproved || loan.loanAmountRequired || '0');
    const interestRate = parseFloat(loan.interestRate || '0') / 100;
    const tenurePeriod = parseInt(loan.tenurePeriod || '0');
    
    const totalInterest = loanAmountApproved * interestRate;
    const totalLoanAmountWithInterest = loanAmountApproved + totalInterest;
    
    let emiAmount = 0;
    if (tenurePeriod > 0) {
        emiAmount = totalLoanAmountWithInterest / tenurePeriod;
    }

    const amountPaidSoFar = loan.totalAmountPaid || 0;
    const amountPending = totalLoanAmountWithInterest - amountPaidSoFar;

    return {
        ...loan,
        totalLoanPrincipal: loanAmountApproved,
        totalInterest: totalInterest,
        totalLoanAmountWithInterest: totalLoanAmountWithInterest,
        emiAmount: emiAmount,
        numberOfInstallments: tenurePeriod,
        amountPending: amountPending,
    };
}

interface AgentCollectionsProps {
  branches: Branch[];
  customersWithLoans: LoanApplicationData[];
}

const AgentCollections = ({ branches, customersWithLoans }: AgentCollectionsProps) => {
  const [selectedBranchCode, setSelectedBranchCode] = useState<string>('all-branches');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<LoanApplicationData | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<PaymentRecord | null>(null);
  const [paymentToDeleteId, setPaymentToDeleteId] = useState<string | null>(null);
  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    user?.getIdTokenResult().then(idTokenResult => {
        setIsAdmin(idTokenResult.claims.isAdmin === true);
    });
  }, [user]);

  const availableBranches = useMemo(() => branches.filter(b => b.branchType === 'Branch' || b.branchType === 'Sub-Branch'), [branches]);
  
  const customersInBranch = useMemo(() => {
    if (selectedBranchCode === 'all-branches') {
      return customersWithLoans;
    }
    return customersWithLoans.filter(c => c.assignedBranchCode === selectedBranchCode || c.assignedSubBranchCode === selectedBranchCode);
  }, [selectedBranchCode, customersWithLoans]);

  const handleBranchSelect = (branchCode: string) => {
    setSelectedBranchCode(branchCode);
    setSearchTerm('');
    setSelectedCustomer(null);
    setPaymentHistory([]);
  };

  const handleCustomerSelect = useCallback(async (customer: LoanApplicationData) => {
    setIsLoading(true);
    setSelectedCustomer(customer);
    setPaymentHistory([]);
    try {
      const paymentsQuery = query(
        collection(db, 'loanApplications', customer.id, 'payments'),
        orderBy('collectionDate', 'desc')
      );
      const querySnapshot = await getDocs(paymentsQuery);
      const payments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentRecord));
      setPaymentHistory(payments);
    } catch (error: any) {
      console.error("Error fetching payment history:", error);
      toast({
        title: "Error",
        description: "Could not fetch payment history for this customer.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const getParentSpouseDetails = (customer: LoanApplicationData): React.ReactNode => {
    const details: React.ReactNode[] = [];
    if (customer.fatherName) {
      details.push(<div key="father" className="text-xs text-muted-foreground">S/o: {customer.fatherName}</div>);
    }
    if (customer.husbandWifeName) {
      details.push(<div key="spouse" className="text-xs text-muted-foreground">W/o: {customer.husbandWifeName}</div>);
    }
    return details.length > 0 ? <>{details}</> : <span className="text-xs italic text-muted-foreground">Relative info N/A</span>;
  };

  const filteredCustomersInBranch = useMemo(() => {
    if (!searchTerm) return customersInBranch;
    return customersInBranch.filter(customer =>
      customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customersInBranch, searchTerm]);
  
  const detailedSelectedCustomer = useMemo(() => {
    if (!selectedCustomer) return null;
    return calculateLoanDetails(selectedCustomer);
  }, [selectedCustomer]);

  const onPaymentSuccess = useCallback(async (updatedLoanData: Partial<LoanApplicationData>) => {
    if (selectedCustomer) {
      // Immediately update the local state for instant UI feedback
      const newSelectedCustomer = { ...selectedCustomer, ...updatedLoanData };
      setSelectedCustomer(newSelectedCustomer);
      // Re-fetch the payment history to include the new/edited payment
      await handleCustomerSelect(newSelectedCustomer);
      toast({
        title: 'Payment Recorded',
        description: 'Loan details and payment history have been updated.',
      });
    }
  }, [selectedCustomer, handleCustomerSelect, toast]);
  
  const handleOpenModalForNew = () => {
    setPaymentToEdit(null);
    setIsModalOpen(true);
  }

  const handleOpenModalForEdit = (payment: PaymentRecord) => {
    setPaymentToEdit(payment);
    setIsModalOpen(true);
  }

  const handleDeletePayment = async () => {
    if (!paymentToDeleteId || !selectedCustomer) return;
    setIsLoading(true);
    const firebaseFunctions = getFunctions(app);
    const deleteEmiPayment = httpsCallable(firebaseFunctions, 'deleteemipayment');
    try {
        const result:any = await deleteEmiPayment({ loanApplicationId: selectedCustomer.id, paymentId: paymentToDeleteId });
        if (result.data.success) {
            toast({ title: 'Success', description: 'Payment record deleted successfully.'});
            await onPaymentSuccess(result.data.updatedLoan);
        } else {
            throw new Error(result.data.message || 'Failed to delete payment');
        }
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive'});
    } finally {
        setIsLoading(false);
        setPaymentToDeleteId(null);
    }
  };


  return (
    <>
    <Card className="shadow-lg rounded-xl overflow-hidden w-full">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-2xl">Agent EMI Collections</CardTitle>
        <CardDescription>Select a customer to view loan details and record payments. Filter by branch if needed.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="branch-select" className="block text-sm font-medium text-foreground">Filter by Branch</label>
              <Select onValueChange={handleBranchSelect} value={selectedBranchCode}>
                <SelectTrigger id="branch-select" className="w-full">
                    <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-branches">All Branches</SelectItem>
                  {availableBranches.length > 0 ? (
                    availableBranches.map(branch => (
                      <SelectItem key={branch.branchCode} value={branch.branchCode}>
                        {branch.branchCode} - {branch.branchName} ({branch.branchType})
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground text-center">No branches available.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
                <label htmlFor="customer-search" className="block text-sm font-medium text-foreground">Search Customers</label>
                 <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customer-search"
                      type="search"
                      placeholder="Search by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-full"
                    />
                </div>
            </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><Users className="h-5 w-5 text-primary" /> Customers</h3>
            {filteredCustomersInBranch.length > 0 ? (
            <ScrollArea className="h-[250px] border rounded-md p-2 bg-slate-50/50">
                <div className="space-y-2">
                {filteredCustomersInBranch.map(customer => (
                    <Card
                    key={customer.id}
                    onClick={() => handleCustomerSelect(customer)}
                    className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${selectedCustomer?.id === customer.id ? 'ring-2 ring-primary bg-primary/10' : 'bg-card'}`}
                    >
                    <div className="font-semibold">{customer.customerName} <span className="text-xs text-muted-foreground">({customer.id})</span></div>
                    {getParentSpouseDetails(customer)}
                    </Card>
                ))}
                </div>
            </ScrollArea>
            ) : (
                <Alert variant="default" className="bg-blue-50/70 border-blue-200 text-blue-700">
                    <Info className="h-5 w-5 !text-blue-600" />
                    <AlertTitle>No Customers Found</AlertTitle>
                    <AlertDescription>
                        {searchTerm && 'No customers match your search criteria.'}
                        {!searchTerm && selectedBranchCode !== 'all-branches' && 'No customers with active loans found for this branch.'}
                        {!searchTerm && selectedBranchCode === 'all-branches' && 'There are no customers with approved loans in the system.'}
                    </AlertDescription>
                </Alert>
            )}
        </div>

        {selectedCustomer && detailedSelectedCustomer && (
          <>
            <hr className="my-6" />
            <CustomerLoanSummary customer={detailedSelectedCustomer} branches={branches} />
            
            <hr className="my-6" />
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <h3 className="text-lg font-semibold">Payment History for {selectedCustomer.customerName}</h3>
                <Button onClick={handleOpenModalForNew} disabled={isLoading || !selectedCustomer} className="w-full sm:w-auto">
                  Record Collected Amount
                </Button>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center h-60 border rounded-md">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2">Loading payment history...</p>
                </div>
              ) : (
                <EmiCollectionTable 
                    payments={paymentHistory} 
                    isAdmin={isAdmin}
                    onEdit={handleOpenModalForEdit}
                    onDelete={(paymentId) => setPaymentToDeleteId(paymentId)}
                />
              )}
            </div>
          </>
        )}

        {detailedSelectedCustomer && (
            <EmiCollectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                customer={detailedSelectedCustomer}
                paymentToEdit={paymentToEdit}
                onPaymentSuccess={onPaymentSuccess}
            />
        )}
      </CardContent>
    </Card>
    <AlertDialog open={!!paymentToDeleteId} onOpenChange={(open) => !open && setPaymentToDeleteId(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the selected payment record and recalculate the customer's loan balance.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPaymentToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayment}>
                Yes, delete payment
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default AgentCollections;

    
