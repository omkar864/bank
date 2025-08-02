
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { TrendingUp, TrendingDown, Minus, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface DailyReportEntry {
  date: string;
  collectedToday: number;
  expectedToday: number;
}

interface DailyCollectionReportProps {
  data: DailyReportEntry[];
  isLoading: boolean;
  onRefresh: () => void;
}

const DailyCollectionReport = ({ data, isLoading, onRefresh }: DailyCollectionReportProps) => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Daily Collection Report</CardTitle>
            <CardDescription>
              A summary of expected vs. actual collections for the last 30 days.
            </CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="sr-only">Refresh Report</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] w-full rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead className="text-right">Expected (₹)</TableHead>
                <TableHead className="text-right">Collected (₹)</TableHead>
                <TableHead className="text-right">Variance (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">Loading report...</p>
                  </TableCell>
                </TableRow>
              ) : data && data.length > 0 ? (
                data.map((entry) => {
                  const variance = entry.collectedToday - entry.expectedToday;
                  const isPositive = variance >= 0;
                  const isZero = variance === 0;

                  return (
                    <TableRow key={entry.date}>
                      <TableCell className="font-medium">{entry.date}</TableCell>
                      <TableCell className="text-right">
                        {entry.expectedToday.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.collectedToday.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            'flex items-center justify-end gap-1 font-mono',
                            isPositive && !isZero && 'text-green-600 border-green-500/50 bg-green-50/50',
                            !isPositive && !isZero && 'text-red-600 border-red-500/50 bg-red-50/50'
                          )}
                        >
                          {isZero ? (
                             <Minus className="h-3.5 w-3.5" />
                          ) : isPositive ? (
                            <TrendingUp className="h-3.5 w-3.5" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5" />
                          )}
                          {variance.toLocaleString('en-IN')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                 <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No collection data available for the selected period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DailyCollectionReport;
