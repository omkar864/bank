
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
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {ScrollArea} from '@/components/ui/scroll-area';
import {useState} from 'react';

const userSchema = z.object({
  role: z.enum(['Administrator', 'Manager', 'Agent', 'Collection Agent']),
  fullName: z.string().min(2, {
    message: 'Full Name must be at least 2 characters.',
  }),
  mobileNumber: z.string(),
  branch: z.string().optional(), // Branch code
});

type UserFormValues = z.infer<typeof userSchema>;

// Define a type for the user object in state
interface User extends UserFormValues {
  email: string;
  password?: string;
}

const UserManagement = () => {
  // Provide the explicit type to useState
  const [users, setUsers] = useState<User[]>([]);
  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'Agent',
      fullName: '',
      mobileNumber: '',
      branch: '',
    },
  });

  const handleUserSubmit = (values: UserFormValues) => {
    // Generate email and password (replace with secure password generation)
    const email = `${values.fullName.replace(/\s+/g, '').toLowerCase()}@shagunam.com`;
    const password = 'defaultPassword'; // Replace with a secure method

    setUsers([
      ...users,
      {
        ...values,
        email,
        password,
      },
    ]);
    userForm.reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Create and manage user accounts.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...userForm}>
          <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-4">
            <FormField
              control={userForm.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Input placeholder="Full Name" {...field} />
                  </FormControl>
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
                    <Input placeholder="Mobile Number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={userForm.control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Branch</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a branch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Map through existing branches to populate options */}
                      {/* Replace this with actual branch data */}
                      <SelectItem value="1001">1001 - Delhi Branch</SelectItem>
                      <SelectItem value="1002">1002 - Mumbai Branch</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Create User</Button>
          </form>
        </Form>
        <h2 className="text-lg font-semibold mt-4">Existing Users</h2>
        <ScrollArea className="h-[200px] w-full rounded-md border">
          <ul>
            {users.map((user, index) => (
              <li key={index} className="border rounded-md p-4 my-2">
                <h3 className="font-semibold">{user.fullName}</h3>
                <p>Email: {user.email}</p>
                <p>Role: {user.role}</p>
                <p>Branch: {user.branch || 'N/A'}</p>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
