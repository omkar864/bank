
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';

const loanSchemeSchema = z.object({
  schemeName: z.string().min(2, {
    message: 'Scheme Name must be at least 2 characters.',
  }),
  loanType: z.string(),
  interestRate: z.string(),
  processingFee: z.string(),
  otherCharges: z.string(),
  loanPeriod: z.string(),
  repaymentMode: z.enum(['Daily', 'Weekly', 'Monthly']),
  lateFine: z.string(),
});

export type LoanSchemeFormValues = z.infer<typeof loanSchemeSchema>;

interface SchemeCreateFormProps {
  onSubmit: (values: LoanSchemeFormValues) => void;
}

const SchemeCreateForm = ({onSubmit}: SchemeCreateFormProps) => {
  const loanSchemeForm = useForm<LoanSchemeFormValues>({
    resolver: zodResolver(loanSchemeSchema),
    defaultValues: {
      schemeName: '',
      loanType: '',
      interestRate: '',
      processingFee: '',
      otherCharges: '',
      loanPeriod: '',
      repaymentMode: 'Daily',
      lateFine: '',
    },
  });

  function onSchemeSubmit(values: LoanSchemeFormValues) {
    onSubmit(values);
    loanSchemeForm.reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Loan Scheme</CardTitle>
        <CardDescription>Fill in the details for the new loan scheme.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...loanSchemeForm}>
          <form onSubmit={loanSchemeForm.handleSubmit(onSchemeSubmit)} className="space-y-4">
            <FormField
              control={loanSchemeForm.control}
              name="schemeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheme Name (योजना का नाम)</FormLabel>
                  <FormControl>
                    <Input placeholder="Scheme Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loanSchemeForm.control}
              name="loanType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Type (ऋण प्रकार)</FormLabel>
                  <FormControl>
                    <Input placeholder="Loan Type" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loanSchemeForm.control}
              name="interestRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest Rate (%)</FormLabel>
                  <FormControl>
                    <Input placeholder="Interest Rate" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loanSchemeForm.control}
              name="processingFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processing Fee (₹)</FormLabel>
                  <FormControl>
                    <Input placeholder="Processing Fee" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loanSchemeForm.control}
              name="otherCharges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other Charges (₹)</FormLabel>
                  <FormControl>
                    <Input placeholder="Other Charges" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loanSchemeForm.control}
              name="loanPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Period</FormLabel>
                  <FormControl>
                    <Input placeholder="Loan Period" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loanSchemeForm.control}
              name="repaymentMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repayment Mode</FormLabel>
                  <FormControl>
                    <RadioGroup
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <RadioGroupItem value="Daily" id="daily-scheme" />
                        <FormLabel htmlFor="daily-scheme">Daily</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <RadioGroupItem value="Weekly" id="weekly-scheme" />
                        <FormLabel htmlFor="weekly-scheme">Weekly</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <RadioGroupItem value="Monthly" id="monthly-scheme" />
                        <FormLabel htmlFor="monthly-scheme">Monthly</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loanSchemeForm.control}
              name="lateFine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Late Fine (₹ per missed payment)</FormLabel>
                  <FormControl>
                    <Input placeholder="Late Fine" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Create Loan Scheme</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SchemeCreateForm;
