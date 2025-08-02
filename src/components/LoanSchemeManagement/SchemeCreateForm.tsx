
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
  FormDescription,
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
import { useEffect } from 'react';

const loanSchemeSchema = z.object({
  schemeName: z.string().min(2, {
    message: 'Scheme Name must be at least 2 characters.',
  }),
  loanType: z.string().min(1, { message: 'Loan Type is required.' }),
  interestRate: z.coerce.number({invalid_type_error: "Must be a number"}).min(0, { message: 'Interest Rate cannot be negative.' }),
  processingFee: z.coerce.number({invalid_type_error: "Must be a number"}).min(0, { message: 'Processing Fee cannot be negative.' }),
  otherCharges: z.coerce.number({invalid_type_error: "Must be a number"}).min(0, { message: 'Other Charges cannot be negative.' }).optional(),
  loanPeriod: z.string().min(1, { message: 'Loan Period is required.' }),
  repaymentMode: z.enum(['Daily', 'Weekly', 'Monthly']),
  lateFine: z.coerce.number({invalid_type_error: "Must be a number"}).min(0, { message: 'Late Fine cannot be negative.' }),
});

export type LoanSchemeFormValues = z.infer<typeof loanSchemeSchema>;

interface SchemeCreateFormProps {
  onSubmit: (values: LoanSchemeFormValues) => void;
  editingScheme?: LoanSchemeFormValues | null;
  onCancelEdit?: () => void;
}

const SchemeCreateForm = ({onSubmit, editingScheme, onCancelEdit}: SchemeCreateFormProps) => {
  const loanSchemeForm = useForm<LoanSchemeFormValues>({
    resolver: zodResolver(loanSchemeSchema),
    defaultValues: {
      schemeName: '',
      loanType: '',
      interestRate: '' as any, // Initialize as empty string to be a controlled component
      processingFee: '' as any,
      otherCharges: '' as any,
      loanPeriod: '',
      repaymentMode: 'Daily',
      lateFine: '' as any,
    },
  });

  useEffect(() => {
    if (editingScheme) {
      loanSchemeForm.reset(editingScheme);
    } else {
      loanSchemeForm.reset({
        schemeName: '',
        loanType: '',
        interestRate: '' as any,
        processingFee: '' as any,
        otherCharges: '' as any,
        loanPeriod: '',
        repaymentMode: 'Daily',
        lateFine: '' as any,
      });
    }
  }, [editingScheme, loanSchemeForm]);

  function handleFormSubmit(values: LoanSchemeFormValues) {
    onSubmit(values);
  }

  const isEditing = !!editingScheme;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Loan Scheme' : 'Create Loan Scheme'}</CardTitle>
        <CardDescription>
          {isEditing ? 'Modify the details of the existing loan scheme.' : 'Fill in the details for the new loan scheme.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...loanSchemeForm}>
          <form onSubmit={loanSchemeForm.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={loanSchemeForm.control}
              name="schemeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheme Name (योजना का नाम)</FormLabel>
                  <FormControl>
                    <Input placeholder="Scheme Name" {...field} disabled={isEditing} />
                  </FormControl>
                  {isEditing && <FormDescription className="text-xs">Scheme Name cannot be changed during edit.</FormDescription>}
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
                    <Input placeholder="E.g., Personal, Business" {...field} />
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
                    <Input type="number" placeholder="E.g., 12" {...field} />
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
                    <Input type="number" placeholder="E.g., 500" {...field} />
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
                  <FormLabel>Other Charges (₹) (Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="E.g., 100" {...field} />
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
                  <FormLabel>Loan Period (e.g., "12 Months", "52 Weeks", "365 Days")</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., 12 Months" {...field} />
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
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex flex-col space-y-1 sm:flex-row sm:space-x-4 sm:space-y-0"
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
                    <Input type="number" placeholder="E.g., 50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex space-x-2">
              <Button type="submit">{isEditing ? 'Update Scheme' : 'Create Loan Scheme'}</Button>
              {isEditing && onCancelEdit && (
                <Button type="button" variant="outline" onClick={onCancelEdit}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SchemeCreateForm;
