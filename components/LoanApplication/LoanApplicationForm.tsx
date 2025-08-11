
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
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Button} from '@/components/ui/button';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Textarea} from '@/components/ui/textarea';
import {Switch} from '@/components/ui/switch';
import {Badge} from '@/components/ui/badge';
import {useEffect, useCallback} from 'react';

const loanApplicationSchema = z.object({
  customerName: z.string().min(2, {
    message: 'Customer Name must be at least 2 characters.',
  }),
  customerNameHindi: z.string(),
  dateOfBirth: z.string(),
  dateOfBirthHindi: z.string(),
  fatherName: z.string(),
  fatherNameHindi: z.string(),
  motherName: z.string(),
  motherNameHindi: z.string(),
  husbandWifeName: z.string().optional(),
  husbandWifeNameHindi: z.string().optional(),
  mobileNumber: z.string(),
  mobileNumberHindi: z.string(),
  alternateMobileNumber: z.string().optional(),
  alternateMobileNumberHindi: z.string().optional(),
  residentialAddress: z.string(),
  residentialAddressHindi: z.string(),
  permanentAddress: z.string(),
  permanentAddressHindi: z.string(),
  companyShopName: z.string(),
  companyShopNameHindi: z.string(),
  companyShopAddress: z.string(),
  companyShopAddressHindi: z.string(),
  identityDocument: z.string(),
  identityDocumentHindi: z.string(),
  documentNumber: z.string(),
  documentNumberHindi: z.string(),
  addressProofDocument: z.string(),
  addressProofDocumentHindi: z.string(),
  guarantorName: z.string(),
  guarantorNameHindi: z.string(),
  guarantorDocumentName: z.string(),
  guarantorDocumentNameHindi: z.string(),
  guarantorDocumentNumber: z.string(),
  guarantorDocumentNumberHindi: z.string(),
  guarantorMobileNumber: z.string(),
  guarantorMobileNumberHindi: z.string(),
  guarantorAddress: z.string(),
  guarantorAddressHindi: z.string(),
  annualIncome: z.string(),
  annualIncomeHindi: z.string(),
  monthlyIncome: z.string(),
  monthlyIncomeHindi: z.string(),
  loanAmountRequired: z.string(),
  loanAmountRequiredHindi: z.string(),
  repaymentType: z.enum(['Daily', 'Weekly', 'Monthly']),
  tenurePeriod: z.string(),
  securityForLoan: z.string().optional(),
  identityDocumentFile: z.any(), // Placeholder for file upload
  addressProofDocumentFile: z.any(), // Placeholder for file upload
  guarantorDocumentFile: z.any(), // Placeholder for file upload
  customerPhoto: z.any(), // Placeholder for file upload
  loanScheme: z.string(), // Select Loan Scheme
  loanType: z.string(), // Added Loan Type
  schemeSelection: z.string(), // Added Scheme Selection
  interestRate: z.string(), // Added Interest Rate
  processingFee: z.string(), // Added Processing Fee
  lateFine: z.string(), // Added Late Fine
  loanAmountApproved: z.string(), // Approved loan amount
  isVerified: z.boolean().default(false), // Admin verification status
  adminRemarks: z.string().optional(), // Admin Remarks
  dailyEMI: z.string().optional(), // Daily EMI
  weeklyEMI: z.string().optional(), // Weekly EMI
  monthlyEMI: z.string().optional(), // Monthly EMI
  autoFine: z.boolean().default(false),
  finePerMissedPayment: z.string().optional(),
});

type LoanApplicationFormValues = z.infer<typeof loanApplicationSchema>;

interface LoanApplicationFormProps {
  translateToHindi: (text: string) => Promise<string>;
  loanSchemes?: any[];
}

const LoanApplicationForm = ({translateToHindi, loanSchemes}: LoanApplicationFormProps) => {
  const form = useForm<LoanApplicationFormValues>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      customerName: '',
      customerNameHindi: '',
      dateOfBirth: '',
      dateOfBirthHindi: '',
      fatherName: '',
      fatherNameHindi: '',
      motherName: '',
      motherNameHindi: '',
      husbandWifeName: '',
      husbandWifeNameHindi: '',
      mobileNumber: '',
      mobileNumberHindi: '',
      alternateMobileNumber: '',
      alternateMobileNumberHindi: '',
      residentialAddress: '',
      residentialAddressHindi: '',
      permanentAddress: '',
      permanentAddressHindi: '',
      companyShopName: '',
      companyShopNameHindi: '',
      companyShopAddress: '',
      companyShopAddressHindi: '',
      identityDocument: '',
      identityDocumentHindi: '',
      documentNumber: '',
      documentNumberHindi: '',
      addressProofDocument: '',
      addressProofDocumentHindi: '',
      guarantorName: '',
      guarantorNameHindi: '',
      guarantorDocumentName: '',
      guarantorDocumentNameHindi: '',
      guarantorDocumentNumber: '',
      guarantorDocumentNumberHindi: '',
      guarantorMobileNumber: '',
      guarantorMobileNumberHindi: '',
      guarantorAddress: '',
      guarantorAddressHindi: '',
      annualIncome: '',
      annualIncomeHindi: '',
      monthlyIncome: '',
      monthlyIncomeHindi: '',
      loanAmountRequired: '',
      loanAmountRequiredHindi: '',
      repaymentType: 'Daily',
      tenurePeriod: '',
      securityForLoan: '',
      identityDocumentFile: null,
      addressProofDocumentFile: null,
      guarantorDocumentFile: null,
      customerPhoto: null,
      loanScheme: '', // Initialize Loan Scheme
      loanType: '', // Initialize Loan Type
      schemeSelection: '', // Initialize Scheme Selection
      interestRate: '', // Initialize Interest Rate
      processingFee: '', // Initialize Processing Fee
      lateFine: '', // Initialize Late Fine
      loanAmountApproved: '', // Initialize Loan Approved Amount
      isVerified: false, // Initialize verification status
      adminRemarks: '', // Initialize Admin Remarks
      dailyEMI: '', // Initialize Daily EMI
      weeklyEMI: '', // Initialize Weekly EMI
      monthlyEMI: '', // Initialize Monthly EMI
      autoFine: false,
      finePerMissedPayment: '',
    },
  });

  function onSubmit(values: LoanApplicationFormValues) {
    console.log(values);
  }

  const calculateEMI = useCallback(() => {
    const loanAmountApproved = parseFloat(form.getValues('loanAmountApproved') || '0');
    const interestRate = parseFloat(form.getValues('interestRate') || '0') / 100;
    const tenurePeriod = parseInt(form.getValues('tenurePeriod') || '0');
    const repaymentType = form.getValues('repaymentType');

    if (!loanAmountApproved || !interestRate || !tenurePeriod) {
      return;
    }

    const totalInterest = loanAmountApproved * interestRate;
    const totalAmount = loanAmountApproved + totalInterest;

    let dailyEMI = '0';
    let weeklyEMI = '0';
    let monthlyEMI = '0';

    if (repaymentType === 'Daily') {
      dailyEMI = (totalAmount / tenurePeriod).toFixed(2);
    } else if (repaymentType === 'Weekly') {
      weeklyEMI = (totalAmount / tenurePeriod).toFixed(2);
    } else if (repaymentType === 'Monthly') {
      monthlyEMI = (totalAmount / tenurePeriod).toFixed(2);
    }

    form.setValue('dailyEMI', dailyEMI);
    form.setValue('weeklyEMI', weeklyEMI);
    form.setValue('monthlyEMI', monthlyEMI);
  }, [form]);

  useEffect(() => {
    const selectedScheme = loanSchemes?.find(scheme => scheme.schemeName === form.watch('loanScheme'));
    if (selectedScheme) {
      form.setValue('interestRate', selectedScheme.interestRate);
      form.setValue('processingFee', selectedScheme.processingFee);
      form.setValue('loanType', selectedScheme.loanType);
      form.setValue('schemeSelection', selectedScheme.schemeName);
      form.setValue('lateFine', selectedScheme.lateFine);
    }
  }, [form, form.watch('loanScheme'), loanSchemes]);

  useEffect(() => {
    calculateEMI();
  }, [calculateEMI, form, form.watch('loanAmountApproved'), form.watch('interestRate'), form.watch('tenurePeriod'), form.watch('repaymentType')]);

  // Auto-translate effect
  useEffect(() => {
    const autoTranslate = async () => {
      // Helper function to safely translate
      const safeTranslate = async (fieldName: keyof LoanApplicationFormValues, hindiFieldName: keyof LoanApplicationFormValues) => {
        const valueToTranslate = form.watch(fieldName);
        const hindiValue = form.watch(hindiFieldName);

        if (typeof valueToTranslate === 'string' && valueToTranslate.trim() && !hindiValue) {
          try {
            const translatedText = await translateToHindi(valueToTranslate);
            form.setValue(hindiFieldName, translatedText);
          } catch (error) {
            console.error(`Translation failed for ${fieldName}:`, error);
          }
        }
      };

      await safeTranslate('customerName', 'customerNameHindi');
      await safeTranslate('dateOfBirth', 'dateOfBirthHindi');
      await safeTranslate('fatherName', 'fatherNameHindi');
      await safeTranslate('motherName', 'motherNameHindi');
      await safeTranslate('husbandWifeName', 'husbandWifeNameHindi');
      await safeTranslate('mobileNumber', 'mobileNumberHindi');
      await safeTranslate('alternateMobileNumber', 'alternateMobileNumberHindi');
      await safeTranslate('residentialAddress', 'residentialAddressHindi');
      await safeTranslate('permanentAddress', 'permanentAddressHindi');
      await safeTranslate('companyShopName', 'companyShopNameHindi');
      await safeTranslate('companyShopAddress', 'companyShopAddressHindi');
      await safeTranslate('identityDocument', 'identityDocumentHindi');
      await safeTranslate('documentNumber', 'documentNumberHindi');
      await safeTranslate('addressProofDocument', 'addressProofDocumentHindi');
      await safeTranslate('guarantorName', 'guarantorNameHindi');
      await safeTranslate('guarantorDocumentName', 'guarantorDocumentNameHindi');
      await safeTranslate('guarantorDocumentNumber', 'guarantorDocumentNumberHindi');
      await safeTranslate('guarantorMobileNumber', 'guarantorMobileNumberHindi');
      await safeTranslate('guarantorAddress', 'guarantorAddressHindi');
      await safeTranslate('annualIncome', 'annualIncomeHindi');
      await safeTranslate('monthlyIncome', 'monthlyIncomeHindi');
      await safeTranslate('loanAmountRequired', 'loanAmountRequiredHindi');
    };

    const translationDebounce = setTimeout(() => {
        autoTranslate();
    }, 500); // Debounce to avoid excessive API calls while typing

    return () => clearTimeout(translationDebounce);
  }, [
    form,
    translateToHindi,
    form.watch('customerName'),
    form.watch('dateOfBirth'),
    form.watch('fatherName'),
    form.watch('motherName'),
    form.watch('husbandWifeName'),
    form.watch('mobileNumber'),
    form.watch('alternateMobileNumber'),
    form.watch('residentialAddress'),
    form.watch('permanentAddress'),
    form.watch('companyShopName'),
    form.watch('companyShopAddress'),
    form.watch('identityDocument'),
    form.watch('documentNumber'),
    form.watch('addressProofDocument'),
    form.watch('guarantorName'),
    form.watch('guarantorDocumentName'),
    form.watch('guarantorDocumentNumber'),
    form.watch('guarantorMobileNumber'),
    form.watch('guarantorAddress'),
    form.watch('annualIncome'),
    form.watch('monthlyIncome'),
    form.watch('loanAmountRequired'),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan Application Form</CardTitle>
        <CardDescription>Fill in the details for the loan application.</CardDescription>
        {form.getValues('isVerified') ? (
          <Badge variant="outline">Verified</Badge>
        ) : (
          <Badge variant="secondary">Pending Verification</Badge>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name (नाम)</FormLabel>
                  <FormControl>
                    <Input placeholder="Customer Name" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerNameHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name Hindi (नाम हिंदी)</FormLabel>
                  <FormControl>
                    <Input placeholder="Customer Name Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth (जन्म तिथि)</FormLabel>
                  <FormControl>
                    <Input placeholder="Date of Birth" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfBirthHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth Hindi (जन्म तिथि हिंदी)</FormLabel>
                  <FormControl>
                    <Input placeholder="Date of Birth Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fatherName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Father’s Name (पिता का नाम)</FormLabel>
                  <FormControl>
                    <Input placeholder="Father’s Name" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fatherNameHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Father’s Name Hindi (पिता का नाम हिंदी)</FormLabel>
                  <FormControl>
                    <Input placeholder="Father’s Name Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="motherName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mother’s Name (माता का नाम)</FormLabel>
                  <FormControl>
                    <Input placeholder="Mother’s Name" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="motherNameHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mother’s Name Hindi (माता का नाम हिंदी)</FormLabel>
                  <FormControl>
                    <Input placeholder="Mother’s Name Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="husbandWifeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Husband/Wife Name (पति/पत्नी का नाम) (if applicable)</FormLabel>
                  <FormControl>
                    <Input placeholder="Husband/Wife Name" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="husbandWifeNameHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Husband/Wife Name Hindi (पति/पत्नी का नाम हिंदी) (if applicable)</FormLabel>
                  <FormControl>
                    <Input placeholder="Husband/Wife Name Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number (मोबाइल नंबर)</FormLabel>
                  <FormControl>
                    <Input placeholder="Mobile Number" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobileNumberHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number Hindi (मोबाइल नंबर हिंदी)</FormLabel>
                  <FormControl>
                    <Input placeholder="Mobile Number Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="alternateMobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alternate Mobile Number (वैकल्पिक मोबाइल नंबर)</FormLabel>
                  <FormControl>
                    <Input placeholder="Alternate Mobile Number" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="alternateMobileNumberHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alternate Mobile Number Hindi (वैकल्पिक मोबाइल नंबर हिंदी)</FormLabel>
                  <FormControl>
                    <Input placeholder="Alternate Mobile Number Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="residentialAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Residential Address (घर का पता)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Residential Address" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="residentialAddressHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Residential Address Hindi (घर का पता हिंदी)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Residential Address Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="permanentAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permanent Address (स्थायी पता)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Permanent Address" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="permanentAddressHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permanent Address Hindi (स्थायी पता हिंदी)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Permanent Address Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyShopName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company/Shop Name (कंपनी / दुकान का नाम)</FormLabel>
                  <FormControl>
                    <Input placeholder="Company/Shop Name" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyShopNameHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company/Shop Name Hindi (कंपनी / दुकान का नाम हिंदी)</FormLabel>
                  <FormControl>
                    <Input placeholder="Company/Shop Name Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyShopAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company/Shop Address (कंपनी / दुकान का पता)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Company/Shop Address" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyShopAddressHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company/Shop Address Hindi (कंपनी / दुकान का पता हिंदी)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Company/Shop Address Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="identityDocumentFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identity Document (पहचान दस्तावेज) (Aadhaar, PAN, Passport, etc.) Upload</FormLabel>
                  <FormControl>
                    <Input type="file" {...field} disabled={form.getValues('isVerified')} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="identityDocument"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identity Document (पहचान दस्तावेज) (Aadhaar, PAN, Passport, etc.)</FormLabel>
                  <FormControl>
                    <Input placeholder="Identity Document" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="identityDocumentHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identity Document Hindi (पहचान दस्तावेज हिंदी) (Aadhaar, PAN, Passport, etc.)</FormLabel>
                  <FormControl>
                    <Input placeholder="Identity Document Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documentNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Number (दस्तावेज़ संख्या)</FormLabel>
                  <FormControl>
                    <Input placeholder="Document Number" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documentNumberHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Number Hindi (दस्तावेज़ संख्या हिंदी)</FormLabel>
                  <FormControl>
                    <Input placeholder="Document Number Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressProofDocumentFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Proof Document (पते का प्रमाण दस्तावेज़) Upload</FormLabel>
                  <FormControl>
                    <Input type="file" {...field} disabled={form.getValues('isVerified')} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressProofDocument"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Proof Document (पते का प्रमाण दस्तावेज़)</FormLabel>
                  <FormControl>
                    <Input placeholder="Address Proof Document" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressProofDocumentHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Proof Document Hindi (पते का प्रमाण दस्तावेज़ हिंदी)</FormLabel>
                  <FormControl>
                    <Input placeholder="Address Proof Document Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guarantorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guarantor Name (जमानतकर्ता का नाम)</FormLabel>
                  <FormControl>
                    <Input placeholder="Guarantor Name" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guarantorNameHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guarantor Name Hindi (जमानतकर्ता का नाम हिंदी)</FormLabel>
                  <FormControl>
                    <Input placeholder="Guarantor Name Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guarantorDocumentFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guarantor Document (दस्तावेज़) Upload</FormLabel>
                  <FormControl>
                    <Input type="file" {...field} disabled={form.getValues('isVerified')} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guarantorDocumentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guarantor Document Name (दस्तावेज़ नाम)</FormLabel>
                  <FormControl>
                    <Input placeholder="Guarantor Document Name" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guarantorDocumentNameHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guarantor Document Name Hindi (दस्तावेज़ नाम हिंदी)</FormLabel>
                  <FormControl>
                    <Input placeholder="Guarantor Document Name Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guarantorDocumentNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guarantor Document Number (दस्तावेज़ संख्या)</FormLabel>
                  <FormControl>
                    <Input placeholder="Guarantor Document Number" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guarantorDocumentNumberHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guarantor Document Number Hindi (दस्तावेज़ संख्या हिंदी)</FormLabel>
                  <FormControl>
                    <Input placeholder="Guarantor Document Number Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guarantorMobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guarantor Mobile Number (मोबाइल नंबर)</FormLabel>
                  <FormControl>
                    <Input placeholder="Guarantor Mobile Number" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guarantorMobileNumberHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guarantor Mobile Number Hindi (मोबाइल नंबर हिंदी)</FormLabel>
                  <FormControl>
                    <Input placeholder="Guarantor Mobile Number Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guarantorAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guarantor Address (पता)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Guarantor Address" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guarantorAddressHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guarantor Address Hindi (पता हिंदी)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Guarantor Address Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="annualIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Income (वार्षिक आय)</FormLabel>
                  <FormControl>
                    <Input placeholder="Annual Income" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="annualIncomeHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Income Hindi (वार्षिक आय हिंदी)</FormLabel>
                  <FormControl>
                    <Input placeholder="Annual Income Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthlyIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Income (मासिक आय)</FormLabel>
                  <FormControl>
                    <Input placeholder="Monthly Income" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthlyIncomeHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Income Hindi (मासिक आय हिंदी)</FormLabel>
                  <FormControl>
                    <Input placeholder="Monthly Income Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="loanAmountRequired"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Amount Required (ऋण राशि)</FormLabel>
                  <FormControl>
                    <Input placeholder="Loan Amount Required" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="loanAmountRequiredHindi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Amount Required Hindi (ऋण राशि हिंदी)</FormLabel>
                  <FormControl>
                    <Input placeholder="Loan Amount Required Hindi" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="repaymentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repayment Type (भुगतान प्रकार)</FormLabel>
                  <FormControl>
                    <RadioGroup
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      className="flex flex-col space-y-1"
                      disabled={form.getValues('isVerified')}
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <RadioGroupItem value="Daily" id="daily" />
                        <FormLabel htmlFor="daily">Daily (रोजाना)</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <RadioGroupItem value="Weekly" id="weekly" />
                        <FormLabel htmlFor="weekly">Weekly (साप्ताहिक)</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <RadioGroupItem value="Monthly" id="monthly" />
                        <FormLabel htmlFor="monthly">Monthly (मासिक)</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tenurePeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenure Period (अवधि)</FormLabel>
                  <FormControl>
                    <Input placeholder="Tenure Period" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="securityForLoan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Security for Loan (ऋण की सुरक्षा) (if any)</FormLabel>
                  <FormControl>
                    <Input placeholder="Security for Loan" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="loanScheme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Loan Scheme</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={form.getValues('isVerified')}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a scheme" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loanSchemes?.map((scheme) => (
                        <SelectItem key={scheme.schemeName} value={scheme.schemeName}>
                          {scheme.schemeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Added Fields */}
            <FormField
              control={form.control}
              name="loanType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Type (ऋण प्रकार)</FormLabel>
                  <FormControl>
                    <Input placeholder="Loan Type" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="schemeSelection"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheme Selection (योजना चयन)</FormLabel>
                  <FormControl>
                    <Input placeholder="Scheme Selection" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interestRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest Rate (ब्याज दर %)</FormLabel>
                  <FormControl>
                    <Input placeholder="Interest Rate" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="processingFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processing Fee (प्रसंस्करण शुल्क ₹)</FormLabel>
                  <FormControl>
                    <Input placeholder="Processing Fee" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lateFine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Late Fine</FormLabel>
                  <FormControl>
                    <Input placeholder="Late Fine" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loanAmountApproved"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Amount Approved</FormLabel>
                  <FormControl>
                    <Input placeholder="Loan Amount Approved" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Admin Verification Switch */}
            <FormField
              control={form.control}
              name="isVerified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Verified</FormLabel>
                    <FormDescription>
                      Mark as verified if the application is approved.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* End Admin Verification Switch */}

            {/* Admin Remarks */}
            <FormField
              control={form.control}
              name="adminRemarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Remarks</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Admin Remarks" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* End Admin Remarks */}
            {/* Daily EMI */}
            <FormField
              control={form.control}
              name="dailyEMI"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily EMI (दैनिक ईएमआई ₹)</FormLabel>
                  <FormControl>
                    <Input placeholder="Daily EMI" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Weekly EMI */}
            <FormField
              control={form.control}
              name="weeklyEMI"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weekly EMI (साप्ताहिक ईएमआई ₹)</FormLabel>
                  <FormControl>
                    <Input placeholder="Weekly EMI" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Monthly EMI */}
            <FormField
              control={form.control}
              name="monthlyEMI"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly EMI (मासिक ईएमआई ₹)</FormLabel>
                  <FormControl>
                    <Input placeholder="Monthly EMI" {...field} disabled={form.getValues('isVerified')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* End Monthly EMI */}
            {/* Auto Fine */}
            <FormField
              control={form.control}
              name="autoFine"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Auto Fine</FormLabel>
                    <FormDescription>Enable auto fine for late payments.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={form.getValues('isVerified')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* End Auto Fine */}
            {/* Fine Per Missed Payment */}
            <FormField
              control={form.control}
              name="finePerMissedPayment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fine Per Missed Payment</FormLabel>
                  <FormControl>
                    <Input placeholder="Fine Per Missed Payment" {...field} disabled={form.getValues('isVerified') || !form.getValues('autoFine')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* End Fine Per Missed Payment */}

            <Button type="submit" disabled={form.getValues('isVerified')}>
              Submit
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LoanApplicationForm;
