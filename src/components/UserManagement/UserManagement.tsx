
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
import { Button, buttonVariants } from '@/components/ui/button';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {ScrollArea} from '@/components/ui/scroll-area';
import {useEffect, useState} from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, Loader2, Users as UsersIcon, AlertTriangle, KeyRound, RefreshCw } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase/clientApp';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';


// Schema for form validation
const userFormSchema = z.object({
  role: z.enum(['Administrator', 'Manager', 'Agent', 'Collection Agent']),
  fullName: z.string().min(2, {
    message: 'Full Name must be at least 2 characters.',
  }),
  mobileNumber: z.string().min(10, { message: "Mobile number must be at least 10 digits."}).regex(/^\d+$/, "Mobile number must contain only digits."),
  autoGeneratePassword: z.boolean().default(true),
  password: z.string().optional(),
}).refine(data => {
    // If auto-generate is off, a password must be provided and be at least 6 chars
    if (!data.autoGeneratePassword) {
        return data.password && data.password.length >= 6;
    }
    return true;
}, {
    message: "Password must be at least 6 characters.",
    path: ["password"], // Point error to the password field
});


export type UserFormValues = z.infer<typeof userFormSchema>;

export interface StoredUser {
  id: string;
  email: string;
  fullName: string;
  mobileNumber: string;
  role: 'Administrator' | 'Manager' | 'Agent' | 'Collection Agent';
  permissions?: { [key: string]: any }; // Added to hold permissions
  initialPassword?: string;
  createdAt?: Timestamp; // Firestore Timestamp
  updatedAt?: Timestamp; // Firestore Timestamp
}

interface UserManagementProps {
  users: StoredUser[];
  isLoadingUsers: boolean;
  fetchError: string | null;
  editingUserId: string | null;
  setEditingUserId: (id: string | null) => void;
  currentUser: FirebaseUser | null;
}

const defaultFormValues: UserFormValues = {
  role: 'Agent',
  fullName: '',
  mobileNumber: '',
  autoGeneratePassword: true,
  password: '',
};

const generatePassword = () => {
    const passwordWords = ["apple", "mango", "grape", "berry", "peach", "lemon", "melon", "cherry", "olive", "kiwi"];
    return `${passwordWords[Math.floor(Math.random() * passwordWords.length)]}123@`;
}

const UserManagement = ({
  users,
  isLoadingUsers,
  fetchError,
  editingUserId,
  setEditingUserId,
  currentUser,
}: UserManagementProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const firebaseFunctions = getFunctions(app);

  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: defaultFormValues,
  });
  
  const autoGeneratePassword = userForm.watch('autoGeneratePassword');

  useEffect(() => {
    if (editingUserId) {
      const userToEdit = users.find(user => user.id === editingUserId);
      if (userToEdit) {
        userForm.reset({
          role: userToEdit.role,
          fullName: userToEdit.fullName,
          mobileNumber: userToEdit.mobileNumber,
          autoGeneratePassword: true, // Always default to auto on edit view
          password: '',
        });
      }
    } else {
      userForm.reset(defaultFormValues);
    }
  }, [editingUserId, users, userForm]);

  const handleUserSubmit = async (values: UserFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingUserId) {
        toast({ title: "Update Not Implemented", description: "User updates should be handled by a dedicated Cloud Function.", variant: "destructive" });
        setEditingUserId(null);
      } else {
        const email = `${values.fullName.replace(/\s+/g, '').toLowerCase().substring(0, 20)}@shagunam.com`;
        const finalPassword = values.autoGeneratePassword ? generatePassword() : values.password!;
        
        const createUserFn = httpsCallable(firebaseFunctions, 'createuserauthandprofile');
        await createUserFn({
            email,
            password: finalPassword,
            displayName: values.fullName,
            firestoreProfileData: {
                role: values.role,
                mobileNumber: values.mobileNumber,
            },
        });

        toast({ title: "User Created Successfully", description: `User ${email} has been created. Their initial password will appear in the list below.` });
      }
      userForm.reset(defaultFormValues);
    } catch (error: any) {
      console.error("Error submitting user:", error);
      const errorMessage = error.details?.message || error.message || "An unexpected error occurred.";
      toast({ title: "Operation Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestDelete = (userId: string) => {
    setDeletingUserId(userId);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleDeleteConfirmation = async () => {
    if (!deletingUserId) return;
    setIsSubmitting(true);
    
    try {
        const deleteUserFn = httpsCallable(firebaseFunctions, 'deleteuserauthandprofile');
        const result: any = await deleteUserFn({ targetUid: deletingUserId });

        toast({
          title: "User Deleted",
          description: result.data.message || "User has been successfully deleted.",
        });

        if (editingUserId === deletingUserId) {
            setEditingUserId(null);
            userForm.reset(defaultFormValues);
        }
    } catch (error: any) {
        console.error("Error deleting user:", error);
        const message = error.details?.message || error.message || "An unknown error occurred while deleting the user.";
        toast({
            title: "Deletion Failed",
            description: message,
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
        setDeletingUserId(null);
        setIsConfirmDeleteDialogOpen(false);
    }
  };

  const handleEdit = (user: StoredUser) => {
    setEditingUserId(user.id);
    const formElement = document.getElementById('user-management-form-card');
    formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    userForm.reset(defaultFormValues);
  };

  return (
    <Card className="shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="bg-muted/30" id="user-management-form-card">
        <CardTitle className="text-2xl">{editingUserId ? 'Edit User Details' : 'Create New User'}</CardTitle>
        <CardDescription>
          {editingUserId ? `Modifying details for user ID: ${editingUserId}.` : 'Create a user with login credentials. You can auto-generate a password or enter one manually.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...userForm}>
          <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-6">
            <FormField
              control={userForm.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Administrator">Administrator</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Agent">Agent</SelectItem>
                      <SelectItem value="Collection Agent">Collection Agent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={userForm.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} disabled={isSubmitting || !!editingUserId} />
                  </FormControl>
                  <FormDescription>An email will be generated from this name. Cannot be changed after creation.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={userForm.control}
              name="mobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="Enter 10-digit mobile number" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {!editingUserId && (
                <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                    <FormField
                      control={userForm.control}
                      name="autoGeneratePassword"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Auto-generate Password</FormLabel>
                            <FormDescription>
                              Let the system create a secure password.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {!autoGeneratePassword && (
                        <FormField
                          control={userForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Manual Password</FormLabel>
                              <FormControl>
                                <Input type="text" placeholder="Enter a secure password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    )}
                </div>
            )}
            
            <div className="flex space-x-3 pt-2">
              <Button type="submit" disabled={isSubmitting || !!editingUserId} className="min-w-[120px]">
                {isSubmitting ? <Loader2 className="animate-spin" /> : (editingUserId ? 'Update User' : 'Create User')}
              </Button>
              {editingUserId && (
                <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSubmitting}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </Form>

        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4 text-primary border-b pb-2">Existing Users</h2>
          {isLoadingUsers ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Loading users...</p>
            </div>
          ) : fetchError ? (
            <div className="text-center text-destructive py-10 flex flex-col items-center bg-red-50/50 border border-destructive/20 rounded-md">
                <AlertTriangle className="h-12 w-12 mb-3" />
                <p className="text-lg font-semibold">Failed to Load Users</p>
                <p className="text-sm max-w-md mx-auto">{fetchError}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
              <UsersIcon className="h-12 w-12 mb-3 text-muted-foreground/50" />
              <p className="text-lg">No users found.</p>
              <p className="text-sm">Create user profiles using the form above.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] w-full rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-muted z-10">
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden md:table-cell">Role</TableHead>
                    <TableHead className="hidden sm:table-cell">Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className={user.id === currentUser?.uid ? 'bg-blue-50/50' : ''}>
                      <TableCell>
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                        {user.initialPassword && user.role !== 'Administrator' && (
                            <div className="flex items-center text-amber-700 mt-1">
                                <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                                <span className="text-xs font-mono bg-amber-100 px-1.5 py-0.5 rounded">{user.initialPassword}</span>
                            </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={user.role === 'Administrator' ? "default" : "secondary"}>{user.role}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{user.mobileNumber}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                           <Button variant="outline" size="sm" onClick={() => handleEdit(user)} disabled={isSubmitting}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleRequestDelete(user.id)} disabled={isSubmitting || user.id === currentUser?.uid}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>
      </CardContent>

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user "{users.find(u => u.id === deletingUserId)?.fullName || 'this user'}" from both Authentication and Firestore. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingUserId(null)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDeleteConfirmation}
                disabled={isSubmitting}
                className={cn(buttonVariants({ variant: "destructive" }))}
            >
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Yes, delete user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default UserManagement;

    
