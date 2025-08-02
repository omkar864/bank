
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LoanApplicationData } from '@/components/LoanApplication/LoanApplication';
import type { Branch } from '@/components/BranchManagement/BranchManagement';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, UserCircle2 } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useToast } from '@/hooks/use-toast'; 

interface CustomerManagementProps {
  customers: LoanApplicationData[];
  branches: Branch[];
}

const CustomerManagement = ({ customers, branches }: CustomerManagementProps) => {
  const [selectedCustomer, setSelectedCustomer] = useState<LoanApplicationData | null>(null);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const isSmallScreen = useMediaQuery('(max-width: 767px)');
  const { toast } = useToast(); 

  const handleViewProfile = (customer: LoanApplicationData) => {
    setSelectedCustomer(customer);
    setIsProfileSheetOpen(true);
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
  
  const getParentSpouseName = (customer: LoanApplicationData): string => {
    if (customer.husbandWifeName) return `Spouse: ${customer.husbandWifeName}`;
    if (customer.fatherName) return `Father: ${customer.fatherName}`;
    if (customer.motherName) return `Mother: ${customer.motherName}`;
    return 'N/A';
  };

  const getParentSpouseNameHindi = (customer: LoanApplicationData): string => {
    if (customer.husbandWifeNameHindi) return `पति/पत्नी: ${customer.husbandWifeNameHindi}`;
    if (customer.fatherNameHindi) return `पिता: ${customer.fatherNameHindi}`;
    if (customer.motherNameHindi) return `माता: ${customer.motherNameHindi}`;
    return 'उपलब्ध नहीं';
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
      toast({
        title: "Opening Document",
        description: `Opening ${documentName || 'document'} in a new tab.`,
      });
    } else {
      toast({
        title: "Document Not Available",
        description: `The URL for ${documentName || 'this document'} is missing.`,
        variant: "destructive",
      });
    }
  };


  const renderCustomerCard = (customer: LoanApplicationData) => (
    <Card key={customer.id} className="mb-4 shadow-md hover:shadow-lg transition-shadow rounded-lg overflow-hidden">
      <CardHeader className="pb-3 bg-muted/50 border-b p-4">
        <div className="flex items-center gap-3">
          <UserCircle2 className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-lg">{customer.customerName}</CardTitle>
            <ShadCardDescription className="text-xs">
              ID: {customer.id} {customer.customerNameHindi && `/ ${customer.customerNameHindi}`}
            </ShadCardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-2 text-sm">
        <div><span className="font-semibold text-muted-foreground">Branch:</span> {getBranchName(customer.assignedBranchCode, customer.assignedSubBranchCode)}</div>
        <div><span className="font-semibold text-muted-foreground">Parent/Spouse:</span> {getParentSpouseName(customer)}</div>
        {customer.fatherNameHindi && <div><span className="font-semibold text-muted-foreground">माता-पिता/पति/पत्नी (हि):</span> {getParentSpouseNameHindi(customer)}</div>}
        <div><span className="font-semibold text-muted-foreground">Loan:</span> ₹{customer.loanAmountApproved || customer.loanAmountRequired} ({customer.repaymentType || 'N/A'})</div>
      </CardContent>
      <div className="p-4 pt-2 border-t bg-muted/20">
        <Button variant="outline" size="sm" onClick={() => handleViewProfile(customer)} className="w-full mt-2">
          <Eye className="mr-2 h-4 w-4" /> View Full Profile
        </Button>
      </div>
    </Card>
  );

  const DetailItem = ({ label, value, isHindi = false }: { label: string, value?: string | number | null, isHindi?: boolean }) => {
    if (!value && value !== 0 && value !== '') return null; // Allow empty string to be rendered if explicitly passed
    return (
      <div>
        <span className={`block text-xs font-medium ${isHindi ? 'text-sky-600' : 'text-muted-foreground'}`}>{label}</span>
        <span className={`block text-sm ${isHindi ? 'font-devanagari' : ''}`}>{value || 'N/A'}</span>
      </div>
    );
  };


  return (
    <Card className="shadow-xl rounded-xl overflow-hidden">
      <CardHeader className="bg-card-foreground text-background p-6">
        <CardTitle className="text-2xl">Customer Management</CardTitle>
        <ShadCardDescription className="text-muted">View and manage profiles of customers with approved loans.</ShadCardDescription>
      </CardHeader>
      <CardContent className="p-0 md:p-0"> {/* Adjusted padding for full-width table/cards */}
        {customers.length > 0 ? (
          isSmallScreen ? (
            <ScrollArea className="h-[calc(100vh-200px)] w-full p-4"> {/* Add padding for card view */}
              {customers.map(renderCustomerCard)}
            </ScrollArea>
          ) : (
            <ScrollArea className="w-full h-[calc(100vh-200px)]">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                  <TableRow>
                    <TableHead className="hidden sm:table-cell px-4 py-3">ID</TableHead>
                    <TableHead className="px-4 py-3">Customer Name</TableHead>
                    <TableHead className="hidden xl:table-cell px-4 py-3">नाम (हिन्दी)</TableHead>
                    <TableHead className="hidden md:table-cell px-4 py-3">Branch</TableHead>
                    <TableHead className="hidden lg:table-cell px-4 py-3">Parent/Spouse</TableHead>
                    <TableHead className="hidden xl:table-cell px-4 py-3">अभिभावक (हिन्दी)</TableHead>
                    <TableHead className="px-4 py-3">Loan (₹)</TableHead>
                    <TableHead className="hidden sm:table-cell px-4 py-3">EMI Type</TableHead>
                    <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="hidden sm:table-cell px-4 py-3 font-mono text-xs">{customer.id}</TableCell>
                      <TableCell className="px-4 py-3 font-medium">{customer.customerName}</TableCell>
                      <TableCell className="hidden xl:table-cell px-4 py-3">{customer.customerNameHindi || 'N/A'}</TableCell>
                      <TableCell className="hidden md:table-cell px-4 py-3">{getBranchName(customer.assignedBranchCode, customer.assignedSubBranchCode)}</TableCell>
                      <TableCell className="hidden lg:table-cell px-4 py-3 text-xs">{getParentSpouseName(customer)}</TableCell>
                      <TableCell className="hidden xl:table-cell px-4 py-3 text-xs">{getParentSpouseNameHindi(customer)}</TableCell>
                      <TableCell className="px-4 py-3">₹{customer.loanAmountApproved || customer.loanAmountRequired}</TableCell>
                      <TableCell className="hidden sm:table-cell px-4 py-3"><Badge variant="outline">{customer.repaymentType || 'N/A'}</Badge></TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewProfile(customer)} className="text-primary hover:text-primary/80">
                          <Eye className="h-4 w-4 mr-0 sm:mr-2" />
                          <span className="hidden sm:inline">View Profile</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )
        ) : (
          <div className="text-center text-muted-foreground py-12 flex flex-col items-center h-[calc(100vh-200px)] justify-center">
            <UserCircle2 className="h-16 w-16 mb-4 text-muted-foreground/50" />
            <p className="text-lg">No customers found.</p>
            <p className="text-sm">Approved loan applications will appear here.</p>
          </div>
        )}

        {selectedCustomer && (
          <Sheet open={isProfileSheetOpen} onOpenChange={setIsProfileSheetOpen}>
            <SheetContent className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 flex flex-col">
                <SheetHeader className="p-6 bg-muted text-foreground border-b">
                  <SheetTitle className="text-xl md:text-2xl">
                    {selectedCustomer.customerName}
                    {selectedCustomer.customerNameHindi && ` / ${selectedCustomer.customerNameHindi}`}
                  </SheetTitle>
                  <SheetDescription className="text-muted-foreground">Customer Profile (ID: {selectedCustomer.id})</SheetDescription>
                </SheetHeader>
              <ScrollArea className="flex-grow"> 
                <div className="p-6 space-y-6">
                  <Card className="shadow-lg rounded-lg">
                    <CardHeader className="border-b bg-muted/30 p-4"><CardTitle className="text-lg">1. Personal Details (व्यक्तिगत जानकारी)</CardTitle></CardHeader>
                    <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <DetailItem label="Name (English)" value={selectedCustomer.customerName} />
                      <DetailItem label="नाम (हिन्दी)" value={selectedCustomer.customerNameHindi} isHindi />
                      <DetailItem label="Date of Birth" value={selectedCustomer.dateOfBirth ? new Date(selectedCustomer.dateOfBirth).toLocaleDateString() : 'N/A'} />
                      <DetailItem label="Age" value={calculateAge(selectedCustomer.dateOfBirth)} />
                      <DetailItem label="Gender" value={selectedCustomer.gender} />
                      <DetailItem label="Father's Name" value={selectedCustomer.fatherName} />
                      <DetailItem label="पिता का नाम (हिन्दी)" value={selectedCustomer.fatherNameHindi} isHindi />
                      <DetailItem label="Mother's Name" value={selectedCustomer.motherName} />
                      <DetailItem label="माता का नाम (हिन्दी)" value={selectedCustomer.motherNameHindi} isHindi />
                      <DetailItem label="Spouse's Name" value={selectedCustomer.husbandWifeName} />
                      <DetailItem label="पति/पत्नी का नाम (हिन्दी)" value={selectedCustomer.husbandWifeNameHindi} isHindi />
                      <DetailItem label="Mobile Number" value={selectedCustomer.mobileNumber} />
                      <DetailItem label="Alternate Contact" value={selectedCustomer.alternateMobileNumber} />
                      <div className="md:col-span-2"><DetailItem label="Residential Address" value={selectedCustomer.residentialAddress} /></div>
                      <div className="md:col-span-2"><DetailItem label="आवासीय पता (हिन्दी)" value={selectedCustomer.residentialAddressHindi} isHindi /></div>
                      <div className="md:col-span-2"><DetailItem label="Permanent Address" value={selectedCustomer.permanentAddress} /></div>
                      <div className="md:col-span-2"><DetailItem label="स्थायी पता (हिन्दी)" value={selectedCustomer.permanentAddressHindi} isHindi /></div>
                      <div className="md:col-span-2"><DetailItem label="Branch Assignment" value={getBranchName(selectedCustomer.assignedBranchCode, selectedCustomer.assignedSubBranchCode)} /></div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg rounded-lg">
                    <CardHeader className="border-b bg-muted/30 p-4"><CardTitle className="text-lg">2. Loan Details (ऋण विवरण)</CardTitle></CardHeader>
                    <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <DetailItem label="Loan ID" value={selectedCustomer.id} />
                      <DetailItem label="Sanctioned Amount" value={`₹${selectedCustomer.loanAmountApproved || selectedCustomer.loanAmountRequired}`} />
                      <DetailItem label="Loan Scheme" value={selectedCustomer.loanScheme} />
                      <DetailItem label="Interest Rate" value={`${selectedCustomer.interestRate || 'N/A'}%`} />
                      <DetailItem label="Processing Fee" value={`₹${selectedCustomer.processingFee || 'N/A'}`} />
                      <DetailItem label="Late Fine/Other Charges" value={`₹${selectedCustomer.lateFine || 'N/A'}`} />
                      <DetailItem label="EMI Type" value={selectedCustomer.repaymentType} />
                      <DetailItem label="EMI Amount" value={`₹${
                          selectedCustomer.repaymentType === 'Daily' ? selectedCustomer.dailyEMI :
                          selectedCustomer.repaymentType === 'Weekly' ? selectedCustomer.weeklyEMI :
                          selectedCustomer.repaymentType === 'Monthly' ? selectedCustomer.monthlyEMI : 'N/A'}`} />
                      <DetailItem label="Loan Duration" value={`${selectedCustomer.tenurePeriod || 'N/A'} ${selectedCustomer.repaymentType ? (selectedCustomer.repaymentType === 'Daily' ? 'Days' : selectedCustomer.repaymentType === 'Weekly' ? 'Weeks' : 'Months') : ''}`} />
                      <DetailItem label="Approval Date" value={selectedCustomer.approvalDate ? new Date(selectedCustomer.approvalDate).toLocaleDateString() : 'N/A'} />
                      <DetailItem label="Total Loan (incl. interest)" value="₹ Placeholder" />
                      <DetailItem label="Total Paid" value="₹ Placeholder" />
                      <DetailItem label="Total Remaining" value="₹ Placeholder" />
                      <DetailItem label="Remaining Tenure" value="Placeholder" />
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg rounded-lg">
                    <CardHeader className="border-b bg-muted/30 p-4"><CardTitle className="text-lg">3. Guarantor Information (जमानतकर्ता जानकारी)</CardTitle></CardHeader>
                    <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <DetailItem label="Full Name" value={selectedCustomer.guarantorName} />
                      <DetailItem label="नाम (हिन्दी)" value={selectedCustomer.guarantorNameHindi} isHindi />
                      <DetailItem label="Contact Number" value={selectedCustomer.guarantorMobileNumber} />
                      <DetailItem label="Document Name" value={selectedCustomer.guarantorDocumentType} />
                      <DetailItem label="Document Number" value={selectedCustomer.guarantorDocumentNumber} />
                      <div className="md:col-span-2"><DetailItem label="Address" value={selectedCustomer.guarantorAddress} /></div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg rounded-lg">
                    <CardHeader className="border-b bg-muted/30 p-4"><CardTitle className="text-lg">4. Documents (दस्तावेज़)</CardTitle></CardHeader>
                    <CardContent className="p-4 md:p-6 space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                        <div>
                          <p className="font-medium">{selectedCustomer.identityDocumentType || 'Identity Document'}</p>
                          <p className="text-xs text-muted-foreground">{selectedCustomer.identityDocumentNumber || 'N/A'}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleDocumentPreview(selectedCustomer.identityDocumentFileUrl, selectedCustomer.identityDocumentType)}>
                            <Download className="mr-1.5 h-4 w-4" /> Preview
                        </Button>
                      </div>
                       <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                        <div>
                          <p className="font-medium">{selectedCustomer.addressProofDocumentType || 'Address Proof'}</p>
                          <p className="text-xs text-muted-foreground">{selectedCustomer.addressProofDocumentNumber || 'N/A'}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleDocumentPreview(selectedCustomer.addressProofDocumentFileUrl, selectedCustomer.addressProofDocumentType)}>
                            <Download className="mr-1.5 h-4 w-4" /> Preview
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                        <div>
                          <p className="font-medium">{selectedCustomer.guarantorDocumentType || 'Guarantor Document'}</p>
                          <p className="text-xs text-muted-foreground">{selectedCustomer.guarantorDocumentNumber || 'N/A'}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleDocumentPreview(selectedCustomer.guarantorDocumentFileUrl, selectedCustomer.guarantorDocumentType)}>
                            <Download className="mr-1.5 h-4 w-4" /> Preview
                        </Button>
                      </div>
                      <div className="flex items-start justify-between p-3 border rounded-md hover:bg-muted/50">
                        <div>
                          <p className="font-medium">Customer Photo</p>
                          <img id="customer-profile-photo" src={selectedCustomer.customerPhotoUrl || "https://placehold.co/100x100.png"} alt="Customer" className="mt-2 h-20 w-20 rounded-md border object-cover" data-ai-hint="person photo"/>
                        </div>
                         <Button variant="outline" size="sm" onClick={() => handleDocumentPreview(selectedCustomer.customerPhotoUrl, 'Customer Photo')}>
                            <Download className="mr-1.5 h-4 w-4" /> View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <SheetFooter className="p-6 border-t bg-background"> {/* Ensure footer has a background */}
                  <SheetClose asChild>
                    <Button type="button" variant="outline">Close Profile</Button>
                  </SheetClose>
                </SheetFooter>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerManagement;
