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
import {Textarea} from '@/components/ui/textarea';
import {Button} from '@/components/ui/button';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {useState} from 'react';

const branchSchema = z.object({
  branchType: z.enum(['Branch', 'Sub-Branch']),
  branchName: z.string().min(2, {
    message: 'Branch Name must be at least 2 characters.',
  }),
  branchAddress: z.string(),
  parentBranch: z.string().optional(),
});

type BranchFormValues = z.infer<typeof branchSchema>;

const BranchManagement = () => {
  const [branches, setBranches] = useState([
    {
      branchCode: '1000',
      branchName: 'Default Branch',
      branchAddress: '123 Main St',
      branchType: 'Branch',
    },
  ]);
  const [nextBranchCode, setNextBranchCode] = useState(1001);

  const branchForm = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      branchType: 'Branch',
      branchName: '',
      branchAddress: '',
      parentBranch: '',
    },
  });

  const handleBranchSubmit = (values: BranchFormValues) => {
    let newBranchCode = nextBranchCode.toString();
    setBranches([
      ...branches,
      {
        branchCode: newBranchCode,
        branchName: values.branchName,
        branchAddress: values.branchAddress,
        branchType: values.branchType,
      },
    ]);
    setNextBranchCode(nextBranchCode + 1);
    branchForm.reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branch Management</CardTitle>
        <CardDescription>Create and manage branches and sub-branches.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...branchForm}>
          <form onSubmit={branchForm.handleSubmit(handleBranchSubmit)} className="space-y-4">
            <FormField
              control={branchForm.control}
              name="branchType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Branch Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Branch">Branch</SelectItem>
                      <SelectItem value="Sub-Branch">Sub-Branch</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {branchForm.watch('branchType') === 'Sub-Branch' && (
              <FormField
                control={branchForm.control}
                name="parentBranch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Parent Branch</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Parent Branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches
                          .filter(branch => branch.branchType === 'Branch')
                          .map(branch => (
                            <SelectItem key={branch.branchCode} value={branch.branchCode}>
                              {branch.branchCode} - {branch.branchName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={branchForm.control}
              name="branchName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Branch Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={branchForm.control}
              name="branchAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Branch Address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit">Create Branch</Button>
          </form>
        </Form>
        <h2 className="text-lg font-semibold mt-4">Existing Branches</h2>
        <ul>
          {branches.map((branch, index) => (
            <li key={index} className="border rounded-md p-4 my-2">
              <h3 className="font-semibold">
                {branch.branchCode} - {branch.branchName}
              </h3>
              <p>Type: {branch.branchType}</p>
              <p>Address: {branch.branchAddress}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default BranchManagement;
