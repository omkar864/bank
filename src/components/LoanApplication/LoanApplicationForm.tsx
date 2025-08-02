'use client';

import {
  Card,
  CardContent,
  CardDescription as ShadCardDescription,
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
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Button} from '@/components/ui/button';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Textarea} from '@/components/ui/textarea';
import {Switch} from '@/components/ui/switch';
import {Badge} from '@/components/ui/badge';
import {useEffect, useCallback, useState, useRef} from 'react';
import type { LoanApplicationData } from './LoanApplication';
import type { LoanSchemeFormValues } from '../LoanSchemeManagement/SchemeCreateForm';
import type { Branch } from '../BranchManagement/Branch';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase/clientApp';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Loader2, Download } from 'lucide-react';
import PrintDialog from './PrintDialog';

// Define the Zod schema for loan application form values
const loanApplicationSchema = z.object({
  customerName: z.string().min(2, { message: 'Customer Name must be at least 2 characters.' }),
  customerNameHindi: z.string().optional(),
  dateOfBirth: z.string().min(1, { message: 'Date of Birth is required.' }),
  gender: z.enum(['Male', 'Female', 'Other']),
  fatherName: z.string().min(2, { message: "Father's Name must be at least 2 characters." }),
  fatherNameHindi: z.string().optional(),
  motherName: z.string().min(2, { message: "Mother's Name must be at least 2 characters." }),
  motherNameHindi: z.string().optional(),
  husbandWifeName: z.string().optional(),
  husbandWifeNameHindi: z.string().optional(),
  mobileNumber: z.string().regex(/^\d{10,}$/, 'Must be a valid mobile number.'),
  alternateMobileNumber: z.string().optional(),
  
  residentialAddress: z.string().min(5, { message: 'Residential address is required.' }),
  residentialAddressHindi: z.string().optional(),
  city: z.string().min(1, { message: 'City is required.' }),
  cityHindi: z.string().optional(),
  state: z.string().min(1, { message: 'State is required.' }),
  stateHindi: z.string().optional(),
  pincode: z.string().min(6, { message: 'Pincode must be 6 digits.' }).regex(/^\d{6}$/, 'Must be a valid 6-digit pincode.'),
  pincodeHindi: z.string().optional(),

  permanentAddress: z.string().min(5, { message: 'Permanent address is required.' }),
  permanentAddressHindi: z.string().optional(),
  companyShopName: z.string().min(2, { message: 'Company/Shop name is required.' }),
  companyShopAddress: z.string().min(5, { message: 'Company/Shop address is required.' }),

  identityDocumentType: z.string().min(1, { message: 'ID document type is required.' }),
  identityDocumentOther: z.string().optional(),
  identityDocumentNumber: z.string().min(1, { message: 'ID document number is required.' }),
  identityDocumentFileUrl: z.string().optional(),
  
  addressProofDocumentType: z.string().min(1, { message: 'Address proof type is required.' }),
  addressProofDocumentOther: z.string().optional(),
  addressProofDocumentNumber: z.string().min(1, { message: 'Address proof number is required.' }),
  addressProofDocumentFileUrl: z.string().optional(),

  customerPhotoUrl: z.string().optional(),
  
  guarantorName: z.string().min(2, { message: 'Guarantor name is required.' }),
  guarantorMobileNumber: z.string().regex(/^\d{10,}$/, 'Must be a valid mobile number.'),
  guarantorAddress: z.string().min(5, { message: 'Guarantor address is required.' }),
  guarantorDocumentType: z.string().min(1, { message: 'Guarantor document type is required.' }),
  guarantorDocumentOther: z.string().optional(),
  guarantorDocumentNumber: z.string().min(1, { message: 'Guarantor document number is required.' }),
  guarantorDocumentFileUrl: z.string().optional(),

  annualIncome: z.string().min(1, { message: 'Annual income is required.' }),
  monthlyIncome: z.string().min(1, { message: 'Monthly income is required.' }),
  
  loanAmountRequired: z.string().min(1, { message: 'Loan amount is required.' }),
  repaymentType: z.enum(['Daily', 'Weekly', 'Monthly']),
  tenurePeriod: z.string().min(1, { message: 'Tenure period is required.' }),
  loanScheme: z.string().min(1, { message: 'Please select a loan scheme.' }),
  securityForLoan: z.string().optional(),
  securityForLoanOther: z.string().optional(),

  // Admin and calculated fields
  loanType: z.string().optional(),
  interestRate: z.string().optional(),
  processingFee: z.string().optional(),
  lateFine: z.string().optional(),
  loanAmountApproved: z.string().optional(),
  isVerified: z.boolean().default(false),
  adminRemarks: z.string().optional(),
  dailyEMI: z.string().optional(),
  weeklyEMI: z.string().optional(),
  monthlyEMI: z.string().optional(),
  autoFine: z.boolean().default(false),
  finePerMissedPayment: z.string().optional(),

  // Branch assignment
  assignedBranchCode: z.string().min(1, { message: "A primary branch must be assigned."}),
  assignedSubBranchCode: z.string().optional(),
  
  // File objects for upload handling (won't be in final data)
  identityDocumentFile: z.any().optional(),
  addressProofDocumentFile: z.any().optional(),
  guarantorDocumentFile: z.any().optional(),
  customerPhotoFile: z.any().optional(),
});

export type LoanApplicationFormValues = z.infer<typeof loanApplicationSchema>;

interface LoanApplicationFormProps {
  translateToHindi: (text: string) => Promise<string>;
  loanSchemes: LoanSchemeFormValues[];
  branches: Branch[];
  applicationToView?: LoanApplicationData | null;
  onApplicationSubmittedSuccessfully: (submittedApplication: LoanApplicationData) => void;
  onApproveApplication: (applicationId: string, finalDetails: LoanApplicationFormValues) => void;
  onRejectApplication: (applicationId: string, finalDetails: LoanApplicationFormValues) => void;
  onCancelViewDetails: () => void;
}

const documentOptions = [
  "Aadhaar Card",
  "PAN Card",
  "Voter ID Card",
  "Driving License",
  "Passport",
  "Electricity Bill",
  "Bank Passbook",
  "Ration Card",
  "Other",
];

const securityOptions = [
    "Gold",
    "Property",
    "Shop",
    "Vehicle",
    "None",
    "Other",
];

const LoanApplicationForm = ({
  translateToHindi,
  loanSchemes = [],
  branches = [],
  applicationToView,
  onApplicationSubmittedSuccessfully,
  onApproveApplication,
  onRejectApplication,
  onCancelViewDetails
}: LoanApplicationFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [documentTypeToPrint, setDocumentTypeToPrint] = useState<'application' | 'agreement'>('application');

  const isViewingMode = !!applicationToView;
  
  const form = useForm<LoanApplicationFormValues>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      customerName: '',
      customerNameHindi: '',
      dateOfBirth: '',
      gender: 'Male',
      fatherName: '',
      fatherNameHindi: '',
      motherName: '',
      motherNameHindi: '',
      husbandWifeName: '',
      husbandWifeNameHindi: '',
      mobileNumber: '',
      alternateMobileNumber: '',
      residentialAddress: '',
      residentialAddressHindi: '',
      city: '',
      cityHindi: '',
      state: '',
      stateHindi: '',
      pincode: '',
      pincodeHindi: '',
      permanentAddress: '',
      permanentAddressHindi: '',
      companyShopName: '',
      companyShopAddress: '',
      identityDocumentType: '',
      identityDocumentNumber: '',
      addressProofDocumentType: '',
      addressProofDocumentNumber: '',
      guarantorName: '',
      guarantorMobileNumber: '',
      guarantorAddress: '',
      guarantorDocumentType: '',
      guarantorDocumentNumber: '',
      annualIncome: '',
      monthlyIncome: '',
      loanAmountRequired: '',
      repaymentType: 'Daily',
      tenurePeriod: '',
      securityForLoan: '',
      loanScheme: '',
      assignedBranchCode: '',
      assignedSubBranchCode: '',
      isVerified: false,
      adminRemarks: '',
      dailyEMI: '',
      weeklyEMI: '',
      monthlyEMI: '',
      autoFine: false,
    },
  });
  
  const { register, watch, setValue, getValues } = form;
  const identityDocType = watch("identityDocumentType");
  const addressProofDocType = watch("addressProofDocumentType");
  const guarantorDocType = watch("guarantorDocumentType");
  const securityForLoanType = watch("securityForLoan");
  const assignedBranchCode = watch("assignedBranchCode");

  const getFieldValue = useCallback((fieldName: keyof LoanApplicationData, fallback: any = '') => {
    return applicationToView?.[fieldName] || fallback;
  }, [applicationToView]);
  
  useEffect(() => {
    if (applicationToView) {
      form.reset({
        ...applicationToView,
        loanAmountApproved: getFieldValue('loanAmountApproved', getFieldValue('loanAmountRequired')),
        isVerified: getFieldValue('isVerified', false),
        gender: getFieldValue('gender', 'Male'),
        dateOfBirth: applicationToView.dateOfBirth ? new Date(applicationToView.dateOfBirth).toISOString().split('T')[0] : '',
      });
    } else {
      form.reset();
    }
  }, [applicationToView, form, getFieldValue]);

  useEffect(() => {
    setValue('assignedSubBranchCode', '');
  }, [assignedBranchCode, setValue]);

  const calculateEMI = useCallback(() => {
    const loanAmountApproved = parseFloat(getValues('loanAmountApproved') || '0');
    const interestRate = parseFloat(getValues('interestRate') || '0') / 100;
    const tenurePeriod = parseInt(getValues('tenurePeriod') || '0');
    const repaymentType = getValues('repaymentType');

    if (!loanAmountApproved || !interestRate || !tenurePeriod || isNaN(loanAmountApproved) || isNaN(interestRate) || isNaN(tenurePeriod)) {
      setValue('dailyEMI', '');
      setValue('weeklyEMI', '');
      setValue('monthlyEMI', '');
      return;
    }

    const totalInterest = loanAmountApproved * interestRate;
    const totalAmount = loanAmountApproved + totalInterest;

    let dailyEMI = '';
    let weeklyEMI = '';
    let monthlyEMI = '';

    if (repaymentType === 'Daily') {
      dailyEMI = (totalAmount / tenurePeriod).toFixed(2);
    } else if (repaymentType === 'Weekly') {
      weeklyEMI = (totalAmount / tenurePeriod).toFixed(2);
    } else if (repaymentType === 'Monthly') {
      monthlyEMI = (totalAmount / tenurePeriod).toFixed(2);
    }
    
    setValue('dailyEMI', dailyEMI);
    setValue('weeklyEMI', weeklyEMI);
    setValue('monthlyEMI', monthlyEMI);
  }, [getValues, setValue]);

  useEffect(() => {
    const selectedSchemeName = watch('loanScheme');
    if (!selectedSchemeName) return;
    
    const selectedScheme = loanSchemes.find(scheme => scheme.schemeName === selectedSchemeName);
    if (selectedScheme) {
      setValue('interestRate', String(selectedScheme.interestRate));
      setValue('processingFee', String(selectedScheme.processingFee));
      setValue('loanType', selectedScheme.loanType);
      setValue('lateFine', String(selectedScheme.lateFine));
    }
  }, [watch('loanScheme'), loanSchemes, setValue, watch]);

  useEffect(() => {
    calculateEMI();
  }, [
    calculateEMI,
    watch('loanAmountApproved'),
    watch('interestRate'),
    watch('tenurePeriod'),
    watch('repaymentType'),
  ]);

  // Auto-translate effect
  useEffect(() => {
    const autoTranslate = async () => {
      // Required fields - applying || '' for type safety
      if (form.watch('customerName') && !form.watch('customerNameHindi')) {
        const translatedName = await translateToHindi(form.watch('customerName') || ''); 
        form.setValue('customerNameHindi', translatedName);
      }
      if (form.watch('dateOfBirth') && !form.watch('dateOfBirthHindi')) {
        const translatedText = await translateToHindi(form.watch('dateOfBirth') || ''); 
        form.setValue('dateOfBirthHindi', translatedText);
      }
      if (form.watch('fatherName') && !form.watch('fatherNameHindi')) {
        const translatedText = await translateToHindi(form.watch('fatherName') || ''); 
        form.setValue('fatherNameHindi', translatedText);
      }
      if (form.watch('motherName') && !form.watch('motherNameHindi')) {
        const translatedText = await translateToHindi(form.watch('motherName') || ''); 
        form.setValue('motherNameHindi', translatedText);
      }
      if (form.watch('mobileNumber') && !form.watch('mobileNumberHindi')) {
        const translatedText = await translateToHindi(form.watch('mobileNumber') || ''); 
        form.setValue('mobileNumberHindi', translatedText);
      }
      if (form.watch('residentialAddress') && !form.watch('residentialAddressHindi')) {
        const translatedText = await translateToHindi(form.watch('residentialAddress') || ''); 
        form.setValue('residentialAddressHindi', translatedText);
      }
      if (form.watch('permanentAddress') && !form.watch('permanentAddressHindi')) {
        const translatedText = await translateToHindi(form.watch('permanentAddress') || ''); 
        form.setValue('permanentAddressHindi', translatedText);
      }
      if (form.watch('companyShopName') && !form.watch('companyShopNameHindi')) {
        const translatedText = await translateToHindi(form.watch('companyShopName') || ''); 
        form.setValue('companyShopNameHindi', translatedText);
      }
      if (form.watch('companyShopAddress') && !form.watch('companyShopAddressHindi')) {
        const translatedText = await translateToHindi(form.watch('companyShopAddress') || ''); 
        form.setValue('companyShopAddressHindi', translatedText);
      }
      if (form.watch('identityDocumentType') && !form.watch('identityDocumentHindi')) {
        const translatedText = await translateToHindi(form.watch('identityDocumentType') || ''); 
        form.setValue('identityDocumentHindi', translatedText);
      }
      if (form.watch('identityDocumentNumber') && !form.watch('documentNumberHindi')) { // Assuming documentNumberHindi is for identityDocumentNumber
        const translatedText = await translateToHindi(form.watch('identityDocumentNumber') || ''); 
        form.setValue('documentNumberHindi', translatedText);
      }
      if (form.watch('addressProofDocumentType') && !form.watch('addressProofDocumentHindi')) {
        const translatedText = await translateToHindi(form.watch('addressProofDocumentType') || ''); 
        form.setValue('addressProofDocumentHindi', translatedText);
      }
      if (form.watch('guarantorName') && !form.watch('guarantorNameHindi')) {
        const translatedText = await translateToHindi(form.watch('guarantorName') || ''); 
        form.setValue('guarantorNameHindi', translatedText);
      }
      if (form.watch('guarantorDocumentType') && !form.watch('guarantorDocumentNameHindi')) { 
        const translatedText = await translateToHindi(form.watch('guarantorDocumentType') || ''); 
        form.setValue('guarantorDocumentNameHindi', translatedText);
      }
      if (form.watch('guarantorDocumentNumber') && !form.watch('guarantorDocumentNumberHindi')) {
        const translatedText = await translateToHindi(form.watch('guarantorDocumentNumber') || ''); 
        form.setValue('guarantorDocumentNumberHindi', translatedText);
      }
      if (form.watch('guarantorMobileNumber') && !form.watch('guarantorMobileNumberHindi')) {
        const translatedText = await translateToHindi(form.watch('guarantorMobileNumber') || ''); 
        form.setValue('guarantorMobileNumberHindi', translatedText);
      }
      if (form.watch('guarantorAddress') && !form.watch('guarantorAddressHindi')) {
        const translatedText = await translateToHindi(form.watch('guarantorAddress') || ''); 
        form.setValue('guarantorAddressHindi', translatedText);
      }
      if (form.watch('annualIncome') && !form.watch('annualIncomeHindi')) {
        const translatedText = await translateToHindi(form.watch('annualIncome') || ''); 
        form.setValue('annualIncomeHindi', translatedText);
      }
      if (form.watch('monthlyIncome') && !form.watch('monthlyIncomeHindi')) {
        const translatedText = await translateToHindi(form.watch('monthlyIncome') || ''); 
        form.setValue('monthlyIncomeHindi', translatedText);
      }
      if (form.watch('loanAmountRequired') && !form.watch('loanAmountRequiredHindi')) {
        const translatedText = await translateToHindi(form.watch('loanAmountRequired') || ''); 
        form.setValue('loanAmountRequiredHindi', translatedText);
      }

      // Optional fields with explicit handling (including the original problematic line 248)
      if (form.watch('husbandWifeName') && !form.watch('husbandWifeNameHindi')) {
        const translatedText = await translateToHindi(form.watch('husbandWifeName') || ''); 
        form.setValue('husbandWifeNameHindi', translatedText);
      }

      if (form.watch('alternateMobileNumber') && !form.watch('alternateMobileNumberHindi')) {
        const translatedText = await translateToHindi(form.watch('alternateMobileNumber') || ''); 
        form.setValue('alternateMobileNumberHindi', translatedText);
      }
    };

    autoTranslate();
  }, [
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
    form.watch('identityDocumentType'), 
    form.watch('identityDocumentNumber'), 
    form.watch('addressProofDocumentType'), 
    form.watch('guarantorName'),
    form.watch('guarantorDocumentType'), 
    form.watch('guarantorDocumentNumber'),
    form.watch('guarantorMobileNumber'),
    form.watch('guarantorAddress'),
    form.watch('annualIncome'),
    form.watch('monthlyIncome'),
    form.watch('loanAmountRequired'),
    translateToHindi,
    form,
  ]);
  
  const uploadFile = async (file: File, customerId: string, branchId: string): Promise<string> => {
    if (!file) return '';
    
    const storage = getStorage(app);
    const filePath = `uploads/${branchId}/${customerId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);
    
    console.log(`Uploading file: ${file.name} to ${filePath}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`File uploaded successfully: ${downloadURL}`);
    return downloadURL;
  };

  const onSubmit = useCallback(async (values: LoanApplicationFormValues) => {
    setIsSubmitting(true);
    toast({ title: 'Submitting...', description: 'Please wait while we process the application.' });
    
    try {
        const branchId = values.assignedBranchCode || 'default_branch';
        const customerId = values.mobileNumber;

        const payload: any = { ...values };

        if (payload.identityDocumentFile && payload.identityDocumentFile[0]) {
            payload.identityDocumentFileUrl = await uploadFile(payload.identityDocumentFile[0], customerId, branchId);
        }
        if (payload.addressProofDocumentFile && payload.addressProofDocumentFile[0]) {
            payload.addressProofDocumentFileUrl = await uploadFile(payload.addressProofDocumentFile[0], customerId, branchId);
        }
        if (payload.guarantorDocumentFile && payload.guarantorDocumentFile[0]) {
            payload.guarantorDocumentFileUrl = await uploadFile(payload.guarantorDocumentFile[0], customerId, branchId);
        }
        if (payload.customerPhotoFile && payload.customerPhotoFile[0]) {
            payload.customerPhotoUrl = await uploadFile(payload.customerPhotoFile[0], customerId, branchId);
        }
        
        delete payload.identityDocumentFile;
        delete payload.addressProofDocumentFile;
        delete payload.guarantorDocumentFile;
        delete payload.customerPhotoFile;
        
        if(payload.identityDocumentType === 'Other') payload.identityDocumentType = payload.identityDocumentOther;
        if(payload.addressProofDocumentType === 'Other') payload.addressProofDocumentType = payload.addressProofDocumentOther;
        if(payload.guarantorDocumentType === 'Other') payload.guarantorDocumentType = payload.guarantorDocumentOther;
        if(payload.securityForLoan === 'Other') payload.securityForLoan = payload.securityForLoanOther;
        delete payload.identityDocumentOther;
        delete payload.addressProofDocumentOther;
        delete payload.guarantorDocumentOther;
        delete payload.securityForLoanOther;

        console.log("Calling 'submitnewloanapplication' Cloud Function with payload:", payload);
        const firebaseFunctions = getFunctions(app);
        const submitNewLoanApplication = httpsCallable(firebaseFunctions, 'submitnewloanapplication');
        
        const result: any = await submitNewLoanApplication(payload);
        console.log("Cloud Function result:", result);

        if (result.data.success) {
            toast({
                title: 'Success!',
                description: result.data.message
            });
            onApplicationSubmittedSuccessfully(result.data.data as LoanApplicationData);
        } else {
            throw new Error(result.data.message || 'Submission failed due to a server-side issue.');
        }

    } catch (error: any) {
        console.error('Full submission failed:', error);
        toast({
            title: 'Submission Failed',
            description: error.message || 'An unexpected error occurred.',
            variant: 'destructive',
        });
    } finally {
        setIsSubmitting(false);
    }
  }, [toast, onApplicationSubmittedSuccessfully]);

  const handleApproval = () => {
    if (applicationToView) {
      onApproveApplication(applicationToView.id, form.getValues());
    }
  };

  const handleRejection = () => {
    if (applicationToView) {
      onRejectApplication(applicationToView.id, form.getValues());
    }
  };
  
  const triggerPrint = (docType: 'application' | 'agreement') => {
    setDocumentTypeToPrint(docType);
    setIsPrintDialogOpen(true);
  };

  const isFormDisabled = isSubmitting || (isViewingMode && applicationToView?.status !== 'Pending');

  return (
    <>
      <PrintDialog
        isOpen={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
        applicationToView={isViewingMode ? { ...applicationToView, ...form.getValues() } : null}
        documentType={documentTypeToPrint}
      />
      <Card className="shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="bg-muted/30">
          <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                  <CardTitle>{isViewingMode ? 'View/Verify Loan Application' : 'New Loan Application Form'}</CardTitle>
                  <ShadCardDescription>{isViewingMode ? `Application ID: ${applicationToView?.id}` : 'Fill in all details for the loan application.'}</ShadCardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isViewingMode && (
                    <Badge variant={
                        applicationToView?.status === 'Approved' ? 'default' :
                        applicationToView?.status === 'Rejected' ? 'destructive' : 'secondary'
                    } className="text-lg py-1 px-3">
                        {applicationToView?.status}
                    </Badge>
                )}
                 {isViewingMode && applicationToView?.status === 'Approved' && (
                  <>
                    <Button type="button" variant="outline" onClick={() => triggerPrint('application')}><Download className="mr-2 h-4 w-4" /> Form</Button>
                    <Button type="button" variant="outline" onClick={() => triggerPrint('agreement')}><Download className="mr-2 h-4 w-4" /> Agreement</Button>
                  </>
                )}
              </div>
              </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <fieldset className="border p-4 rounded-lg">
                  <legend className="px-2 font-medium text-primary -ml-2">1. Personal Details</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4">
                      <FormField control={form.control} name="customerName" render={({ field }) => (<FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input placeholder="Customer Name" {...field} disabled={isFormDisabled} onBlur={async (e) => { const value = e.target.value; if (value && !form.watch('customerNameHindi')) { setValue('customerNameHindi', await translateToHindi(value)); } }} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="customerNameHindi" render={({ field }) => (<FormItem><FormLabel>Customer Name (हिन्दी)</FormLabel><FormControl><Input placeholder="नाम हिंदी में" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />

                      <FormField control={form.control} name="dateOfBirth" render={({ field }) => (<FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} disabled={isFormDisabled} onBlur={async (e) => { const value = e.target.value; if (value && !form.watch('dateOfBirthHindi')) { setValue('dateOfBirthHindi', await translateToHindi(value)); } }} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="dateOfBirthHindi" render={({ field }) => (<FormItem><FormLabel>Date of Birth (हिन्दी)</FormLabel><FormControl><Input placeholder="जन्म तिथि हिंदी में" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />

                      <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isFormDisabled}><FormControl><SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger></FormControl><SelectContent position="popper"><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />

                      <FormField control={form.control} name="fatherName" render={({ field }) => (<FormItem><FormLabel>Father’s Name</FormLabel><FormControl><Input placeholder="Father’s Name" {...field} disabled={isFormDisabled} onBlur={async (e) => { const value = e.target.value; if (value && !form.watch('fatherNameHindi')) { setValue('fatherNameHindi', await translateToHindi(value)); } }} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="fatherNameHindi" render={({ field }) => (<FormItem><FormLabel>Father’s Name (हिन्दी)</FormLabel><FormControl><Input placeholder="पिता का नाम हिंदी में" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />

                      <FormField control={form.control} name="motherName" render={({ field }) => (<FormItem><FormLabel>Mother’s Name</FormLabel><FormControl><Input placeholder="Mother’s Name" {...field} disabled={isFormDisabled} onBlur={async (e) => { const value = e.target.value; if (value && !form.watch('motherNameHindi')) { setValue('motherNameHindi', await translateToHindi(value)); } }} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="motherNameHindi" render={({ field }) => (<FormItem><FormLabel>Mother’s Name (हिन्दी)</FormLabel><FormControl><Input placeholder="माता का नाम हिंदी में" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />

                      <FormField control={form.control} name="husbandWifeName" render={({ field }) => (<FormItem><FormLabel>Spouse's Name (optional)</FormLabel><FormControl><Input placeholder="Spouse's Name" {...field} disabled={isFormDisabled} onBlur={async (e) => { const value = e.target.value; if (value && !form.watch('husbandWifeNameHindi')) { setValue('husbandWifeNameHindi', await translateToHindi(value)); } }} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="husbandWifeNameHindi" render={({ field }) => (<FormItem><FormLabel>Spouse's Name (हिन्दी)</FormLabel><FormControl><Input placeholder="पति/पत्नी का नाम हिंदी में" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />

                      <FormField control={form.control} name="mobileNumber" render={({ field }) => (<FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input placeholder="Mobile Number" {...field} disabled={isFormDisabled} onBlur={async (e) => { const value = e.target.value; if (value && !form.watch('mobileNumberHindi')) { setValue('mobileNumberHindi', await translateToHindi(value)); } }} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="mobileNumberHindi" render={({ field }) => (<FormItem><FormLabel>Mobile Number (हिन्दी)</FormLabel><FormControl><Input placeholder="मोबाइल नंबर हिंदी में" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />

                      <FormField control={form.control} name="alternateMobileNumber" render={({ field }) => (<FormItem><FormLabel>Alternate Mobile (optional)</FormLabel><FormControl><Input placeholder="Alternate Mobile" {...field} disabled={isFormDisabled} onBlur={async (e) => { const value = e.target.value; if (value && !form.watch('alternateMobileNumberHindi')) { setValue('alternateMobileNumberHindi', await translateToHindi(value)); } }} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="alternateMobileNumberHindi" render={({ field }) => (<FormItem><FormLabel>Alternate Mobile (हिन्दी)</FormLabel><FormControl><Input placeholder="वैकल्पिक मोबाइल नंबर हिंदी में" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
              </fieldset>

              <fieldset className="border p-4 rounded-lg">
                  <legend className="px-2 font-medium text-primary -ml-2">2. Address & Work Details</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4">
                      <FormField control={form.control} name="residentialAddress" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Residential Address</FormLabel><FormControl><Textarea placeholder="Residential Address" {...field} disabled={isFormDisabled} onBlur={async (e) => { const value = e.target.value; if (value && !form.watch('residentialAddressHindi')) { setValue('residentialAddressHindi', await translateToHindi(value)); } }} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="residentialAddressHindi" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Residential Address (हिन्दी)</FormLabel><FormControl><Textarea placeholder="घर का पता हिंदी में" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />

                      <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="City" {...field} disabled={isFormDisabled} onBlur={async (e) => { const value = e.target.value; if (value && !form.watch('cityHindi')) { setValue('cityHindi', await translateToHindi(value)); } }} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="cityHindi" render={({ field }) => (<FormItem><FormLabel>City (हिन्दी)</FormLabel><FormControl><Input placeholder="शहर" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="State" {...field} disabled={isFormDisabled} onBlur={async (e) => { const value = e.target.value; if (value && !form.watch('stateHindi')) { setValue('stateHindi', await translateToHindi(value)); } }} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="stateHindi" render={({ field }) => (<FormItem><FormLabel>State (हिन्दी)</FormLabel><FormControl><Input placeholder="राज्य" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="pincode" render={({ field }) => (<FormItem><FormLabel>Pincode</FormLabel><FormControl><Input placeholder="Pincode" type="number" disabled={isFormDisabled} onBlur={async (e) => { const value = e.target.value; if (value && !form.watch('pincodeHindi')) { setValue('pincodeHindi', await translateToHindi(value)); } }} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="pincodeHindi" render={({ field }) => (<FormItem><FormLabel>Pincode (हिन्दी)</FormLabel><FormControl><Input placeholder="पिनकोड" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />

                      <FormField control={form.control} name="permanentAddress" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Permanent Address</FormLabel><FormControl><Textarea placeholder="Permanent Address" {...field} disabled={isFormDisabled} onBlur={async (e) => { const value = e.target.value; if (value && !form.watch('permanentAddressHindi')) { setValue('permanentAddressHindi', await translateToHindi(value)); } }} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="permanentAddressHindi" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Permanent Address (हिन्दी)</FormLabel><FormControl><Textarea placeholder="स्थायी पता हिंदी में" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                      
                      <FormField control={form.control} name="companyShopName" render={({ field }) => (<FormItem><FormLabel>Company/Shop Name</FormLabel><FormControl><Input placeholder="Company/Shop Name" {...field} disabled={isFormDisabled} onBlur={async (e) => { const value = e.target.value; if (value && !form.watch('companyShopNameHindi')) { setValue('companyShopNameHindi', await translateToHindi(value)); } }}/></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="companyShopNameHindi" render={({ field }) => (<FormItem><FormLabel>Company/Shop Name (हिन्दी)</FormLabel><FormControl><Input placeholder="कंपनी / दुकान का नाम हिंदी में" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="companyShopAddress" render={({ field }) => (<FormItem><FormLabel>Company/Shop Address</FormLabel><FormControl><Textarea placeholder="Company/Shop Address" {...field} disabled={isFormDisabled} onBlur={async (e) => { const value = e.target.value; if (value && !form.watch('companyShopAddressHindi')) { setValue('companyShopAddressHindi', await translateToHindi(value)); } }}/></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="companyShopAddressHindi" render={({ field }) => (<FormItem><FormLabel>Company/Shop Address (हिन्दी)</FormLabel><FormControl><Textarea placeholder="कंपनी / दुकान का पता हिंदी में" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
              </fieldset>

              <fieldset className="border p-4 rounded-lg">
                  <legend className="px-2 font-medium text-primary -ml-2">3. Documents</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 pt-4">
                      <FormField control={form.control} name="identityDocumentType" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Identity Document Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isFormDisabled}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select ID Document" /></SelectTrigger>
                            </FormControl>
                            <SelectContent position="popper">
                              {documentOptions.map(doc => <SelectItem key={doc} value={doc}>{doc}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      {identityDocType === 'Other' && <FormField control={form.control} name="identityDocumentOther" render={({ field }) => (<FormItem><FormLabel>Specify Other ID</FormLabel><FormControl><Input placeholder="Enter document name" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} /> }
                      <FormField control={form.control} name="identityDocumentNumber" render={({ field }) => (<FormItem><FormLabel>ID Document Number</FormLabel><FormControl><Input placeholder="Document Number" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                      
                      <FormItem>
                          <FormLabel>Customer Photo</FormLabel>
                          <FormControl><Input type="file" accept="image/*" disabled={isFormDisabled} {...register("customerPhotoFile")} /></FormControl>
                          <FormMessage />
                      </FormItem>
                      <FormItem>
                          <FormLabel>ID Document Upload</FormLabel>
                          <FormControl><Input type="file" accept="image/*,application/pdf" disabled={isFormDisabled} {...register("identityDocumentFile")} /></FormControl>
                          <FormMessage />
                      </FormItem>
                      <FormItem>
                          <FormLabel>Address Proof Upload</FormLabel>
                          <FormControl><Input type="file" accept="image/*,application/pdf" disabled={isFormDisabled} {...register("addressProofDocumentFile")} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  </div>
              </fieldset>

              <fieldset className="border p-4 rounded-lg">
                  <legend className="px-2 font-medium text-primary -ml-2">4. Guarantor Details</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 pt-4">
                      <FormField control={form.control} name="guarantorName" render={({ field }) => (<FormItem><FormLabel>Guarantor Name</FormLabel><FormControl><Input placeholder="Guarantor Name" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="guarantorMobileNumber" render={({ field }) => (<FormItem><FormLabel>Guarantor Mobile</FormLabel><FormControl><Input placeholder="Guarantor Mobile" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="guarantorDocumentType" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guarantor Document Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isFormDisabled}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select Guarantor Doc" /></SelectTrigger>
                            </FormControl>
                            <SelectContent position="popper">
                              {documentOptions.map(doc => <SelectItem key={doc} value={doc}>{doc}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      {guarantorDocType === 'Other' && <FormField control={form.control} name="guarantorDocumentOther" render={({ field }) => (<FormItem><FormLabel>Specify Other Guarantor Doc</FormLabel><FormControl><Input placeholder="Enter document name" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />}
                      <FormField control={form.control} name="guarantorDocumentNumber" render={({ field }) => (<FormItem><FormLabel>Guarantor Doc Number</FormLabel><FormControl><Input placeholder="Guarantor Document Number" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                      <FormItem>
                          <FormLabel>Guarantor Doc Upload</FormLabel>
                          <FormControl><Input type="file" accept="image/*,application/pdf" disabled={isFormDisabled} {...register("guarantorDocumentFile")} /></FormControl>
                          <FormMessage />
                      </FormItem>
                      <FormField control={form.control} name="guarantorAddress" render={({ field }) => (<FormItem className="lg:col-span-3"><FormLabel>Guarantor Address</FormLabel><FormControl><Textarea placeholder="Guarantor Address" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
              </fieldset>
              
              <fieldset className="border p-4 rounded-lg">
                  <legend className="px-2 font-medium text-primary -ml-2">5. Loan Requirements</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 pt-4">
                      <FormField control={form.control} name="annualIncome" render={({ field }) => (<FormItem><FormLabel>Annual Income (₹)</FormLabel><FormControl><Input placeholder="Annual Income" {...field} type="number" disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="monthlyIncome" render={({ field }) => (<FormItem><FormLabel>Monthly Income (₹)</FormLabel><FormControl><Input placeholder="Monthly Income" {...field} type="number" disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="loanAmountRequired" render={({ field }) => (<FormItem><FormLabel>Loan Amount Required (₹)</FormLabel><FormControl><Input placeholder="Loan Amount Required" {...field} type="number" disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="loanScheme" render={({ field }) => (<FormItem><FormLabel>Loan Scheme</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isFormDisabled}><FormControl><SelectTrigger><SelectValue placeholder="Select a scheme" /></SelectTrigger></FormControl><SelectContent position="popper">{loanSchemes.map((scheme) => (<SelectItem key={scheme.schemeName} value={scheme.schemeName}>{scheme.schemeName}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="repaymentType" render={({ field }) => (<FormItem><FormLabel>Repayment Type</FormLabel><FormControl><RadioGroup value={field.value} onValueChange={field.onChange} className="flex space-x-4 pt-2" disabled={isFormDisabled}><FormItem className="flex items-center space-x-2"><RadioGroupItem value="Daily" id="daily" /><FormLabel htmlFor="daily">Daily</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><RadioGroupItem value="Weekly" id="weekly" /><FormLabel htmlFor="weekly">Weekly</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><RadioGroupItem value="Monthly" id="monthly" /><FormLabel htmlFor="monthly">Monthly</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="tenurePeriod" render={({ field }) => (<FormItem><FormLabel>Tenure Period</FormLabel><FormControl><Input placeholder={`in ${form.getValues('repaymentType') === 'Daily' ? 'Days' : form.getValues('repaymentType') === 'Weekly' ? 'Weeks' : 'Months'}`} {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                      
                      <FormField control={form.control} name="securityForLoan" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Security for Loan (if any)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isFormDisabled}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select Security Type" /></SelectTrigger>
                            </FormControl>
                            <SelectContent position="popper">
                              {documentOptions.map(doc => <SelectItem key={doc} value={doc}>{doc}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      {securityForLoanType === 'Other' && <FormField control={form.control} name="securityForLoanOther" render={({ field }) => (<FormItem><FormLabel>Specify Other Security</FormLabel><FormControl><Input placeholder="Enter security detail" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />}

                  </div>
              </fieldset>

              <fieldset className="border p-4 rounded-lg">
                  <legend className="px-2 font-medium text-primary -ml-2">6. Branch Assignment</legend>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <FormField control={form.control} name="assignedBranchCode" render={({ field }) => (<FormItem><FormLabel>Assign to Branch</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isFormDisabled}><FormControl><SelectTrigger><SelectValue placeholder="Select Main Branch" /></SelectTrigger></FormControl><SelectContent position="popper">{branches.filter(b => b.branchType === 'Branch').map(branch => (<SelectItem key={branch.branchCode} value={branch.branchCode}>{branch.branchCode} - {branch.branchName}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="assignedSubBranchCode" render={({ field }) => (<FormItem><FormLabel>Assign to Sub-Branch (Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value || ''} disabled={isFormDisabled || !form.watch('assignedBranchCode')}><FormControl><SelectTrigger><SelectValue placeholder="Select Sub-Branch" /></SelectTrigger></FormControl><SelectContent position="popper">{branches.filter(b => b.branchType === 'Sub-Branch' && b.parentBranch === form.watch('assignedBranchCode')).map(branch => (<SelectItem key={branch.branchCode} value={branch.branchCode}>{branch.branchCode} - {branch.branchName}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                  </div>
              </fieldset>

              {isViewingMode && (
                <fieldset className="border p-4 rounded-lg border-blue-500 bg-blue-50/20">
                  <legend className="px-2 font-medium text-blue-700 -ml-2">7. Admin Verification & Loan Sanction</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 pt-4">
                    <FormField control={form.control} name="loanAmountApproved" render={({ field }) => (<FormItem><FormLabel>Loan Amount Approved (₹)</FormLabel><FormControl><Input placeholder="Sanctioned Amount" {...field} type="number" disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="interestRate" render={({ field }) => (<FormItem><FormLabel>Final Interest Rate (%)</FormLabel><FormControl><Input placeholder="Interest Rate" {...field} type="number" disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="processingFee" render={({ field }) => (<FormItem><FormLabel>Final Processing Fee (₹)</FormLabel><FormControl><Input placeholder="Processing Fee" {...field} type="number" disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="dailyEMI" render={({ field }) => (<FormItem><FormLabel>Daily EMI (₹)</FormLabel><FormControl><Input placeholder="Daily EMI" {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="weeklyEMI" render={({ field }) => (<FormItem><FormLabel>Weekly EMI (₹)</FormLabel><FormControl><Input placeholder="Weekly EMI" {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="monthlyEMI" render={({ field }) => (<FormItem><FormLabel>Monthly EMI (₹)</FormLabel><FormControl><Input placeholder="Monthly EMI" {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
                    
                    <FormField
                      control={form.control}
                      name="autoFine"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-white">
                          <div className="space-y-0.5">
                            <FormLabel>Auto Fine</FormLabel>
                            <FormDescription className="text-xs">Enable auto fine for late payments.</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isFormDisabled} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                     <FormField control={form.control} name="finePerMissedPayment" render={({ field }) => (<FormItem><FormLabel>Fine Per Missed Payment (₹)</FormLabel><FormControl><Input placeholder="Fine Amount" {...field} disabled={isFormDisabled || !form.watch('autoFine')} /></FormControl><FormMessage /></FormItem>)} />
                    
                    <FormField
                      control={form.control}
                      name="isVerified"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-white">
                          <div className="space-y-0.5">
                            <FormLabel>Verified</FormLabel>
                            <FormDescription className="text-xs">Mark as verified to enable actions.</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isFormDisabled} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField control={form.control} name="adminRemarks" render={({ field }) => (<FormItem className="lg:col-span-3"><FormLabel>Admin Remarks</FormLabel><FormControl><Textarea placeholder="Add remarks for approval or rejection" {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                </fieldset>
              )}

              <div className="flex flex-wrap gap-4 pt-4">
                {isViewingMode ? (
                  <>
                    <Button
                      type="button"
                      onClick={handleApproval}
                      disabled={isSubmitting || applicationToView?.status !== 'Pending' || !form.watch('isVerified')}
                      className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" /> : 'Approve Application'}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleRejection}
                      disabled={isSubmitting || applicationToView?.status !== 'Pending' || !form.watch('isVerified')}
                      variant="destructive"
                      className="min-w-[120px]"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" /> : 'Reject Application'}
                    </Button>
                     <Button type="button" variant="outline" onClick={onCancelViewDetails}>
                      Back to List
                    </Button>
                  </>
                ) : (
                  <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Submit Application'}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};

export default LoanApplicationForm;
