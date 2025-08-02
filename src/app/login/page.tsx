
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '@/lib/firebase/clientApp';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, SigmaSquare } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type UserFormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(app);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: 'admin@shagunam.com',
      password: 'Tarapur123@@',
    },
  });

  const handlePasswordReset = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const email = form.getValues('email');
    if (!email || !formSchema.shape.email.safeParse(email).success) {
      toast({
        title: "Valid Email Required",
        description: "Please enter a valid email address in the form before requesting a password reset.",
        variant: 'destructive',
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password Reset Email Sent",
        description: `If an account exists for ${email}, a reset link has been sent. Please check your inbox.`,
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      // For security, don't reveal if a user exists or not. The success message is intentionally vague.
      // This generic message helps prevent user enumeration attacks.
      toast({
        title: "Password Reset Email Sent",
        description: `If an account exists for ${email}, a reset link has been sent. Please check your inbox.`,
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleAuthAction = async (values: UserFormValues) => {
    setIsLoading(true);
    const { email, password } = values;

    try {
      if (activeTab === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Login Successful', description: 'Redirecting to your dashboard...' });
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: 'Sign Up Successful', description: 'Your account has been created. Redirecting...' });
      }
      router.push('/'); // Redirect to the main dashboard page
    } catch (error: any)
      {
      console.error(`${activeTab} error:`, error);
      let errorMessage = error.message || 'An unexpected error occurred.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          errorMessage = "Login failed. Please check your email and password. If this is your first time using the admin account, please use the 'Sign Up' tab to create it first."
      } else if (error.code === 'auth/email-already-in-use') {
          errorMessage = "An account with this email already exists. Please use the 'Login' tab to sign in."
      }

      toast({
        title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Failed`,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 md:p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6 items-center gap-2">
            <SigmaSquare className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">
              SHAGUNAM MICRO ASSOCIATION
            </h1>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card className="shadow-none border-0 sm:shadow-sm sm:border">
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Enter your credentials to access your account.</CardDescription>
              </CardHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAuthAction)}>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="user@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>Password</FormLabel>
                            <Button
                              type="button"
                              variant="link"
                              className="h-auto p-0 text-sm font-medium"
                              onClick={handlePasswordReset}
                              disabled={isResettingPassword || isLoading}
                            >
                              {isResettingPassword ? "Sending..." : "Forgot Password?"}
                            </Button>
                          </div>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading || isResettingPassword}>
                      {(isLoading || isResettingPassword) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Login
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card className="shadow-none border-0 sm:shadow-sm sm:border">
              <CardHeader>
                <CardTitle>Sign Up</CardTitle>
                <CardDescription>Create a new account to get started.</CardDescription>
              </CardHeader>
               <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAuthAction)}>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="new.user@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Choose a secure password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
