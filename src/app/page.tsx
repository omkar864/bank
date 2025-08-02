
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader as ShadSheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebarContext,
  SidebarTrigger as ActualSidebarTrigger,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  Menu as MenuIcon,
  Building2,
  FileEdit,
  UserCircle2,
  Banknote,
  Contact,
  SigmaSquare,
  ListChecks,
  HandCoins,
  Loader2,
  KeyRound,
  Shield,
  Search,
  BookCopy,
} from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { format, startOfDay, subDays } from 'date-fns';

// Firebase and Firestore
import { db, app, auth } from '@/lib/firebase/clientApp';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, updateDoc, deleteDoc, Timestamp, where, writeBatch, setDoc, DocumentData } from 'firebase/firestore';

// Import the new Server Action
import { handleTransliteration } from '@/app/actions';

// Type imports
import type { LoanApplicationData } from '@/components/LoanApplication/LoanApplication';
import type { StoredUser } from '@/components/UserManagement/UserManagement';
import type { Branch, BranchFormValues as BranchFormValuesType } from '@/components/BranchManagement/BranchManagement';
import type { LoanSchemeFormValues } from '@/components/LoanSchemeManagement/SchemeCreateForm';
import type { LoanApplicationFormValues } from '@/components/LoanApplication/LoanApplicationForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';


interface DailyReportEntry {
  date: string;
  collectedToday: number;
  expectedToday: number;
}

const GenericSectionSkeleton = () => (
  <Card className="shadow-lg rounded-xl overflow-hidden">
    <CardHeader className="bg-muted/30 p-6">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2 mt-2" />
    </CardHeader>
    <CardContent className="p-6 space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-10 w-1/2" />
    </CardContent>
  </Card>
);

const DashboardSummaryCardsSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
    {[...Array(5)].map((_, i) => (
      <Card key={i} className="shadow-md rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-3 w-32 mt-2" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const DashboardChartsSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 mt-6">
    {[...Array(2)].map((_, i) => (
      <Card key={i}>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4 mt-1" />
        </CardHeader>
        <CardContent className="h-[300px]">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// Dynamically import components
const LoanApplicationForm = dynamic(() => import('@/components/LoanApplication/LoanApplicationForm'), {
  loading: () => <GenericSectionSkeleton />,
});
const LoanApplication = dynamic(() => import('@/components/LoanApplication/LoanApplication'), {
  loading: () => <GenericSectionSkeleton />,
});
const CustomerManagement = dynamic(() => import('@/components/CustomerManagement/CustomerManagement'), {
  loading: () => <GenericSectionSkeleton />,
});
const BranchCollectionReport = dynamic(() => import('@/components/BranchCollectionReport/BranchCollectionReport'), {
  loading: () => <GenericSectionSkeleton />,
});
const AgentCollections = dynamic(() => import('@/components/AgentCollections/AgentCollections'), {
  loading: () => <GenericSectionSkeleton />,
});
const BranchManagement = dynamic(() => import('@/components/BranchManagement/BranchManagement'), {
  loading: () => <GenericSectionSkeleton />,
});
const LoanSchemeManagement = dynamic(() => import('@/components/LoanSchemeManagement/LoanSchemeManagement'), {
  loading: () => <GenericSectionSkeleton />,
});
const UserManagement = dynamic(() => import('@/components/UserManagement/UserManagement'), {
  loading: () => <GenericSectionSkeleton />,
});
const RoleManagement = dynamic(() => import('@/components/RoleManagement/RoleManagement'), {
  loading: () => <GenericSectionSkeleton />,
});
const DashboardSummaryCards = dynamic(() => import('@/components/Dashboard/DashboardSummaryCards'), {
  ssr: false,
  loading: () => <DashboardSummaryCardsSkeleton />,
});
const DashboardCharts = dynamic(() => import('@/components/Dashboard/DashboardCharts'), {
  ssr: false,
  loading: () => <DashboardChartsSkeleton />,
});
const DailyCollectionReport = dynamic(() => import('@/components/Dashboard/DailyCollectionReport'), {
  ssr: false,
  loading: () => <GenericSectionSkeleton />,
});
const ChangePasswordDialog = dynamic(() => import('@/components/UserManagement/ChangePasswordDialog'), {
  loading: () => null,
});


const rolesData = [
  { name: 'Administrator', description: 'Full access to all system features.' },
  { name: 'Manager', description: 'Manages branches, users, and loan approvals.' },
  { name: 'Agent', description: 'Handles loan applications and customer interactions.' },
  { name: 'Collection Agent', description: 'Manages loan collections and follow-ups.' },
];

const permissionsData = [
  { id: 'dashboard', label: 'View Dashboard' },
  { id: 'newLoanApplication', label: 'Fill New Loan Application' },
  { id: 'loanApplications', label: 'Manage Loan Applications (New, Approved, Rejected)' },
  { id: 'customerManagement', label: 'Manage Customers (Approved Loans)'},
  { id: 'collectionReport', label: 'Branch-wise Collection Report' },
  { id: 'agentCollections', label: 'Agent EMI Collections'},
  { id: 'branchManagement', label: 'Manage Branches' },
  { id: 'loanSchemeManagement', label: 'Manage Loan Schemes' },
  { id: 'userManagement', label: 'Manage Users' },
  { id: 'roleManagement', label: 'Manage Roles' },
  { id: 'permissions', label: 'Manage User Permissions' },
];

interface SectionPermission {
  view: boolean;
  fill?: boolean;
  edit?: boolean;
}

interface UserPermissions {
  [sectionId: string]: SectionPermission;
}

interface AllUserPermissions {
  [userId: string]: UserPermissions;
}

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const isMobile = useMediaQuery('(max-width: 1023px)');

  // Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [hasAdminClaim, setHasAdminClaim] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Data State
  const [allUsers, setAllUsers] = useState<StoredUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loanSchemes, setLoanSchemes] = useState<LoanSchemeFormValues[]>([]);
  const [loanApplications, setLoanApplications] = useState<LoanApplicationData[]>([]);
  const [dataFetchError, setDataFetchError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // UI State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<string>('');
  const [userPermissions, setUserPermissions] = useState<AllUserPermissions>({});
  const [viewingApplication, setViewingApplication] = useState<LoanApplicationData | null>(null);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const idTokenResult = await user.getIdTokenResult();
        const isAdminByClaim = idTokenResult.claims.isAdmin === true;
        setHasAdminClaim(isAdminByClaim);
        const isAdmin = isAdminByClaim || user.email === 'admin@shagunam.com';
        setIsCurrentUserAdmin(isAdmin);
        
        if (isAdminByClaim) {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                try {
                    await setDoc(userDocRef, {
                        id: user.uid,
                        email: user.email,
                        fullName: user.displayName || user.email?.split('@')[0] || 'Administrator',
                        role: 'Administrator',
                        mobileNumber: user.phoneNumber || 'N/A',
                        createdAt: serverTimestamp(),
                    });
                    toast({
                        title: "Admin Profile Created",
                        description: "Your administrator profile has been set up in the database.",
                    });
                } catch (e: any) {
                    console.error("Failed to create admin user profile:", e);
                    toast({
                        title: "Profile Creation Failed",
                        description: `Could not create your admin profile in the database. Error: ${e.message}`,
                        variant: 'destructive',
                    });
                }
            }
        }
      } else {
        setCurrentUser(null);
        setIsCurrentUserAdmin(false);
        setHasAdminClaim(false);
        router.push('/login');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [router, toast]);
  
  // Fetch all data from Firestore once authenticated and admin status is known
  useEffect(() => {
    if (authLoading || !currentUser) return; // Wait for auth to settle

    setIsLoadingData(true);
    setDataFetchError(null);

    const activeListeners: (() => void)[] = [];

    const setupListener = <T extends { id: string }>(
        q: any,
        setter: React.Dispatch<React.SetStateAction<T[]>>,
        errorHandler: (error: Error) => void,
        dataMapper: (doc: DocumentData) => T = (doc) => ({ id: doc.id, ...doc.data() } as T)
    ) => {
        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const data = snapshot.docs.map(dataMapper);
                setter(data);
            },
            (error) => {
                console.error("Error fetching data:", error);
                errorHandler(error);
            }
        );
        activeListeners.push(unsubscribe);
    };

    // Shared Listeners
    setupListener<Branch>(
        query(collection(db, "branches"), orderBy("branchName", "asc")),
        setBranches,
        (error) => {
            setDataFetchError("Failed to load branches.");
            toast({ title: "Data Loading Error", description: "Could not load branches.", variant: 'destructive' });
        },
        (doc) => ({ ...doc.data(), branchCode: doc.id } as Branch)
    );

    setupListener<LoanSchemeFormValues>(
        query(collection(db, "loanSchemes"), orderBy("schemeName", "asc")),
        setLoanSchemes,
        (error) => {
            setDataFetchError("Failed to load loan schemes.");
            toast({ title: "Data Loading Error", description: "Could not load loan schemes.", variant: 'destructive' });
        },
        (doc) => ({ ...doc.data(), schemeName: doc.id } as LoanSchemeFormValues)
    );

    let loanApplicationsQuery;
    if (isCurrentUserAdmin) {
      loanApplicationsQuery = query(collection(db, "loanApplications"), orderBy("submissionTimestamp", "desc"));
    } else {
      loanApplicationsQuery = query(
        collection(db, "loanApplications"),
        where("submittedByUid", "==", currentUser.uid),
      );
    }
    setupListener<LoanApplicationData>(
        loanApplicationsQuery,
        setLoanApplications,
        (error) => setDataFetchError(`Failed to load loan applications. (${error.code})`),
        (doc) => {
            const data = doc.data();
            const toISOString = (timestamp: any) => {
                if (!timestamp) return undefined;
                if (typeof timestamp.toDate === 'function') { return timestamp.toDate().toISOString(); }
                if (typeof timestamp === 'string') { return timestamp; }
                if (timestamp.seconds) { return new Date(timestamp.seconds * 1000).toISOString(); }
                return undefined;
            };
            return {
                id: doc.id,
                ...data,
                submissionTimestamp: toISOString(data.submissionTimestamp) || new Date(0).toISOString(),
                approvalDate: toISOString(data.approvalDate),
                rejectionDate: toISOString(data.rejectionDate),
            } as LoanApplicationData;
        }
    );

    // Fetch all users and their permissions if the current user is an admin
    const usersQuery = query(collection(db, "users"), orderBy("fullName", "asc"));
    const unsubscribeUsers = onSnapshot(usersQuery,
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoredUser));
        if (isCurrentUserAdmin) {
          setAllUsers(usersData);
        } else {
          // Non-admins should only see their own user data
          setAllUsers(usersData.filter(u => u.id === currentUser.uid));
        }

        // Populate permissions for all fetched users
        const permissionsUpdate: AllUserPermissions = {};
        usersData.forEach(user => {
            permissionsUpdate[user.id] = user.permissions || {};
        });
        setUserPermissions(permissionsUpdate);
      },
      (error) => {
        setDataFetchError(`Failed to load users list. (${error.code})`);
      }
    );
    activeListeners.push(unsubscribeUsers);
    
    setIsLoadingData(false);

    return () => {
        activeListeners.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser, isCurrentUserAdmin, authLoading, toast]);


  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    } catch (error: any) {
      toast({ title: "Sign Out Error", description: error.message, variant: 'destructive' });
    }
  };


  useEffect(() => {
    if (!selectedUserForPermissions && allUsers.length > 0) {
      const firstNonAdminUser = allUsers.find(u => u.role !== 'Administrator');
      if (firstNonAdminUser) {
        setSelectedUserForPermissions(firstNonAdminUser.id);
      } else if(allUsers.length > 0){
        setSelectedUserForPermissions(allUsers[0].id);
      }
    }
  }, [allUsers, selectedUserForPermissions]);

  const handlePermissionChange = useCallback((userId: string, permissionId: string, type: keyof SectionPermission, value: boolean) => {
    setUserPermissions(prev => {
      const currentUserPerms = prev[userId] || {};
      const updatedSectionPerm = {
        ...(currentUserPerms[permissionId] || { view: false, fill: false, edit: false }),
        [type]: value,
      };

      if ((type === 'fill' || type === 'edit') && value) {
        updatedSectionPerm.view = true;
      }
      if (type === 'view' && !value) {
        updatedSectionPerm.fill = false;
        updatedSectionPerm.edit = false;
      }

      return {
        ...prev,
        [userId]: {
          ...currentUserPerms,
          [permissionId]: updatedSectionPerm,
        },
      };
    });
  }, []);

  const handleSaveChangesForUser = useCallback(async () => {
    if (!selectedUserForPermissions) {
      toast({ title: 'No User Selected', description: 'Please select a user.', variant: 'destructive' });
      return;
    }
    const permissionsToSave = userPermissions[selectedUserForPermissions];
    if (!permissionsToSave) {
        toast({ title: 'No Permissions Found', description: 'No permissions data to save for this user.', variant: 'destructive' });
        return;
    }

    try {
        const firebaseFunctions = getFunctions(app);
        const updateUserPermissionsFn = httpsCallable(firebaseFunctions, 'updateuserpermissions');
        await updateUserPermissionsFn({ userId: selectedUserForPermissions, permissions: permissionsToSave });

        toast({
            title: 'Permissions Saved',
            description: `Successfully updated permissions for ${allUsers.find(u => u.id === selectedUserForPermissions)?.fullName}.`
        });
    } catch (error: any) {
        console.error("Error saving permissions:", error);
        toast({
            title: "Save Failed",
            description: error.message || "An unknown error occurred while saving permissions.",
            variant: "destructive",
        });
    }
  }, [selectedUserForPermissions, allUsers, userPermissions, toast]);


  const handleViewDetailsRequest = useCallback((application: LoanApplicationData) => {
    setViewingApplication(application);
    setActiveTab('loanApplications');
  }, []);

  const onApplicationSubmittedSuccessfully = useCallback((submittedApplication: LoanApplicationData) => {
    setActiveTab('loanApplications');
    toast({ title: 'Application Submitted', description: `Application ID ${submittedApplication.id} for ${submittedApplication.customerName} sent for processing.` });
    setViewingApplication(null);
  }, [toast]);

  const onTransliterate = useCallback(async (text: string): Promise<string> => {
    try {
      return await handleTransliteration(text);
    } catch (error) {
      console.error("Transliteration failed via server action:", error);
      toast({
        title: "AI Service Not Available",
        description: `Could not translate text. Please ensure AI services are configured correctly on the server.`,
        variant: 'destructive',
      });
      return ``;
    }
  }, [toast]);

  const handleApproveApplication = useCallback(async (appId: string, finalDetails: LoanApplicationFormValues) => {
    if (!viewingApplication) return;
    try {
        const updateData: any = {
            ...finalDetails,
            status: 'Approved',
            isVerified: true,
            approvalDate: serverTimestamp(),
            lastUpdatedTimestamp: serverTimestamp(),
            customerPhotoUrl: viewingApplication.customerPhotoUrl,
            identityDocumentFileUrl: viewingApplication.identityDocumentFileUrl,
            addressProofDocumentFileUrl: viewingApplication.addressProofDocumentFileUrl,
            guarantorDocumentFileUrl: viewingApplication.guarantorDocumentFileUrl,
            // Explicitly carry over branch codes from original application
            assignedBranchCode: viewingApplication.assignedBranchCode,
            assignedSubBranchCode: viewingApplication.assignedSubBranchCode,
        };
        
        delete updateData.rejectionDate;
        delete updateData.identityDocumentFile;
        delete updateData.addressProofDocumentFile;
        delete updateData.guarantorDocumentFile;
        delete updateData.customerPhotoFile;
        if (updateData.finePerMissedPayment === undefined) {
          updateData.finePerMissedPayment = '';
        }

        await updateDoc(doc(db, "loanApplications", appId), updateData);
        
        // Trigger the EMI scheduling function
        const scheduleEmisFn = httpsCallable(getFunctions(app), 'scheduleemipayments');
        await scheduleEmisFn({ loanId: appId });
        
        setViewingApplication(null);
        setActiveTab('loanApplications');
        toast({ title: 'Application Approved', description: `Application ID ${appId} has been approved and EMIs scheduled.`});
    } catch(error: any) {
        toast({ title: 'Approval Failed', description: error.message, variant: 'destructive' });
    }
  }, [toast, viewingApplication]);

  const handleRejectApplication = useCallback(async (appId: string, finalDetails: LoanApplicationFormValues) => {
    try {
        const updateData: any = {
            ...finalDetails,
            status: 'Rejected',
            isVerified: true,
            adminRemarks: finalDetails.adminRemarks || 'Rejected by Admin',
            rejectionDate: serverTimestamp(),
            lastUpdatedTimestamp: serverTimestamp(),
        };
        
        delete updateData.approvalDate;
        delete updateData.identityDocumentFile;
        delete updateData.addressProofDocumentFile;
        delete updateData.guarantorDocumentFile;
        delete updateData.customerPhotoFile;
        if (updateData.finePerMissedPayment === undefined) {
          updateData.finePerMissedPayment = '';
        }
        
        await updateDoc(doc(db, "loanApplications", appId), updateData);

        setViewingApplication(null);
        setActiveTab('loanApplications');
        toast({ title: 'Application Rejected', description: `Application ID ${appId} has been rejected.`, variant: 'destructive'});
    } catch (error: any) {
        console.error("Rejection Error:", error);
        toast({ title: 'Rejection Failed', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  const handleQuickRejectFromList = useCallback(async (appId: string, reason: string) => {
    try {
        await updateDoc(doc(db, "loanApplications", appId), {
            status: 'Rejected',
            isVerified: true,
            adminRemarks: reason,
            rejectionDate: serverTimestamp(),
            lastUpdatedTimestamp: serverTimestamp(),
        });
        toast({ title: 'Application Rejected', description: `Application ID ${appId} has been rejected.`, variant: 'destructive' });
    } catch (error: any) {
        toast({ title: 'Rejection Failed', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  const handleDeleteApplication = useCallback(async (applicationId: string) => {
    try {
        await deleteDoc(doc(db, "loanApplications", applicationId));
        toast({ title: 'Application Deleted', description: `Application ID ${applicationId} has been permanently deleted.` });
    } catch (error: any) {
        console.error("Error deleting application:", error);
        toast({ title: 'Deletion Failed', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  const handleCancelViewDetails = useCallback(() => {
    setViewingApplication(null);
    setActiveTab('loanApplications');
  }, []);

  const { newApplicationsList, approvedApplicationsList, rejectedApplicationsList } = useMemo(() => {
    return {
      newApplicationsList: loanApplications.filter(app => app.status === 'Pending'),
      approvedApplicationsList: loanApplications.filter(app => app.status === 'Approved'),
      rejectedApplicationsList: loanApplications.filter(app => app.status === 'Rejected'),
    };
  }, [loanApplications]);

  const dailyCollectionData = useMemo(() => {
    const report: DailyReportEntry[] = [];
    const today = startOfDay(new Date());

    for (let i = 0; i < 30; i++) {
        const targetDate = subDays(today, i);
        let expectedToday = 0;

        for (const loan of approvedApplicationsList) {
            if (!loan.approvalDate) continue;

            const approvalDate = startOfDay(new Date(loan.approvalDate));

            if (targetDate >= approvalDate) {
                if (loan.repaymentType === 'Daily') {
                    expectedToday += parseFloat(loan.dailyEMI || '0');
                }
            }
        }
        
        report.push({
            date: format(targetDate, 'yyyy-MM-dd'),
            collectedToday: 0, 
            expectedToday: Math.round(expectedToday * 100) / 100,
        });
    }

    return report.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [approvedApplicationsList]);


  const customerManagementList = useMemo(() => approvedApplicationsList, [approvedApplicationsList]);

    const handleBranchSubmit = useCallback(async (values: BranchFormValuesType, editingBranchCode?: string) => {
        const batch = writeBatch(db);
        try {
            if (editingBranchCode) {
                const branchRef = doc(db, "branches", editingBranchCode);
                batch.update(branchRef, { ...values, updatedAt: serverTimestamp() } as { [x: string]: any });
                toast({ title: "Branch Updated", description: `Branch "${values.branchName}" updated.` });
            } else {
                const newDocRef = doc(collection(db, "branches"));
                const newBranchCode = newDocRef.id.substring(0, 6).toUpperCase();
                batch.set(doc(db, "branches", newBranchCode), { 
                    ...values, 
                    branchCode: newBranchCode,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                toast({ title: "Branch Created", description: `Branch "${values.branchName}" created.` });
            }
            await batch.commit();
        } catch (error: any) {
            console.error("Error committing branch data:", error);
            toast({
                title: "Database Error",
                description: `Failed to save branch. Reason: ${error.message}`,
                variant: "destructive",
            });
        }
    }, [toast]);

    const handleDeleteBranch = useCallback(async (branchCodeToDelete: string) => {
        await deleteDoc(db, "branches", branchCodeToDelete);
        toast({ title: "Branch Deleted", variant: "destructive" });
    }, [toast]);

    const handleSchemeSubmit = useCallback(async (values: LoanSchemeFormValues) => {
        try {
            const schemeRef = doc(db, "loanSchemes", values.schemeName); 
            await setDoc(schemeRef, values);
            toast({ title: "Scheme Saved", description: `Scheme "${values.schemeName}" has been saved.` });
        } catch (error: any) {
            console.error("Error saving scheme:", error);
            toast({ title: "Error Saving Scheme", description: error.message, variant: "destructive" });
        }
    }, [toast]);

    const handleDeleteScheme = useCallback(async (schemeNameToDelete: string) => {
        try {
            await deleteDoc(db, "loanSchemes", schemeNameToDelete);
            toast({ title: "Scheme Deleted", description: `Scheme "${schemeNameToDelete}" deleted.`, variant: "destructive" });
        } catch (error: any) {
            console.error("Error deleting scheme:", error);
            toast({ title: "Error Deleting Scheme", description: error.message, variant: "destructive" });
        }
    }, [toast]);

  const allSectionsRaw = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, content: null },
    { id: 'newLoanApplication', label: 'New Loan Application', icon: FileEdit, content: null },
    { id: 'loanApplications', label: 'Manage Loan Applications', icon: ListChecks, content: null },
    { id: 'customerManagement', label: 'Customer Management', icon: Contact, content: null },
    { id: 'collectionReport', label: 'Collection Reports', icon: BookCopy, content: null },
    { id: 'agentCollections', label: 'Agent Collections', icon: HandCoins, content: null },
    { id: 'branchManagement', label: 'Branch Management', icon: Building2, content: null },
    { id: 'loanSchemeManagement', label: 'Loan Scheme Management', icon: Banknote, content: null },
    { id: 'userManagement', label: 'User Management', icon: Users, content: null },
    { id: 'roleManagement', label: 'Role Overview', icon: ShieldCheck, content: null },
    { id: 'permissions', label: 'User Permissions', icon: Settings, content: null },
  ];
  
  const activeSection = allSectionsRaw.find(s => s.id === activeTab);
  const pageTitle = activeSection ? activeSection.label : 'SHAGUNAM';

  const loanApplicationFormElement = useMemo(() => (
    <LoanApplicationForm
      translateToHindi={onTransliterate}
      loanSchemes={loanSchemes}
      branches={branches}
      applicationToView={viewingApplication}
      onApplicationSubmittedSuccessfully={onApplicationSubmittedSuccessfully}
      onApproveApplication={handleApproveApplication}
      onRejectApplication={handleRejectApplication}
      onCancelViewDetails={handleCancelViewDetails}
    />
  ), [loanSchemes, branches, viewingApplication, onTransliterate, onApplicationSubmittedSuccessfully, handleApproveApplication, handleRejectApplication, handleCancelViewDetails]);

  const loanApplicationManagementElement = useMemo(() => (
    <LoanApplication
      newApplicationsList={newApplicationsList}
      approvedApplicationsList={approvedApplicationsList}
      rejectedApplicationsList={rejectedApplicationsList}
      onViewDetailsRequest={handleViewDetailsRequest}
      onConfirmQuickReject={handleQuickRejectFromList}
      onDeleteApplication={handleDeleteApplication}
      currentUserIsAdmin={isCurrentUserAdmin}
      userPermissions={userPermissions[currentUser?.uid || '']}
    />
  ), [newApplicationsList, approvedApplicationsList, rejectedApplicationsList, handleViewDetailsRequest, handleQuickRejectFromList, handleDeleteApplication, isCurrentUserAdmin, userPermissions, currentUser]);

  const customerManagementElement = useMemo(() => (
    <CustomerManagement customers={customerManagementList} branches={branches} />
  ), [customerManagementList, branches]);

  const branchCollectionReportElement = useMemo(() => (
      <BranchCollectionReport
          branches={branches}
          allLoans={loanApplications}
          allUsers={allUsers}
      />
  ), [branches, loanApplications, allUsers]);

  const agentCollectionsContentElement = useMemo(() => (
    <AgentCollections
      branches={branches}
      customersWithLoans={approvedApplicationsList}
    />
  ), [branches, approvedApplicationsList]);

  const branchManagementElement = useMemo(() => (
    <BranchManagement
        branches={branches}
        onBranchSubmit={handleBranchSubmit}
        onBranchDelete={handleDeleteBranch}
    />
  ), [branches, handleBranchSubmit, handleDeleteBranch]);

  const loanSchemeManagementElement = useMemo(() => (
    <LoanSchemeManagement
        loanSchemes={loanSchemes}
        onSchemeSubmit={handleSchemeSubmit}
        onSchemeDelete={handleDeleteScheme}
    />
  ), [loanSchemes, handleSchemeSubmit, handleDeleteScheme]);

  const userManagementElement = useMemo(() => (
      <UserManagement
        users={allUsers}
        isLoadingUsers={isLoadingData}
        fetchError={dataFetchError}
        editingUserId={editingUserId}
        setEditingUserId={setEditingUserId}
        currentUser={currentUser}
      />
  ), [allUsers, isLoadingData, dataFetchError, editingUserId, currentUser]);

  const roleManagementElement = useMemo(() => (
    <RoleManagement roles={rolesData} selectedRole={rolesData.find(r => r.name === (allUsers.find(u => u.id === selectedUserForPermissions)?.role))?.name || rolesData[0].name} setSelectedRole={(roleName) => {
      const userWithRole = allUsers.find(u => u.role === roleName);
      if (userWithRole && userWithRole.role !== 'Administrator') {
        setSelectedUserForPermissions(userWithRole.id);
      } else if (roleName === 'Administrator' && selectedUserForPermissions && allUsers.find(u => u.id === selectedUserForPermissions)?.role !== 'Administrator') {
          const firstNonAdmin = allUsers.find(u => u.role !== 'Administrator');
          setSelectedUserForPermissions(firstNonAdmin ? firstNonAdmin.id : '');
      }
    }} />
  ), [allUsers, selectedUserForPermissions]);

  const dashboardStats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      totalLoanAmount: 0,
      activeLoansCount: 0,
      pendingApplicationsCount: 0,
      approvedThisMonthCount: 0,
      rejectedThisMonthCount: 0,
    };

    loanApplications.forEach(app => {
      if (app.status === 'Approved') {
        stats.activeLoansCount++;
        stats.totalLoanAmount += parseFloat(app.loanAmountApproved || app.loanAmountRequired || '0');
        const approvalDate = app.approvalDate ? new Date(app.approvalDate) : null;
        if (approvalDate && approvalDate >= startOfMonth) {
          stats.approvedThisMonthCount++;
        }
      } else if (app.status === 'Pending') {
        stats.pendingApplicationsCount++;
      } else if (app.status === 'Rejected') {
        const rejectionDate = app.rejectionDate ? new Date(app.rejectionDate) : null;
        if (rejectionDate && rejectionDate >= startOfMonth) {
          stats.rejectedThisMonthCount++;
        }
      }
    });

    return stats;
  }, [loanApplications]);

  const GrantAdminButton = () => {
    const [isGranting, setIsGranting] = useState(false);

    const handleGrantAdmin = async () => {
      if (!currentUser) return;
      setIsGranting(true);
      try {
        const setAdminClaimFn = httpsCallable(getFunctions(app), 'setadminclaim');
        await setAdminClaimFn({ targetUid: currentUser.uid, makeAdmin: true });
        
        await currentUser.getIdToken(true);
        
        toast({
          title: "Admin Permissions Granted",
          description: "You now have full administrator privileges. The page will reload to apply changes.",
        });

        setTimeout(() => window.location.reload(), 2000);

      } catch (error: any) {
        console.error("Error granting admin claim:", error);
        toast({
          title: "Granting Admin Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsGranting(false);
      }
    };

    if (currentUser?.email === 'admin@shagunam.com' && !hasAdminClaim) {
      return (
        <Card className="mb-6 bg-yellow-50 border-yellow-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-yellow-800"><Shield /> Activate Admin Privileges</CardTitle>
            <CardDescription className="text-yellow-700">
              As the super-admin, you need to grant your account full administrative permissions to enable all features. This is a one-time action.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGrantAdmin} disabled={isGranting}>
              {isGranting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Grant Admin Permissions
            </Button>
          </CardContent>
        </Card>
      );
    }
    return null;
  };


  const dashboardContentElement = useMemo(() => (
    <div>
      <GrantAdminButton />
      <DashboardSummaryCards {...dashboardStats} />
      <DailyCollectionReport data={dailyCollectionData} isLoading={isLoadingData} onRefresh={() => {}} />
      <DashboardCharts loanApplications={loanApplications} />
    </div>
  ), [dashboardStats, loanApplications, dailyCollectionData, isLoadingData, currentUser, hasAdminClaim]);

const PermissionsContent = React.memo(function PermissionsContent({
    users,
    selectedUser,
    setSelectedUser,
    permissions,
    onPermissionChange,
    onSaveChanges,
  }: {
    users: StoredUser[];
    selectedUser: string;
    setSelectedUser: (id: string) => void;
    permissions: AllUserPermissions;
    onPermissionChange: (userId: string, permissionId: string, type: keyof SectionPermission, value: boolean) => void;
    onSaveChanges: () => void;
  }) {
    const [searchTerm, setSearchTerm] = useState('');
    const selectedUserDetails = users.find(u => u.id === selectedUser);
    const isSelectedUserAdmin = selectedUserDetails?.role === 'Administrator';
    const currentPermissionsForSelectedUser = permissions[selectedUser] || {};
    
    const filteredUsers = useMemo(() => 
      users.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      ),
      [users, searchTerm]
    );

    const permissionCategories: { [key: string]: string[] } = {
      'General': ['dashboard'],
      'Loan Management': ['newLoanApplication', 'loanApplications', 'customerManagement', 'agentCollections'],
      'Administration': ['branchManagement', 'loanSchemeManagement', 'userManagement', 'roleManagement', 'permissions'],
    };

    const isActionAvailable = (permissionId: string) => ['newLoanApplication', 'loanApplications', 'branchManagement', 'userManagement', 'loanSchemeManagement', 'customerManagement', 'agentCollections'].includes(permissionId);


    return (
      <div>
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-xl md:text-2xl">Set User Permissions</CardTitle>
            <CardDescription>
              Select a user to configure their access rights. Administrator role has all permissions by default.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 lg:p-6 lg:pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User Selection List */}
              <div className="lg:col-span-1 border-r-0 lg:border-r lg:pr-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Select User</h3>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-full"
                    />
                  </div>
                  <ScrollArea className="h-96 border rounded-md">
                    <div className="p-2 space-y-1">
                    {filteredUsers.length > 0 ? filteredUsers.map(user => (
                      <div 
                        key={user.id}
                        onClick={() => setSelectedUser(user.id)}
                        className={cn(
                          "p-3 rounded-md cursor-pointer transition-colors",
                          selectedUser === user.id 
                            ? 'bg-primary text-primary-foreground shadow-sm' 
                            : 'hover:bg-muted/50'
                        )}
                      >
                        <div className="font-semibold">{user.fullName}</div>
                        <div className={cn(
                          "text-xs",
                          selectedUser === user.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        )}>
                          {user.role} - {user.email}
                        </div>
                      </div>
                    )) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">No users match search.</div>
                    )}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Permissions Settings */}
              <div className="lg:col-span-2 p-4 pt-0 lg:p-0">
                {selectedUserDetails ? (
                  <>
                    <div className="pb-2 mb-4 flex justify-between items-center">
                      <div>
                          <h3 className="text-lg font-semibold text-primary">Permissions for: {selectedUserDetails.fullName}</h3>
                          <p className="text-sm text-muted-foreground">Role: {selectedUserDetails.role}</p>
                      </div>
                        <Button onClick={onSaveChanges} disabled={isSelectedUserAdmin}>
                        Save Permissions
                      </Button>
                    </div>
                    {isSelectedUserAdmin ? (
                      <div className="text-muted-foreground p-4 bg-blue-50/70 border border-blue-200 rounded-md text-center">
                        <ShieldCheck className="mx-auto h-8 w-8 text-blue-600 mb-2"/>
                        <p className="font-semibold text-blue-800">Administrator Access</p>
                        <p className="text-sm">Administrators have all permissions by default. These cannot be modified.</p>
                      </div>
                    ) : (
                      <Card>
                        <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[40%]">Permission</TableHead>
                                <TableHead className="text-center">View</TableHead>
                                <TableHead className="text-center">Fill</TableHead>
                                <TableHead className="text-center">Edit</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {permissionsData.map((section) => (
                                  <TableRow key={`perm-row-${section.id}-${selectedUser}`}>
                                      <TableCell className="font-medium">{section.label}</TableCell>
                                      <TableCell className="text-center">
                                          <Checkbox
                                              onClick={(e) => e.stopPropagation()}
                                              checked={currentPermissionsForSelectedUser[section.id]?.view || false}
                                              onCheckedChange={(checked) => onPermissionChange(selectedUser, section.id, 'view', !!checked)}
                                              id={`view-${section.id}-${selectedUser}`}
                                              aria-label={`View access for ${section.label}`}
                                              disabled={isSelectedUserAdmin}
                                          />
                                      </TableCell>
                                      <TableCell className="text-center">
                                         {isActionAvailable(section.id) && (
                                              <Checkbox
                                                  onClick={(e) => e.stopPropagation()}
                                                  checked={currentPermissionsForSelectedUser[section.id]?.fill || false}
                                                  onCheckedChange={(checked) => onPermissionChange(selectedUser, section.id, 'fill', !!checked)}
                                                  disabled={!currentPermissionsForSelectedUser[section.id]?.view || isSelectedUserAdmin}
                                                  id={`fill-${section.id}-${selectedUser}`}
                                                  aria-label={`Fill access for ${section.label}`}
                                              />
                                            )}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {isActionAvailable(section.id) && (
                                              <Checkbox
                                                  onClick={(e) => e.stopPropagation()}
                                                  checked={currentPermissionsForSelectedUser[section.id]?.edit || false}
                                                  onCheckedChange={(checked) => onPermissionChange(selectedUser, section.id, 'edit', !!checked)}
                                                  disabled={!currentPermissionsForSelectedUser[section.id]?.view || isSelectedUserAdmin}
                                                  id={`edit-${section.id}-${selectedUser}`}
                                                  aria-label={`Edit access for ${section.label}`}
                                              />
                                            )}
                                      </TableCell>
                                  </TableRow>
                              ))}
                            </TableBody>
                        </Table>
                      </Card>
                    )}
                  </>
                ) : (
                  <div className="text-muted-foreground p-4 bg-yellow-50/70 border border-yellow-200 rounded-md text-center h-full flex flex-col justify-center items-center">
                      <Users className="h-8 w-8 text-yellow-600 mb-2"/>
                      <p className="font-semibold text-yellow-800">Select a User</p>
                    <p className="text-sm">Please select a user from the list on the left to manage their permissions.</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  });
PermissionsContent.displayName = 'PermissionsContent';

  const permissionsContentElement = useMemo(() => (
    <PermissionsContent
      users={allUsers}
      selectedUser={selectedUserForPermissions}
      setSelectedUser={setSelectedUserForPermissions}
      permissions={userPermissions}
      onPermissionChange={handlePermissionChange}
      onSaveChanges={handleSaveChangesForUser}
    />
  ), [allUsers, selectedUserForPermissions, userPermissions, handlePermissionChange, handleSaveChangesForUser]);

  const allSections = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, content: dashboardContentElement },
    { id: 'newLoanApplication', label: 'New Loan Application', icon: FileEdit, content: loanApplicationFormElement },
    { id: 'loanApplications', label: 'Manage Loan Applications', icon: ListChecks, content: loanApplicationManagementElement },
    { id: 'customerManagement', label: 'Customer Management', icon: Contact, content: customerManagementElement },
    { id: 'collectionReport', label: 'Collection Reports', icon: BookCopy, content: branchCollectionReportElement },
    { id: 'agentCollections', label: 'Agent Collections', icon: HandCoins, content: agentCollectionsContentElement },
    { id: 'branchManagement', label: 'Branch Management', icon: Building2, content: branchManagementElement },
    { id: 'loanSchemeManagement', label: 'Loan Scheme Management', icon: Banknote, content: loanSchemeManagementElement },
    { id: 'userManagement', label: 'User Management', icon: Users, content: userManagementElement },
    { id: 'roleManagement', label: 'Role Overview', icon: ShieldCheck, content: roleManagementElement },
    { id: 'permissions', label: 'User Permissions', icon: Settings, content: permissionsContentElement },
  ], [
      dashboardContentElement, loanApplicationFormElement, loanApplicationManagementElement,
      customerManagementElement, branchCollectionReportElement, agentCollectionsContentElement, branchManagementElement, loanSchemeManagementElement, userManagementElement,
      roleManagementElement, permissionsContentElement
  ]);

  const visibleSections = useMemo(() => {
    if (isCurrentUserAdmin) {
      return allSections;
    }
    const currentUserPerms = userPermissions[currentUser?.uid || ''] || {};
    return allSections.filter(section => currentUserPerms[section.id]?.view);
  }, [isCurrentUserAdmin, allSections, userPermissions, currentUser]);

  useEffect(() => {
    const hasViewPermission = isCurrentUserAdmin || (userPermissions[currentUser?.uid || '']?.[activeTab]?.view);
    
    if (!authLoading && visibleSections.length > 0 && !hasViewPermission) {
        // If the current tab is not permitted, switch to the first available one.
        setActiveTab(visibleSections[0].id); 
        toast({
            title: "Access Denied",
            description: "You do not have permission to view that section. Redirecting.",
            variant: "destructive",
        });
    } else if (!authLoading && visibleSections.length === 0 && !isCurrentUserAdmin) {
        // Handle case where user has no permissions at all
        toast({
            title: "No Permissions",
            description: "You have not been assigned any permissions. Please contact an administrator.",
            variant: "destructive",
        });
    }
  }, [activeTab, isCurrentUserAdmin, toast, userPermissions, currentUser, authLoading, visibleSections]);


  const handleTabChange = (newTab: string) => {
    const hasViewPermission = isCurrentUserAdmin || (userPermissions[currentUser?.uid || '']?.[newTab]?.view);
    if (!hasViewPermission) {
      toast({ title: "Access Denied", variant: "destructive" });
      return;
    }
    setActiveTab(newTab);
    // Reset viewing state when navigating away, unless navigating between application detail and list
    if (newTab !== 'loanApplications' && newTab !== 'newLoanApplication' && viewingApplication) {
        setViewingApplication(null);
    }
  };

  const renderNavLinks = (isMobileSheet: boolean) => (
    <div className="p-2 space-y-1">
      {visibleSections.map((section) => (
        <Button
          key={`${isMobileSheet ? 'mobile' : 'desktop'}-${section.id}`}
          variant={activeTab === section.id ? 'secondary' : 'ghost'}
          className={cn(
            "w-full justify-start",
            !isMobileSheet && "group-[[data-state=collapsed]]:justify-center group-[[data-state=collapsed]]:px-2.5",
             activeTab === section.id && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
          )}
          onClick={() => {
            handleTabChange(section.id);
            if (isMobileSheet) {
              setIsMobileSheetOpen(false);
            }
          }}
        >
          <section.icon className={cn("h-5 w-5", !isMobileSheet && "group-[[data-state=collapsed]]:mr-0 mr-3")} />
          <span className={cn(!isMobileSheet && "group-[[data-state=collapsed]]:hidden")}>{section.label}</span>
        </Button>
      ))}
    </div>
  );

  if (authLoading || (currentUser && isLoadingData)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/40">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-muted/40">
      <Sidebar
        className="hidden lg:flex"
        style={{ '--sidebar-width': '280px' } as React.CSSProperties}
      >
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <SigmaSquare className="h-7 w-7 text-sidebar-primary" />
            <h1 className="text-lg font-semibold text-sidebar-foreground group-[[data-state=collapsed]]:hidden">
              SHAGUNAM
            </h1>
          </div>
          <ActualSidebarTrigger />
        </SidebarHeader>
        <ScrollArea className="flex-1">
          {renderNavLinks(false)}
        </ScrollArea>
        <SidebarFooter>
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 group-[[data-state=collapsed]]:h-10 group-[[data-state=collapsed]]:w-10">
              <AvatarImage src="https://placehold.co/40x40.png" alt="Admin" data-ai-hint="user avatar"/>
              <AvatarFallback>{currentUser?.email?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="group-[[data-state=collapsed]]:hidden">
              <p className="text-sm font-medium text-sidebar-foreground">{currentUser?.displayName || 'User'}</p>
              <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto text-sidebar-foreground hover:bg-sidebar-accent group-[[data-state=collapsed]]:hidden"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <div className="flex flex-col lg:ml-[280px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                        <MenuIcon className="h-6 w-6" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0 w-72 sm:w-80 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
                    <ShadSheetHeader className="p-4 border-b border-sidebar-border">
                        <SheetTitle className="text-lg font-semibold text-sidebar-foreground flex items-center gap-2">
                            <SigmaSquare className="h-6 w-6 text-sidebar-primary" /> SHAGUNAM
                        </SheetTitle>
                    </ShadSheetHeader>
                    <ScrollArea className="flex-1">
                        {renderNavLinks(true)}
                    </ScrollArea>
                    <div className="p-4 border-t border-sidebar-border">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src="https://placehold.co/40x40.png" alt="Admin" data-ai-hint="user avatar"/>
                                <AvatarFallback>{currentUser?.email?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium text-sidebar-foreground">{currentUser?.displayName || 'User'}</p>
                                <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="ml-auto text-sidebar-foreground hover:bg-sidebar-accent" onClick={handleSignOut}>
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
            <h1 className="font-semibold text-lg hidden sm:block">
              {pageTitle}
            </h1>
          </div>
          
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <UserCircle2 className="h-7 w-7 text-muted-foreground" />
                        <span className="sr-only">User menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => toast({ title: "Profile clicked", description: "This would navigate to a dedicated user profile page."})}>
                        Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setIsChangePasswordDialogOpen(true)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        <span>Change Password</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>

        <main className="flex-grow p-4 lg:p-6 overflow-y-auto">
            {activeTab === 'dashboard' && dashboardContentElement}
            {activeTab === 'newLoanApplication' && loanApplicationFormElement}
            {activeTab === 'loanApplications' && loanApplicationManagementElement}
            {activeTab === 'customerManagement' && <div>{customerManagementElement}</div>}
            {activeTab === 'collectionReport' && <div>{branchCollectionReportElement}</div>}
            {activeTab === 'agentCollections' && <div>{agentCollectionsContentElement}</div>}
            {activeTab === 'branchManagement' && <div>{branchManagementElement}</div>}
            {activeTab === 'loanSchemeManagement' && <div>{loanSchemeManagementElement}</div>}
            {activeTab === 'userManagement' && <div>{userManagementElement}</div>}
            {activeTab === 'roleManagement' && <div>{roleManagementElement}</div>}
            {activeTab === 'permissions' && permissionsContentElement}
        </main>
      </div>

      <ChangePasswordDialog isOpen={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen} />
    </div>
  );
}
