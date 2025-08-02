
// src/components/AgentCollections/EmiCollectionTable.tsx
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { PaymentRecord } from './types';
import { cn } from '@/lib/utils';
import { Banknote, FileText, Edit, Trash2, Clock } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import { Button } from '../ui/button';

interface EmiCollectionTableProps {
  payments: PaymentRecord[];
  isAdmin: boolean;
  onEdit: (payment: PaymentRecord) => void;
  onDelete: (paymentId: string) => void;
}

const EmiCollectionTable = ({ payments, isAdmin, onEdit, onDelete }: EmiCollectionTableProps) => {

  const formatDate = (dateValue?: Timestamp | string): string => {
    if (!dateValue) return 'N/A';
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue.toDate();
    return date.toLocaleDateString();
  }

  const formatTimestamp = (dateValue?: Timestamp | string): string => {
      if (!dateValue) return 'N/A';
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue.toDate();
      return date.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
  };

  if (!payments || payments.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-60 border rounded-md bg-muted/30">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No Payment History</h3>
            <p className="text-sm text-muted-foreground">This customer has not made any payments yet.</p>
        </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] w-full border rounded-md bg-background">
      <Table>
        <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10">
          <TableRow>
            <TableHead className="px-3 py-2 text-xs w-[120px]">Payment Date</TableHead>
            <TableHead className="text-right px-3 py-2 text-xs w-[100px]">Amount (₹)</TableHead>
            <TableHead className="text-right px-3 py-2 text-xs w-[100px]">Fine (₹)</TableHead>
            <TableHead className="px-3 py-2 text-xs w-[100px]">Mode</TableHead>
            <TableHead className="px-3 py-2 text-xs">Remarks</TableHead>
            {isAdmin && <TableHead className="text-right px-3 py-2 text-xs w-[120px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id} className="hover:bg-muted/50 group">
              <TableCell className="font-medium text-xs px-3 py-2">
                <div>{formatDate(payment.collectionDate)}</div>
                <div className="text-muted-foreground flex items-center gap-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                    <Clock className="h-2.5 w-2.5" />
                    {formatTimestamp(payment.collectionTimestamp)}
                </div>
              </TableCell>
              <TableCell className="text-right text-green-700 font-semibold text-xs px-3 py-2">
                {payment.amountPaid.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </TableCell>
              <TableCell className="text-right text-orange-600 font-semibold text-xs px-3 py-2">
                {(payment.fine || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </TableCell>
              <TableCell className="px-3 py-2">
                 <Badge 
                    variant="outline"
                    className="text-xs px-1.5 py-0.5"
                  >
                    <div className="flex items-center gap-1">
                     <Banknote className="h-3 w-3" />
                     {payment.paymentMode}
                    </div>
                  </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground truncate max-w-[200px] px-3 py-2">
                {payment.remarks || '-'}
              </TableCell>
              {isAdmin && (
                <TableCell className="text-right px-3 py-2">
                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onEdit(payment)}>
                            <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="destructive" size="icon" className="h-6 w-6" onClick={() => onDelete(payment.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

export default EmiCollectionTable;
