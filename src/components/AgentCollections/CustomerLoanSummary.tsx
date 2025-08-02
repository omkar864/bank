
// src/components/AgentCollections/CustomerLoanSummary.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { CustomerLoanDetails } from './types';
import type { Branch } from '@/components/BranchManagement/BranchManagement';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, CalendarDays, TrendingDown, TrendingUp, User, Users, Landmark, Hash, Percent } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

interface CustomerLoanSummaryProps {
  customer: CustomerLoanDetails | null;
  branches: Branch[];
}

const DetailItem = ({ label, value, icon: Icon, className, valueClassName }: { label: string, value?: string | number, icon?: React.ElementType, className?: string, valueClassName?: string }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="text-xs text-muted-foreground flex items-center">
        {Icon && <Icon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />}
        {label}
      </div>
      <div className={`text-sm font-semibold ${valueClassName}`}>{value}</div>
    </div>
  );
};

const CustomerLoanSummary = ({ customer, branches }: CustomerLoanSummaryProps) => {
  if (!customer) {
    return null;
  }
  
  const getBranchName = (branchCode?: string, subBranchCode?: string): string => {
    if (subBranchCode) {
      const subBranch = branches.find(b => b.branchCode === subBranchCode);
      if (subBranch) {
        const parent = branches.find(p => p.branchCode === subBranch.parentBranch);
        return `${subBranch.branchName} (${parent?.branchName || 'N/A'})`;
      }
    }
    if (branchCode) {
      const branch = branches.find(b => b.branchCode === branchCode);
      return branch ? `${branch.branchName}` : 'N/A';
    }
    return 'N/A';
  };

  const getLoanStartDate = (timestamp: CustomerLoanDetails['approvalDate']): string => {
    if (!timestamp) return 'N/A';
    if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString('en-IN');
    }
    if (typeof (timestamp as Timestamp).toDate === 'function') {
        return (timestamp as Timestamp).toDate().toLocaleDateString('en-IN');
    }
    if ((timestamp as any).seconds) {
        return new Date((timestamp as any).seconds * 1000).toLocaleDateString('en-IN');
    }
    return 'N/A';
  }
  
  const totalAmountPaid = customer.totalAmountPaid || 0;
  const amountPending = customer.totalLoanAmountWithInterest - totalAmountPaid;

  const getParentSpouseName = (): string => {
    if (customer.husbandWifeName) return `Spouse: ${customer.husbandWifeName}`;
    if (customer.fatherName) return `Father: ${customer.fatherName}`;
    return 'N/A';
  }

  return (
    <Card className="shadow-md rounded-lg border-l-4 border-primary bg-gradient-to-br from-background to-muted/10">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-primary"/>
                <div>
                    <CardTitle className="text-xl text-primary">{customer.customerName}</CardTitle>
                    {customer.customerNameHindi && <CardDescription className="text-sm text-primary/80">{customer.customerNameHindi}</CardDescription>}
                    <CardDescription className="text-xs">Loan ID: {customer.id}</CardDescription>
                </div>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-1 mt-2 sm:mt-0">
                <Badge variant={customer.repaymentType === 'Daily' ? "default" : customer.repaymentType === 'Weekly' ? "secondary" : "outline" } className="text-xs whitespace-nowrap">
                    {customer.repaymentType} EMI
                </Badge>
                <Badge variant="outline" className="text-xs flex items-center gap-1 whitespace-nowrap">
                    <Landmark className="h-3 w-3" /> {getBranchName(customer.assignedBranchCode, customer.assignedSubBranchCode)}
                </Badge>
            </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-5 text-sm pt-2">
        <DetailItem label="Relative" value={getParentSpouseName()} icon={Users} className="col-span-2 sm:col-span-1"/>
        <DetailItem label="Mobile" value={customer.mobileNumber} />
        <DetailItem label="Address" value={customer.residentialAddress} className="col-span-2 sm:col-span-3 md:col-span-2" />

        <hr className="col-span-full my-1" />
        
        <DetailItem label="Total Loan" value={`₹ ${customer.totalLoanAmountWithInterest.toLocaleString('en-IN')}`} icon={IndianRupee} />
        <DetailItem label="Principal" value={`₹ ${customer.totalLoanPrincipal.toLocaleString('en-IN')}`} />
        <DetailItem label="Interest Amount" value={`₹ ${customer.totalInterest.toLocaleString('en-IN')}`} />
        <DetailItem label="Interest Rate" value={`${customer.interestRate}%`} icon={Percent} />
        
        <DetailItem label="EMI Amount" value={`₹ ${customer.emiAmount.toLocaleString('en-IN')}`} icon={IndianRupee} />
        <DetailItem label="Loan Start Date" value={getLoanStartDate(customer.approvalDate)} icon={CalendarDays} />
        <DetailItem label="Tenure" value={`${customer.tenurePeriod} ${customer.repaymentType === "Daily" ? "Days" : customer.repaymentType === "Weekly" ? "Weeks" : "Months" }`} />
        <DetailItem label="Loan Scheme" value={customer.loanScheme} icon={Hash} />

        <hr className="col-span-full my-1" />
        
        <DetailItem label="Amount Paid" value={`₹ ${totalAmountPaid.toLocaleString('en-IN')}`} icon={TrendingUp} valueClassName="text-green-600 font-bold" />
        <DetailItem label="Amount Pending" value={`₹ ${amountPending.toLocaleString('en-IN')}`} icon={TrendingDown} valueClassName={`${amountPending > 0 ? 'text-red-600 font-bold' : 'text-foreground'}`} />
        
      </CardContent>
    </Card>
  );
};

export default CustomerLoanSummary;
