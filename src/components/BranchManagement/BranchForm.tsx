
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Branch } from './BranchManagement'; // Import the Branch type

const branchSchema = z.object({
  branchType: z.enum(['Branch', 'Sub-Branch']),
  branchName: z.string().min(2, {
    message: 'Branch Name must be at least 2 characters.',
  }),
  branchAddress: z.string().min(5, {
    message: 'Branch Address must be at least 5 characters.',
  }),
  parentBranch: z.string().optional(),
});

export type BranchFormValues = z.infer<typeof branchSchema>;

interface BranchFormProps {
  onSubmit: (values: BranchFormValues, editingBranchCode?: string) => void;
  branches: Branch[]; // Pass existing branches for parent selection
  editingBranch?: Branch | null;
  onCancelEdit?: () => void;
}

const BranchForm = ({ onSubmit, branches, editingBranch, onCancelEdit }: BranchFormProps) => {
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      branchType: 'Branch',
      branchName: '',
      branchAddress: '',
      parentBranch: '',
    },
  });

  useEffect(() => {
    if (editingBranch) {
      form.reset({
        branchType: editingBranch.branchType,
        branchName: editingBranch.branchName,
        branchAddress: editingBranch.branchAddress,
        parentBranch: editingBranch.parentBranch || '',
      });
    } else {
      form.reset({
        branchType: 'Branch',
        branchName: '',
        branchAddress: '',
        parentBranch: '',
      });
    }
  }, [editingBranch, form]);

  const branchType = form.watch('branchType');
  const isEditing = !!editingBranch;

  function handleFormSubmit(values: BranchFormValues) {
    onSubmit(values, editingBranch?.branchCode);
    if (!isEditing) { // Only reset fully if creating
      form.reset();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <FormField
            control={form.control}
            name="branchType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value} // Use value for controlled component
                  disabled={isEditing}
                >
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
                {isEditing && <FormDescription className="text-xs">Branch type cannot be changed.</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />

          {branchType === 'Sub-Branch' && (
            <FormField
              control={form.control}
              name="parentBranch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Parent Branch</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''} // Ensure value is controlled
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Parent Branch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches
                        .filter(branch => branch.branchType === 'Branch') // Only show main branches as parents
                        .map(branch => (
                          <SelectItem key={branch.branchCode} value={branch.branchCode}>
                            {branch.branchCode} - {branch.branchName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {isEditing && <FormDescription className="text-xs">Parent branch cannot be changed.</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="branchName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{branchType} Name</FormLabel>
              <FormControl>
                <Input placeholder={`Enter ${branchType.toLowerCase()} name`} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="branchAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{branchType} Address</FormLabel>
              <FormControl>
                <Textarea placeholder={`Enter full address for the ${branchType.toLowerCase()}`} {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex space-x-2">
          <Button type="submit" className="w-full md:w-auto">
            {isEditing ? `Update ${branchType}` : `Create ${branchType}`}
          </Button>
          {isEditing && onCancelEdit && (
            <Button type="button" variant="outline" onClick={onCancelEdit} className="w-full md:w-auto">
              Cancel Edit
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};

export default BranchForm;
