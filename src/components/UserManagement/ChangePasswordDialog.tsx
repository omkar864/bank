
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const changePasswordSchema = z
  .object({
    newPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    confirmPassword: z.string(),
    currentPassword: z.string().optional(), // For re-authentication
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match.",
    path: ['confirmPassword'],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const ChangePasswordDialog = ({ isOpen, onOpenChange }: ChangePasswordDialogProps) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [requiresReauth, setRequiresReauth] = React.useState(false);
  const { toast } = useToast();
  const auth = getAuth();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
      currentPassword: '',
    },
  });

  const handleClose = () => {
    form.reset();
    setIsSubmitting(false);
    setRequiresReauth(false);
    onOpenChange(false);
  };

  const handlePasswordUpdate = async (values: ChangePasswordFormValues) => {
    const user = auth.currentUser;
    if (!user) {
      toast({ title: 'Error', description: 'No user is currently signed in.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    setRequiresReauth(false);

    try {
      await updatePassword(user, values.newPassword);
      toast({ title: 'Success', description: 'Your password has been updated successfully.' });
      handleClose();
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        setRequiresReauth(true);
        toast({
          title: 'Re-authentication Required',
          description: 'For your security, please enter your current password to continue.',
          variant: 'destructive',
        });
      } else if (error.code === 'auth/weak-password') {
        form.setError('newPassword', { type: 'manual', message: 'This password is too weak. Please choose a stronger one.' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReauthentication = async () => {
    const user = auth.currentUser;
    const currentPassword = form.getValues('currentPassword');

    if (!user || !currentPassword) {
      toast({ title: 'Error', description: 'Current password is required.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      toast({ title: 'Success', description: 'Re-authentication successful. Please try updating your password again.' });
      setRequiresReauth(false);
      // Automatically re-submit the password update after successful re-auth
      await handlePasswordUpdate(form.getValues());
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        form.setError('currentPassword', { type: 'manual', message: 'Incorrect current password.' });
      } else {
        toast({ title: 'Re-authentication Failed', description: error.message, variant: 'destructive' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onEscapeKeyDown={handleClose}>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter a new password for your account. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handlePasswordUpdate)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {requiresReauth && (
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem className="pt-2 border-t border-dashed">
                    <FormLabel className="text-destructive">Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your current password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              {requiresReauth ? (
                <Button type="button" onClick={handleReauthentication} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Re-authenticate & Save
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;

    