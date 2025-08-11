
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
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Button} from '@/components/ui/button';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Textarea} from '@/components/ui/textarea';
import {Switch} from '@/components/ui/switch';
import {Badge} from '@/components/ui/badge';
import {useEffect, useCallback, useMemo, useState} from 'react';
import type { LoanApplicationData } from './LoanApplication';
import type { LoanSchemeFormValues } from '../LoanSchemeManagement/SchemeCreateForm';
import type { Branch } from '../BranchManagement/BranchManagement';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase/clientApp';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";


const loanApplicationSchema = z.object({
  // Personal Details
  customerName: z.string().min(2, "Customer Name must be at least 2 characters."),
  customerNameHindi: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of Birth is required."),
  gender: z.enum(['Male', 'Female', 'Other']),
  fatherName: z.string().min(2, "Father's name is required."),
  fatherNameHindi: z.string().optional(),
  motherName: z.string().min(2, "Mother's name is required."),
  motherNameHindi: z.string().optional(),
  husbandWifeName: z.string().optional(),
  husbandWifeNameHindi: z.string().optional(),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits."),
  alternateMobileNumber: z.string().optional(),
  
  // Address
  residentialAddress: z.string().min(5, "Residential address is required."),
  residentialAddressHindi: z.string().optional(),
  city: z.string().min(2, "City is required."),
  cityHindi: z.string().optional(),
  state: z.string().min(2, "State is required."),
  stateHindi: z.string().optional(),
  pincode: z.string().min(6, "Pincode must be 6 digits."),
  pincodeHindi: z.string().optional(),
  permanentAddress: z.string().min(5, "Permanent address is required."),
  permanentAddressHindi: z.string().optional(),

  // Work
  companyShopName: z.string().min(2, "Company/Shop name is required."),
  companyShopAddress: z.string().min(5, "Company/Shop address is required."),

  // Documents
  identityDocumentType: z.string().min(1, "Identity document type is required."),
  identityDocumentNumber: z.string().min(1, "Identity document number is required."),
  identityDocumentFile: z.any().optional(),
  addressProofDocumentType: z.string().min(1, "Address proof type is required."),
  addressProofDocumentNumber: z.string().min(1, "Address proof number is required."),
  addressProofDocumentFile: z.any().optional(),
  customerPhotoFile: z.any().optional(),
  
  // Guarantor
  guarantorName: z.string().min(2, "Guarantor name is required."),
  guarantorMobileNumber: z.string().min(10, "Guarantor mobile number is required."),
  guarantorAddress: z.string().min(5, "Guarantor address is required."),
  guarantorDocumentType: z.string().min(1, "Guarantor document type is required."),
  guarantorDocumentNumber: z.string().min(1, "Guarantor document number is required."),
  guarantorDocumentFile: z.any().optional(),

  // Financial
  annualIncome: z.string().min(1, "Annual income is required."),
  monthlyIncome: z.string().min(1, "Monthly income is required."),

  // Loan
  loanAmountRequired: z.string().min(1, "Loan amount is required."),
  repaymentType: z.enum(['Daily', 'Weekly', 'Monthly']),
  tenurePeriod: z.string().min(1, "Tenure period is required."),
  loanScheme: z.string().min(1, "A loan scheme must be selected."),
  securityForLoan: z.string().optional(),
  
  // Branch Assignment
  assignedBranchCode: z.string().min(1, "A branch must be assigned."),
  assignedSubBranchCode: z.string().optional(),
  
  // These fields are populated from the selected scheme, but are part of the form state for display/approval
  loanType: z.string().optional(),
  interestRate: z.string().optional(),
  processingFee: z.string().optional(),
  lateFine: z.string().optional(),
  
  // Approval related fields
  loanAmountApproved: z.string().optional(),
  isVerified: z.boolean().default(false),
  adminRemarks: z.string().optional(),
  dailyEMI: z.string().optional(),
  weeklyEMI: z.string().optional(),
  monthlyEMI: z.string().optional(),
  autoFine: z.boolean().default(false),
  finePerMissedPayment: z.string().optional(),
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

const LoanApplicationForm = ({
  translateToHindi,
  loanSchemes,
  branches,
  applicationToView,
  onApplicationSubmittedSuccessfully,
  onApproveApplication,
  onRejectApplication,
  onCancelViewDetails,
}: LoanApplicationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!applicationToView;

  const form = useForm<LoanApplicationFormValues>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      isVerified: false,
      autoFine: false,
      repaymentType: 'Daily',
      gender: 'Male',
      // Initialize all fields to avoid uncontrolled component warnings
      customerName: '', customerNameHindi: '', dateOfBirth: '', fatherName: '', fatherNameHindi: '',
      motherName: '', motherNameHindi: '', husbandWifeName: '', husbandWifeNameHindi: '', mobileNumber: '',
      alternateMobileNumber: '', residentialAddress: '', residentialAddressHindi: '', city: '', cityHindi: '',
      state: '', stateHindi: '', pincode: '', pincodeHindi: '', permanentAddress: '', permanentAddressHindi: '',
      companyShopName: '', companyShopAddress: '', identityDocumentType: '', identityDocumentNumber: '',
      addressProofDocumentType: '', addressProofDocumentNumber: '', guarantorName: '', guarantorMobileNumber: '',
      guarantorAddress: '', guarantorDocumentType: '', guarantorDocumentNumber: '', annualIncome: '',
      monthlyIncome: '', loanAmountRequired: '', tenurePeriod: '', loanScheme: '', securityForLoan: '',
      assignedBranchCode: '', assignedSubBranchCode: '', loanType: '', interestRate: '',
      processingFee: '', lateFine: '', loanAmountApproved: '', adminRemarks: '', dailyEMI: '',
      weeklyEMI: '', monthlyEMI: '', finePerMissedPayment: '',
    },
  });

  const mainBranches = useMemo(() => branches.filter(b => b.branchType === 'Branch'), [branches]);
  const subBranches = useMemo(() => branches.filter(b => b.branchType === 'Sub-Branch'), [branches]);
  const selectedMainBranchCode = form.watch('assignedBranchCode');
  const relevantSubBranches = useMemo(() => subBranches.filter(sb => sb.parentBranch === selectedMainBranchCode), [subBranches, selectedMainBranchCode]);


  // Effect to populate form when viewing/editing an application
  useEffect(() => {
    if (applicationToView) {
      form.reset({
        ...applicationToView,
        loanAmountApproved: applicationToView.loanAmountApproved || applicationToView.loanAmountRequired,
        gender: applicationToView.gender as 'Male' | 'Female' | 'Other',
        identityDocumentFile: undefined, // Clear file inputs
        addressProofDocumentFile: undefined,
        customerPhotoFile: undefined,
        guarantorDocumentFile: undefined,
      });
    } else {
      form.reset(); // Reset to default values for new application
    }
  }, [applicationToView, form]);

  // Effect to auto-fill scheme details when a scheme is selected
  useEffect(() => {
    const selectedSchemeName = form.watch('loanScheme');
    const selectedScheme = loanSchemes.find(s => s.schemeName === selectedSchemeName);
    if (selectedScheme) {
      form.setValue('interestRate', String(selectedScheme.interestRate));
      form.setValue('processingFee', String(selectedScheme.processingFee));
      form.setValue('loanType', selectedScheme.loanType);
      form.setValue('lateFine', String(selectedScheme.lateFine));
    }
  }, [form.watch('loanScheme'), loanSchemes, form]);
  
  // NEW: Debounced translation handler
  const handleTranslateOnBlur = useCallback(async (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
    hindiFieldName: keyof LoanApplicationFormValues
  ) => {
      const valueToTranslate = e.target.value;
      if (typeof valueToTranslate === 'string' && valueToTranslate.trim() !== '') {
          try {
              const translatedText = await translateToHindi(valueToTranslate);
              form.setValue(hindiFieldName, translatedText);
          } catch (error) {
              console.error("Translation failed:", error);
              toast({ title: "Translation Error", description: "Could not auto-translate field.", variant: "destructive" });
          }
      }
  }, [translateToHindi, form, toast]);


  // EMI Calculation logic
  const calculateEMI = useCallback(() => {
    const loanAmountApproved = parseFloat(form.getValues('loanAmountApproved') || '0');
    const interestRate = parseFloat(form.getValues('interestRate') || '0') / 100;
    const tenurePeriod = parseInt(form.getValues('tenurePeriod') || '0');
    const repaymentType = form.getValues('repaymentType');

    if (!loanAmountApproved || !interestRate || !tenurePeriod || repaymentType === undefined) {
      form.setValue('dailyEMI', '0');
      form.setValue('weeklyEMI', '0');
      form.setValue('monthlyEMI', '0');
      return;
    }

    const totalInterest = loanAmountApproved * interestRate;
    const totalAmount = loanAmountApproved + totalInterest;

    let dailyEMI = '0', weeklyEMI = '0', monthlyEMI = '0';

    if (repaymentType === 'Daily') dailyEMI = (totalAmount / tenurePeriod).toFixed(2);
    else if (repaymentType === 'Weekly') weeklyEMI = (totalAmount / tenurePeriod).toFixed(2);
    else if (repaymentType === 'Monthly') monthlyEMI = (totalAmount / tenurePeriod).toFixed(2);

    form.setValue('dailyEMI', dailyEMI);
    form.setValue('weeklyEMI', weeklyEMI);
    form.setValue('monthlyEMI', monthlyEMI);

  }, [form]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (['loanAmountApproved', 'interestRate', 'tenurePeriod', 'repaymentType'].includes(name as string)) {
        calculateEMI();
      }
    });
    return () => subscription.unsubscribe();
  }, [form, calculateEMI]);


  // File upload logic
  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storage = getStorage(app);
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };
  
  // Form submission handler
  const onSubmit = async (values: LoanApplicationFormValues) => {
    setIsSubmitting(true);
    try {
      const firebaseFunctions = getFunctions(app);
      const submitLoanApplicationFn = httpsCallable(firebaseFunctions, 'submitnewloanapplication');

      // 1. Upload files and get URLs
      const fileUploadPromises = [];
      const now = Date.now();
      if (values.identityDocumentFile) fileUploadPromises.push(uploadFile(values.identityDocumentFile, `documents/${values.mobileNumber}_${now}_id.jpg`).then(url => ({ key: 'identityDocumentFileUrl', url })));
      if (values.addressProofDocumentFile) fileUploadPromises.push(uploadFile(values.addressProofDocumentFile, `documents/${values.mobileNumber}_${now}_address.jpg`).then(url => ({ key: 'addressProofDocumentFileUrl', url })));
      if (values.customerPhotoFile) fileUploadPromises.push(uploadFile(values.customerPhotoFile, `photos/${values.mobileNumber}_${now}_customer.jpg`).then(url => ({ key: 'customerPhotoUrl', url })));
      if (values.guarantorDocumentFile) fileUploadPromises.push(uploadFile(values.guarantorDocumentFile, `documents/${values.mobileNumber}_${now}_guarantor.jpg`).then(url => ({ key: 'guarantorDocumentFileUrl', url })));

      const uploadedFiles = await Promise.all(fileUploadPromises);
      
      const fileUrls: { [key: string]: string } = {};
      uploadedFiles.forEach(file => {
          fileUrls[file.key] = file.url;
      });
      
      // 2. Prepare payload for Cloud Function
      const payload = {
          ...values,
          ...fileUrls
      };

      // Clean up file objects from payload
      delete (payload as any).identityDocumentFile;
      delete (payload as any).addressProofDocumentFile;
      delete (payload as any).customerPhotoFile;
      delete (payload as any).guarantorDocumentFile;

      // 3. Call Cloud Function
      const result: any = await submitLoanApplicationFn(payload);

      if (result.data.success) {
        toast({ title: "Success", description: result.data.message });
        onApplicationSubmittedSuccessfully(result.data.data as LoanApplicationData);
      } else {
        throw new Error(result.data.message || 'An unknown error occurred.');
      }
    } catch (error: any) {
      console.error("Submission failed:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprovalAction = (action: 'approve' | 'reject') => {
      const values = form.getValues();
      if (action === 'approve') {
          onApproveApplication(applicationToView!.id, values);
      } else {
          onRejectApplication(applicationToView!.id, values);
      }
  }

  return (
    <Card className="shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-2xl">{isEditing ? `Review Application: ${applicationToView.customerName}` : 'New Loan Application Form'}</CardTitle>
        <CardDescription>{isEditing ? `Application ID: ${applicationToView.id}` : 'Fill in the details for a new loan.'}</CardDescription>
        {applicationToView && (
          <Badge variant={applicationToView.status === 'Approved' ? 'default' : applicationToView.status === 'Rejected' ? 'destructive' : 'secondary'}>
            Status: {applicationToView.status}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* Personal Details Section */}
            <div className="space-y-4 border p-4 rounded-md">
                <h3 className="text-lg font-semibold border-b pb-2">Personal Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="customerName" render={({ field }) => (
                        <FormItem><FormLabel>Customer Name (English)</FormLabel><FormControl><Input placeholder="Customer Name" {...field} onBlur={(e) => handleTranslateOnBlur(e, 'customerNameHindi')} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="customerNameHindi" render={({ field }) => (
                        <FormItem><FormLabel>Customer Name (Hindi)</FormLabel><FormControl><Input placeholder="ग्राहक का नाम" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                        <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="gender" render={({ field }) => (
                        <FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="fatherName" render={({ field }) => (
                        <FormItem><FormLabel>Father’s Name</FormLabel><FormControl><Input placeholder="Father’s Name" {...field} onBlur={(e) => handleTranslateOnBlur(e, 'fatherNameHindi')} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="fatherNameHindi" render={({ field }) => (
                        <FormItem><FormLabel>Father’s Name (Hindi)</FormLabel><FormControl><Input placeholder="पिता का नाम" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="motherName" render={({ field }) => (
                        <FormItem><FormLabel>Mother’s Name</FormLabel><FormControl><Input placeholder="Mother’s Name" {...field} onBlur={(e) => handleTranslateOnBlur(e, 'motherNameHindi')} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="motherNameHindi" render={({ field }) => (
                        <FormItem><FormLabel>Mother’s Name (Hindi)</FormLabel><FormControl><Input placeholder="माता का नाम" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="husbandWifeName" render={({ field }) => (
                        <FormItem><FormLabel>Husband/Wife Name (Optional)</FormLabel><FormControl><Input placeholder="Husband/Wife Name" {...field} onBlur={(e) => handleTranslateOnBlur(e, 'husbandWifeNameHindi')} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="husbandWifeNameHindi" render={({ field }) => (
                        <FormItem><FormLabel>Husband/Wife Name (Hindi)</FormLabel><FormControl><Input placeholder="पति/पत्नी का नाम" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="mobileNumber" render={({ field }) => (
                        <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input placeholder="Mobile Number" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="alternateMobileNumber" render={({ field }) => (
                        <FormItem><FormLabel>Alternate Mobile (Optional)</FormLabel><FormControl><Input placeholder="Alternate Mobile" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            </div>
            
            {/* Address Section */}
             <div className="space-y-4 border p-4 rounded-md">
                <h3 className="text-lg font-semibold border-b pb-2">Address Details</h3>
                <FormField control={form.control} name="residentialAddress" render={({ field }) => (
                    <FormItem><FormLabel>Residential Address</FormLabel><FormControl><Textarea placeholder="Residential Address" {...field} onBlur={(e) => handleTranslateOnBlur(e, 'residentialAddressHindi')} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="residentialAddressHindi" render={({ field }) => (
                    <FormItem><FormLabel>Residential Address (Hindi)</FormLabel><FormControl><Textarea placeholder="घर का पता" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="City" {...field} onBlur={(e) => handleTranslateOnBlur(e, 'cityHindi')} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="State" {...field} onBlur={(e) => handleTranslateOnBlur(e, 'stateHindi')} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="pincode" render={({ field }) => (
                        <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input placeholder="Pincode" {...field} onBlur={(e) => handleTranslateOnBlur(e, 'pincodeHindi')} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                <FormField control={form.control} name="permanentAddress" render={({ field }) => (
                    <FormItem><FormLabel>Permanent Address</FormLabel><FormControl><Textarea placeholder="Permanent Address" {...field} onBlur={(e) => handleTranslateOnBlur(e, 'permanentAddressHindi')} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="permanentAddressHindi" render={({ field }) => (
                    <FormItem><FormLabel>Permanent Address (Hindi)</FormLabel><FormControl><Textarea placeholder="स्थायी पता" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
             </div>

            {/* Occupation Section */}
            <div className="space-y-4 border p-4 rounded-md">
                <h3 className="text-lg font-semibold border-b pb-2">Occupation Details</h3>
                <FormField control={form.control} name="companyShopName" render={({ field }) => (
                    <FormItem><FormLabel>Company/Shop Name</FormLabel><FormControl><Input placeholder="Company/Shop Name" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="companyShopAddress" render={({ field }) => (
                    <FormItem><FormLabel>Company/Shop Address</FormLabel><FormControl><Textarea placeholder="Company/Shop Address" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>

            {/* Documents Section */}
             <div className="space-y-4 border p-4 rounded-md">
                <h3 className="text-lg font-semibold border-b pb-2">Document Details</h3>
                 <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="identityDocumentType" render={({ field }) => (
                        <FormItem><FormLabel>Identity Document Type</FormLabel><FormControl><Input placeholder="e.g., Aadhaar Card" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="identityDocumentNumber" render={({ field }) => (
                        <FormItem><FormLabel>Identity Document Number</FormLabel><FormControl><Input placeholder="Document Number" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="addressProofDocumentType" render={({ field }) => (
                        <FormItem><FormLabel>Address Proof Type</FormLabel><FormControl><Input placeholder="e.g., Electricity Bill" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="addressProofDocumentNumber" render={({ field }) => (
                        <FormItem><FormLabel>Address Proof Number</FormLabel><FormControl><Input placeholder="Document Number" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                 </div>
                 <h4 className="text-md font-semibold pt-2">File Uploads</h4>
                 <div className="grid md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="identityDocumentFile" render={({ field }) => (
                        <FormItem><FormLabel>Identity Document File</FormLabel><FormControl><Input type="file" onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="addressProofDocumentFile" render={({ field }) => (
                        <FormItem><FormLabel>Address Proof File</FormLabel><FormControl><Input type="file" onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}/></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="customerPhotoFile" render={({ field }) => (
                        <FormItem><FormLabel>Customer Photo</FormLabel><FormControl><Input type="file" onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}/></FormControl><FormMessage /></FormItem>
                    )}/>
                 </div>
            </div>

            {/* Guarantor Section */}
            <div className="space-y-4 border p-4 rounded-md">
                <h3 className="text-lg font-semibold border-b pb-2">Guarantor Details</h3>
                 <div className="grid md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="guarantorName" render={({ field }) => (
                        <FormItem><FormLabel>Guarantor Name</FormLabel><FormControl><Input placeholder="Guarantor Name" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="guarantorMobileNumber" render={({ field }) => (
                        <FormItem><FormLabel>Guarantor Mobile</FormLabel><FormControl><Input placeholder="Guarantor Mobile" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="guarantorDocumentType" render={({ field }) => (
                        <FormItem><FormLabel>Guarantor Document Type</FormLabel><FormControl><Input placeholder="e.g., PAN Card" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="guarantorDocumentNumber" render={({ field }) => (
                        <FormItem><FormLabel>Guarantor Document Number</FormLabel><FormControl><Input placeholder="Document Number" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                 </div>
                <FormField control={form.control} name="guarantorAddress" render={({ field }) => (
                    <FormItem><FormLabel>Guarantor Address</FormLabel><FormControl><Textarea placeholder="Guarantor Address" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="guarantorDocumentFile" render={({ field }) => (
                    <FormItem><FormLabel>Guarantor Document File</FormLabel><FormControl><Input type="file" onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            
            {/* Financial & Loan Section */}
             <div className="space-y-4 border p-4 rounded-md">
                <h3 className="text-lg font-semibold border-b pb-2">Financial & Loan Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="annualIncome" render={({ field }) => (
                        <FormItem><FormLabel>Annual Income (₹)</FormLabel><FormControl><Input type="number" placeholder="Annual Income" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="monthlyIncome" render={({ field }) => (
                        <FormItem><FormLabel>Monthly Income (₹)</FormLabel><FormControl><Input type="number" placeholder="Monthly Income" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="loanAmountRequired" render={({ field }) => (
                        <FormItem><FormLabel>Loan Amount Required (₹)</FormLabel><FormControl><Input type="number" placeholder="Loan Amount Required" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="loanScheme" render={({ field }) => (
                        <FormItem><FormLabel>Loan Scheme</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a scheme" /></SelectTrigger></FormControl><SelectContent>{loanSchemes.map(s => <SelectItem key={s.schemeName} value={s.schemeName}>{s.schemeName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="repaymentType" render={({ field }) => (
                        <FormItem><FormLabel>Repayment Type</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2"><FormItem><FormControl><RadioGroupItem value="Daily" id="daily" /></FormControl><FormLabel htmlFor="daily">Daily</FormLabel></FormItem><FormItem><FormControl><RadioGroupItem value="Weekly" id="weekly" /></FormControl><FormLabel htmlFor="weekly">Weekly</FormLabel></FormItem><FormItem><FormControl><RadioGroupItem value="Monthly" id="monthly" /></FormControl><FormLabel htmlFor="monthly">Monthly</FormLabel></FormItem></RadioGroup><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="tenurePeriod" render={({ field }) => (
                        <FormItem><FormLabel>Tenure Period</FormLabel><FormControl><Input placeholder="e.g., 365 (Days), 52 (Weeks), 12 (Months)" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                 <FormField control={form.control} name="securityForLoan" render={({ field }) => (
                    <FormItem><FormLabel>Security for Loan (Optional)</FormLabel><FormControl><Input placeholder="e.g., Gold, Property Papers" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            
            {/* Branch Assignment Section */}
            <div className="space-y-4 border p-4 rounded-md">
                <h3 className="text-lg font-semibold border-b pb-2">Branch Assignment</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="assignedBranchCode" render={({ field }) => (
                        <FormItem><FormLabel>Assign to Branch</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a main branch"/></SelectTrigger></FormControl><SelectContent>{mainBranches.map(b => <SelectItem key={b.branchCode} value={b.branchCode}>{b.branchCode} - {b.branchName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="assignedSubBranchCode" render={({ field }) => (
                        <FormItem><FormLabel>Assign to Sub-Branch (Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!selectedMainBranchCode}><FormControl><SelectTrigger><SelectValue placeholder="Select a sub-branch"/></SelectTrigger></FormControl><SelectContent>{relevantSubBranches.map(b => <SelectItem key={b.branchCode} value={b.branchCode}>{b.branchCode} - {b.branchName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )}/>
                </div>
            </div>

            {/* Admin Section (only visible when editing) */}
            {isEditing && (
              <div className="space-y-4 border p-4 rounded-md bg-muted/50">
                  <h3 className="text-lg font-semibold border-b pb-2 text-primary">Admin & Verification</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="loanAmountApproved" render={({ field }) => (
                          <FormItem><FormLabel>Loan Amount Approved (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <FormField control={form.control} name="dailyEMI" render={({ field }) => (
                          <FormItem><FormLabel>Calculated Daily EMI (₹)</FormLabel><FormControl><Input disabled {...field} /></FormControl></FormItem>
                      )}/>
                       <FormField control={form.control} name="weeklyEMI" render={({ field }) => (
                          <FormItem><FormLabel>Calculated Weekly EMI (₹)</FormLabel><FormControl><Input disabled {...field} /></FormControl></FormItem>
                      )}/>
                       <FormField control={form.control} name="monthlyEMI" render={({ field }) => (
                          <FormItem><FormLabel>Calculated Monthly EMI (₹)</FormLabel><FormControl><Input disabled {...field} /></FormControl></FormItem>
                      )}/>
                       <FormField control={form.control} name="autoFine" render={({ field }) => (
                          <FormItem className="flex items-center gap-2"><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl><FormLabel>Auto Fine on Missed Payments</FormLabel></FormItem>
                      )}/>
                      <FormField control={form.control} name="finePerMissedPayment" render={({ field }) => (
                        <FormItem><FormLabel>Fine Amount (₹)</FormLabel><FormControl><Input type="number" {...field} disabled={!form.watch('autoFine')} /></FormControl></FormItem>
                      )}/>
                  </div>
                  <FormField control={form.control} name="adminRemarks" render={({ field }) => (
                    <FormItem><FormLabel>Admin Remarks</FormLabel><FormControl><Textarea placeholder="Add remarks for approval or rejection" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="isVerified" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-background p-4 mt-4">
                            <FormLabel>Mark as Verified</FormLabel>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                  )}/>
              </div>
            )}


            <div className="flex justify-end space-x-4 pt-4">
              {isEditing ? (
                  <>
                      <Button type="button" variant="outline" onClick={onCancelViewDetails}>Cancel</Button>
                      <Button type="button" variant="destructive" onClick={() => handleApprovalAction('reject')}>Reject Application</Button>
                      <Button type="button" onClick={() => handleApprovalAction('approve')} disabled={!form.getValues('isVerified')}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Approve Application
                      </Button>
                  </>
              ) : (
                  <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Submit Application
                  </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LoanApplicationForm;

