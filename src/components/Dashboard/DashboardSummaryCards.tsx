'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IndianRupee, Users, FileText, CheckCircle, XCircle } from "lucide-react";

interface DashboardSummaryCardsProps {
  totalLoanAmount: number;
  activeLoansCount: number;
  pendingApplicationsCount: number;
  approvedThisMonthCount: number;
  rejectedThisMonthCount: number;
}

const DashboardSummaryCards = ({
  totalLoanAmount,
  activeLoansCount,
  pendingApplicationsCount,
  approvedThisMonthCount,
  rejectedThisMonthCount,
}: DashboardSummaryCardsProps) => {
  const summaryData = [
    { title: "Total Loan Amount Disbursed", value: `₹${totalLoanAmount.toLocaleString('en-IN')}`, icon: IndianRupee, color: "text-primary" },
    { title: "Active Loans", value: activeLoansCount.toString(), icon: Users, color: "text-blue-500" },
    { title: "Pending Applications", value: pendingApplicationsCount.toString(), icon: FileText, color: "text-yellow-500" },
    { title: "Approved This Month", value: approvedThisMonthCount.toString(), icon: CheckCircle, color: "text-green-600" },
    { title: "Rejected This Month", value: rejectedThisMonthCount.toString(), icon: XCircle, color: "text-red-600" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {summaryData.map((item, index) => (
        <Card key={index} className="shadow-md hover:shadow-lg transition-shadow rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
            <item.icon className={`h-5 w-5 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
             <p className="text-xs text-muted-foreground mt-1">
              {index === 0 ? 'Total for all approved loans' : index === 2 ? 'Awaiting admin review' : 'Live count'}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardSummaryCards;
