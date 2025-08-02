
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Loader2, IndianRupee, TrendingUp, TrendingDown, Users, CheckCircle, XCircle, Eye, UserCircle, Download, FileText, UserCircle2 } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';

import type { Branch } from '@/components/BranchManagement/BranchManagement';
import type { LoanApplicationData } from '@/components/LoanApplication/LoanApplication';
import type { StoredUser } from '@/components/UserManagement/UserManagement';
import type { PaymentRecord, ReportData, CustomerReportInfo } from './types';


interface BranchCollectionReportProps {
  branches: Branch[];
  allLoans: LoanApplicationData[];
  allUsers: StoredUser[];
}

const DetailItem = ({ label, value, isHindi = false }: { label: string, value?: string | number | null, isHindi?: boolean }) => {
    if (value === undefined || value === null || value === '') return null;
    return (
      <div>
        <span className={`block text-xs font-medium ${isHindi ? 'text-sky-600' : 'text-muted-foreground'}`}>{label}</span>
        <span className={`block text-sm ${isHindi ? 'font-devanagari' : ''}`}>{value || 'N/A'}</span>
      </div>
    );
};


const BranchCollectionReport = ({ branches, allLoans, allUsers }: BranchCollectionReportProps) => {
  const [selectedBranchCode, setSelectedBranchCode] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [customerToViewHistory, setCustomerToViewHistory] = useState<CustomerReportInfo | null>(null);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [customerPaymentHistory, setCustomerPaymentHistory] = useState<PaymentRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [customerToViewProfile, setCustomerToViewProfile] = useState<LoanApplicationData | null>(null);


  const generateReport = useCallback(async (branchCode: string, date: Date) => {
    setIsLoading(true);
    setReportData(null);

    const targetDayStart = startOfDay(date);
    
    const loansInBranch = branchCode === 'all'
      ? allLoans.filter(loan => loan.status === 'Approved')
      : allLoans.filter(loan => loan.status === 'Approved' && (loan.assignedBranchCode === branchCode || loan.assignedSubBranchCode === branchCode));
    
    if (loansInBranch.length === 0) {
      setReportData({ paidCustomers: [], pendingCustomers: [], collected: 0, expected: 0 });
      setIsLoading(false);
      return;
    }

    const paymentPromises = loansInBranch.map(loan => {
        const paymentsQuery = query(
            collection(db, `loanApplications/${loan.id}/payments`),
            where('collectionDate', '>=', targetDayStart),
            where('collectionDate', '<', new Date(targetDayStart.getTime() + 24 * 60 * 60 * 1000))
        );
        return getDocs(paymentsQuery);
    });

    try {
        const paymentSnapshots = await Promise.all(paymentPromises);
        const paymentsToday: (PaymentRecord & { loanId: string })[] = [];
        paymentSnapshots.forEach((snapshot, index) => {
            snapshot.forEach(doc => {
                paymentsToday.push({ loanId: loansInBranch[index].id, id: doc.id, ...doc.data() } as PaymentRecord & { loanId: string });
            });
        });

        const paidLoanIds = new Set(paymentsToday.map(p => p.loanId));
        let totalCollected = 0;
        let totalExpected = 0;

        const paidCustomers = loansInBranch
            .filter(loan => paidLoanIds.has(loan.id))
            .map(loan => {
                const paymentsForThisLoan = paymentsToday.filter(p => p.loanId === loan.id);
                const collectedForThisLoan = paymentsForThisLoan.reduce((sum, p) => sum + p.amountPaid + (p.fine || 0), 0);
                totalCollected += collectedForThisLoan;
                const collector = allUsers.find(u => u.id === paymentsForThisLoan[0]?.collectedByUid);
                return { ...loan, collectedAmount: collectedForThisLoan, collectorName: collector?.fullName || 'N/A' };
            });

        const pendingCustomers = loansInBranch.filter(loan => !paidLoanIds.has(loan.id));
        
        loansInBranch.forEach(loan => {
            const emiAmount = parseFloat(loan.dailyEMI || '0');
            if (emiAmount > 0) totalExpected += emiAmount;
        });

        setReportData({ paidCustomers, pendingCustomers, collected: totalCollected, expected: totalExpected });

    } catch (error: any) {
        console.error("Error generating report:", error);
        toast({ title: 'Report Generation Failed', description: error.message, variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  }, [allLoans, allUsers, toast]);

  useEffect(() => {
    generateReport(selectedBranchCode, selectedDate);
  }, [selectedBranchCode, selectedDate, generateReport]);

  const handleBranchChange = (code: string) => {
    setSelectedBranchCode(code);
  };

  const handleDateChange = (date?: Date) => {
    if (date) {
      setSelectedDate(startOfDay(date));
    }
  };
  
  const handleViewCustomerHistory = async (customer: CustomerReportInfo) => {
    setCustomerToViewHistory(customer);
    setIsHistorySheetOpen(true);
    setIsLoadingHistory(true);
    try {
        const paymentsQuery = query(
            collection(db, 'loanApplications', customer.id, 'payments'),
            orderBy('collectionDate', 'desc')
        );
        const querySnapshot = await getDocs(paymentsQuery);
        const payments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentRecord));
        setCustomerPaymentHistory(payments);
    } catch (error: any) {
        toast({ title: "Error", description: "Could not fetch payment history.", variant: "destructive" });
    } finally {
        setIsLoadingHistory(false);
    }
  };

  const handleViewFullProfile = (customer: LoanApplicationData) => {
    setCustomerToViewProfile(customer);
    setIsProfileSheetOpen(true);
    setIsHistorySheetOpen(false); // Close history sheet if open
  };
  
  const getLoanApprovalDate = (timestamp: LoanApplicationData['approvalDate']): string => {
    if (!timestamp) return 'N/A';
    const date = (typeof timestamp === 'string') ? new Date(timestamp) : (timestamp as any)?.toDate ? (timestamp as any).toDate() : new Date((timestamp as any).seconds * 1000);
    return date.toLocaleDateString('en-IN');
  };

  const calculateLoanDetails = (loan: LoanApplicationData) => {
    const loanAmountApproved = parseFloat(loan.loanAmountApproved || loan.loanAmountRequired || '0');
    const interestRate = parseFloat(loan.interestRate || '0') / 100;
    const totalInterest = loanAmountApproved * interestRate;
    const totalLoanAmountWithInterest = loanAmountApproved + totalInterest;
    const totalAmountPaid = loan.totalAmountPaid || 0;
    const amountPending = totalLoanAmountWithInterest - totalAmountPaid;
    return { totalLoanAmountWithInterest, totalAmountPaid, amountPending };
  };

  const getBranchName = (branchCode?: string, subBranchCode?: string): string => {
    if (subBranchCode) {
      const subBranch = branches.find(b => b.branchCode === subBranchCode);
      if (subBranch) {
        const parent = branches.find(p => p.branchCode === subBranch.parentBranch);
        return `${subBranch.branchName} (Sub of ${parent?.branchName || 'N/A'})`;
      }
    }
    if (branchCode) {
      const branch = branches.find(b => b.branchCode === branchCode);
      return branch ? `${branch.branchName}` : 'N/A';
    }
    return 'N/A';
  };

  const calculateAge = (dobString?: string): string => {
    if (!dobString) return 'N/A';
    try {
      const birthDate = new Date(dobString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 0 ? age.toString() : 'N/A';
    } catch (e) {
      return 'N/A';
    }
  };

  const handleDocumentPreview = (documentUrl?: string, documentName?: string) => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    } else {
      toast({
        title: "Document Not Available",
        description: `The URL for ${documentName || 'this document'} is missing.`,
        variant: "destructive",
      });
    }
  };

  return (
    <>
    <Card className="shadow-lg rounded-xl">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-2xl">Branch-wise Collection Report</CardTitle>
        <CardDescription>Select a branch and date to view detailed collection summary and status.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="branch-select" className="text-sm font-medium">Branch</label>
            <Select onValueChange={handleBranchChange} value={selectedBranchCode}>
              <SelectTrigger id="branch-select">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.filter(b => b.branchType === 'Branch').map(branch => (
                  <SelectItem key={branch.branchCode} value={branch.branchCode}>
                    {branch.branchCode} - {branch.branchName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="date-picker" className="text-sm font-medium">Report Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selectedDate} onSelect={handleDateChange} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : reportData ? (
          <div className="space-y-8">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-lg">Collection Summary for {format(selectedDate, "PPP")}</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center space-x-4 rounded-md border p-4">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Collected</p>
                    <p className="text-2xl font-bold">₹{reportData.collected.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 rounded-md border p-4">
                  <IndianRupee className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Expected</p>
                    <p className="text-2xl font-bold">₹{reportData.expected.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                 <div className="flex items-center space-x-4 rounded-md border p-4">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Pending</p>
                    <p className="text-2xl font-bold">₹{(reportData.expected - reportData.collected).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700"><CheckCircle /> Paid Today ({reportData.paidCustomers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Collected By</TableHead>
                          <TableHead className="text-right">Amount (₹)</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.paidCustomers.map(cust => (
                          <TableRow key={cust.id}>
                            <TableCell>{cust.customerName}</TableCell>
                            <TableCell>{cust.collectorName}</TableCell>
                            <TableCell className="text-right font-medium">{cust.collectedAmount?.toLocaleString('en-IN')}</TableCell>
                            <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleViewCustomerHistory(cust)}><Eye className="h-4 w-4"/></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700"><XCircle /> Pending Today ({reportData.pendingCustomers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Mobile</TableHead>
                          <TableHead className="text-right">EMI (₹)</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.pendingCustomers.map(cust => (
                          <TableRow key={cust.id} className="bg-red-50/50 hover:bg-red-50/70">
                            <TableCell className="font-medium">{cust.customerName}</TableCell>
                            <TableCell>{cust.mobileNumber}</TableCell>
                            <TableCell className="text-right font-medium">{parseFloat(cust.dailyEMI || '0').toLocaleString('en-IN')}</TableCell>
                             <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleViewCustomerHistory(cust)}><Eye className="h-4 w-4"/></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10">Select a branch and date to generate a report.</div>
        )}
      </CardContent>
    </Card>

    <Sheet open={isHistorySheetOpen} onOpenChange={setIsHistorySheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 flex flex-col">
          {customerToViewHistory && (
            <>
              <SheetHeader className="p-6 bg-muted text-foreground border-b">
                <SheetTitle className="text-xl md:text-2xl flex items-center gap-3">
                    <UserCircle className="h-8 w-8 text-primary" />
                    {customerToViewHistory.customerName}'s Loan History
                </SheetTitle>
                <SheetDescription>Loan ID: {customerToViewHistory.id}</SheetDescription>
              </SheetHeader>
              <div className="flex-grow overflow-y-auto">
                <div className="p-6 space-y-6">
                    {/* Loan Summary Header */}
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Loan Summary</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="space-y-1"><p className="text-xs text-muted-foreground">Total Loan Amount</p><p className="font-semibold">₹{calculateLoanDetails(customerToViewHistory).totalLoanAmountWithInterest.toLocaleString('en-IN')}</p></div>
                            <div className="space-y-1"><p className="text-xs text-muted-foreground">Total Amount Paid</p><p className="font-semibold text-green-600">₹{calculateLoanDetails(customerToViewHistory).totalAmountPaid.toLocaleString('en-IN')}</p></div>
                            <div className="space-y-1"><p className="text-xs text-muted-foreground">Total Pending</p><p className="font-semibold text-red-600">₹{calculateLoanDetails(customerToViewHistory).amountPending.toLocaleString('en-IN')}</p></div>
                            <div className="space-y-1"><p className="text-xs text-muted-foreground">Loan Approval Date</p><p className="font-semibold">{getLoanApprovalDate(customerToViewHistory.approvalDate)}</p></div>
                        </CardContent>
                    </Card>

                    {/* Payment History Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Payment History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoadingHistory ? (
                                <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin"/></div>
                            ) : customerPaymentHistory.length > 0 ? (
                                <ScrollArea className="h-[400px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>Collected By</TableHead>
                                            <TableHead className="text-right">Amount (₹)</TableHead>
                                            <TableHead className="text-right">Fine (₹)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {customerPaymentHistory.map(payment => {
                                            const collector = allUsers.find(u => u.id === payment.collectedByUid);
                                            const collectionDate = (payment.collectionDate as any)?.toDate ? (payment.collectionDate as any).toDate() : new Date(payment.collectionDate as string);
                                            return (
                                                <TableRow key={payment.id}>
                                                    <TableCell>{collectionDate.toLocaleString('en-IN')}</TableCell>
                                                    <TableCell>{collector?.fullName || 'N/A'}</TableCell>
                                                    <TableCell className="text-right font-medium">{payment.amountPaid.toLocaleString('en-IN')}</TableCell>
                                                    <TableCell className="text-right">{(payment.fine || 0).toLocaleString('en-IN')}</TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                                </ScrollArea>
                            ) : (
                                <div className="text-center text-muted-foreground py-10">
                                    <FileText className="mx-auto h-12 w-12 mb-2" />
                                    No payment history found.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
              </div>
              <SheetFooter className="p-6 border-t bg-background">
                <Button variant="outline" onClick={() => handleViewFullProfile(customerToViewHistory)}>View Full Customer Profile</Button>
                <SheetClose asChild>
                  <Button type="button">Close</Button>
                </SheetClose>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={isProfileSheetOpen} onOpenChange={setIsProfileSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 flex flex-col">
            {customerToViewProfile && (
              <>
                <SheetHeader className="p-6 bg-muted text-foreground border-b">
                  <SheetTitle className="text-xl md:text-2xl">
                    {customerToViewProfile.customerName}
                    {customerToViewProfile.customerNameHindi && ` / ${customerToViewProfile.customerNameHindi}`}
                  </SheetTitle>
                  <SheetDescription className="text-muted-foreground">Full Customer Profile (ID: {customerToViewProfile.id})</SheetDescription>
                </SheetHeader>
                <ScrollArea className="flex-grow">
                  <div className="p-6 space-y-6">
                    <Card className="shadow-lg rounded-lg">
                      <CardHeader className="border-b bg-muted/30 p-4"><CardTitle className="text-lg">1. Personal Details (व्यक्तिगत जानकारी)</CardTitle></CardHeader>
                      <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <DetailItem label="Name (English)" value={customerToViewProfile.customerName} />
                        <DetailItem label="नाम (हिन्दी)" value={customerToViewProfile.customerNameHindi} isHindi />
                        <DetailItem label="Date of Birth" value={customerToViewProfile.dateOfBirth ? new Date(customerToViewProfile.dateOfBirth).toLocaleDateString() : 'N/A'} />
                        <DetailItem label="Age" value={calculateAge(customerToViewProfile.dateOfBirth)} />
                        <DetailItem label="Gender" value={customerToViewProfile.gender} />
                        <DetailItem label="Father's Name" value={customerToViewProfile.fatherName} />
                        <DetailItem label="पिता का नाम (हिन्दी)" value={customerToViewProfile.fatherNameHindi} isHindi />
                        <DetailItem label="Mother's Name" value={customerToViewProfile.motherName} />
                        <DetailItem label="माता का नाम (हिन्दी)" value={customerToViewProfile.motherNameHindi} isHindi />
                        <DetailItem label="Spouse's Name" value={customerToViewProfile.husbandWifeName} />
                        <DetailItem label="पति/पत्नी का नाम (हिन्दी)" value={customerToViewProfile.husbandWifeNameHindi} isHindi />
                        <DetailItem label="Mobile Number" value={customerToViewProfile.mobileNumber} />
                        <DetailItem label="Alternate Contact" value={customerToViewProfile.alternateMobileNumber} />
                        <div className="md:col-span-2"><DetailItem label="Residential Address" value={customerToViewProfile.residentialAddress} /></div>
                        <div className="md:col-span-2"><DetailItem label="आवासीय पता (हिन्दी)" value={customerToViewProfile.residentialAddressHindi} isHindi /></div>
                        <div className="md:col-span-2"><DetailItem label="Permanent Address" value={customerToViewProfile.permanentAddress} /></div>
                        <div className="md:col-span-2"><DetailItem label="स्थायी पता (हिन्दी)" value={customerToViewProfile.permanentAddressHindi} isHindi /></div>
                        <div className="md:col-span-2"><DetailItem label="Branch Assignment" value={getBranchName(customerToViewProfile.assignedBranchCode, customerToViewProfile.assignedSubBranchCode)} /></div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg rounded-lg">
                      <CardHeader className="border-b bg-muted/30 p-4"><CardTitle className="text-lg">2. Loan Details (ऋण विवरण)</CardTitle></CardHeader>
                      <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          <DetailItem label="Loan ID" value={customerToViewProfile.id} />
                          <DetailItem label="Sanctioned Amount" value={`₹${(customerToViewProfile.loanAmountApproved || customerToViewProfile.loanAmountRequired)?.toLocaleString('en-IN')}`} />
                          <DetailItem label="Loan Scheme" value={customerToViewProfile.loanScheme} />
                          <DetailItem label="Interest Rate" value={`${customerToViewProfile.interestRate || 'N/A'}%`} />
                          <DetailItem label="Processing Fee" value={`₹${customerToViewProfile.processingFee?.toLocaleString('en-IN') || 'N/A'}`} />
                          <DetailItem label="Late Fine/Other Charges" value={`₹${customerToViewProfile.lateFine?.toLocaleString('en-IN') || 'N/A'}`} />
                          <DetailItem label="EMI Type" value={customerToViewProfile.repaymentType} />
                          <DetailItem label="EMI Amount" value={`₹${
                              (customerToViewProfile.repaymentType === 'Daily' ? customerToViewProfile.dailyEMI :
                              customerToViewProfile.repaymentType === 'Weekly' ? customerToViewProfile.weeklyEMI :
                              customerToViewProfile.repaymentType === 'Monthly' ? customerToViewProfile.monthlyEMI : 'N/A')?.toLocaleString('en-IN')}`} />
                          <DetailItem label="Loan Duration" value={`${customerToViewProfile.tenurePeriod || 'N/A'} ${customerToViewProfile.repaymentType ? (customerToViewProfile.repaymentType === 'Daily' ? 'Days' : customerToViewProfile.repaymentType === 'Weekly' ? 'Weeks' : 'Months') : ''}`} />
                          <DetailItem label="Approval Date" value={customerToViewProfile.approvalDate ? new Date(customerToViewProfile.approvalDate as any).toLocaleDateString() : 'N/A'} />
                          <DetailItem label="Total Loan (incl. interest)" value={`₹ ${calculateLoanDetails(customerToViewProfile).totalLoanAmountWithInterest.toLocaleString('en-IN')}`} />
                          <DetailItem label="Total Paid" value={`₹ ${calculateLoanDetails(customerToViewProfile).totalAmountPaid.toLocaleString('en-IN')}`} />
                          <DetailItem label="Total Remaining" value={`₹ ${calculateLoanDetails(customerToViewProfile).amountPending.toLocaleString('en-IN')}`} />
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg rounded-lg">
                      <CardHeader className="border-b bg-muted/30 p-4"><CardTitle className="text-lg">3. Guarantor Information (जमानतकर्ता जानकारी)</CardTitle></CardHeader>
                      <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <DetailItem label="Full Name" value={customerToViewProfile.guarantorName} />
                        <DetailItem label="Contact Number" value={customerToViewProfile.guarantorMobileNumber} />
                        <DetailItem label="Document Name" value={customerToViewProfile.guarantorDocumentType} />
                        <DetailItem label="Document Number" value={customerToViewProfile.guarantorDocumentNumber} />
                        <div className="md:col-span-2"><DetailItem label="Address" value={customerToViewProfile.guarantorAddress} /></div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg rounded-lg">
                      <CardHeader className="border-b bg-muted/30 p-4"><CardTitle className="text-lg">4. Documents (दस्तावेज़)</CardTitle></CardHeader>
                      <CardContent className="p-4 md:p-6 space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                          <div>
                            <p className="font-medium">{customerToViewProfile.identityDocumentType || 'Identity Document'}</p>
                            <p className="text-xs text-muted-foreground">{customerToViewProfile.identityDocumentNumber || 'N/A'}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleDocumentPreview(customerToViewProfile.identityDocumentFileUrl, customerToViewProfile.identityDocumentType)}>
                              <Download className="mr-1.5 h-4 w-4" /> Preview
                          </Button>
                        </div>
                         <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                          <div>
                            <p className="font-medium">{customerToViewProfile.addressProofDocumentType || 'Address Proof'}</p>
                            <p className="text-xs text-muted-foreground">{customerToViewProfile.addressProofDocumentNumber || 'N/A'}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleDocumentPreview(customerToViewProfile.addressProofDocumentFileUrl, customerToViewProfile.addressProofDocumentType)}>
                              <Download className="mr-1.5 h-4 w-4" /> Preview
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                          <div>
                            <p className="font-medium">{customerToViewProfile.guarantorDocumentType || 'Guarantor Document'}</p>
                            <p className="text-xs text-muted-foreground">{customerToViewProfile.guarantorDocumentNumber || 'N/A'}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleDocumentPreview(customerToViewProfile.guarantorDocumentFileUrl, customerToViewProfile.guarantorDocumentType)}>
                              <Download className="mr-1.5 h-4 w-4" /> Preview
                          </Button>
                        </div>
                        <div className="flex items-start justify-between p-3 border rounded-md hover:bg-muted/50">
                          <div>
                            <p className="font-medium">Customer Photo</p>
                            <img id="customer-profile-photo" src={customerToViewProfile.customerPhotoUrl || "https://placehold.co/100x100.png"} alt="Customer" className="mt-2 h-20 w-20 rounded-md border object-cover" data-ai-hint="person photo"/>
                          </div>
                           <Button variant="outline" size="sm" onClick={() => handleDocumentPreview(customerToViewProfile.customerPhotoUrl, 'Customer Photo')}>
                              <Download className="mr-1.5 h-4 w-4" /> View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
                <SheetFooter className="p-6 border-t bg-background">
                  <SheetClose asChild><Button type="button" variant="outline">Close Profile</Button></SheetClose>
                </SheetFooter>
              </>
            )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default BranchCollectionReport;
