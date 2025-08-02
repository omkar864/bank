
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import BranchForm from './BranchForm';
import BranchList from './BranchList';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { Timestamp } from 'firebase/firestore';


export interface Branch {
  branchCode: string;
  branchName: string;
  branchAddress: string;
  branchType: 'Branch' | 'Sub-Branch';
  parentBranch?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface BranchFormValues {
  branchType: 'Branch' | 'Sub-Branch';
  branchName: string;
  branchAddress: string;
  parentBranch?: string;
}

interface BranchManagementProps {
  branches: Branch[];
  onBranchSubmit: (values: BranchFormValues, editingBranchCode?: string) => Promise<void>;
  onBranchDelete: (branchCode: string) => Promise<void>;
}

const BranchManagement = ({
  branches,
  onBranchSubmit,
  onBranchDelete,
}: BranchManagementProps) => {
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (editingBranch) {
      const formElement = document.getElementById('branch-management-form-card');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [editingBranch]);

  const handleBranchSubmit = useCallback(async (values: BranchFormValues, editingBranchCode?: string) => {
    await onBranchSubmit(values, editingBranchCode);
    if (editingBranchCode) {
        setEditingBranch(null);
    }
  }, [onBranchSubmit]);

  const handleEditBranch = (branchToEdit: Branch) => {
    setEditingBranch(branchToEdit);
  };

  const handleCancelEdit = () => {
    setEditingBranch(null);
  };

  const handleDeleteBranch = useCallback(async (branchCodeToDelete: string) => {
    const branchToDelete = branches.find(b => b.branchCode === branchCodeToDelete);
    if (!branchToDelete) return;

    if (branchToDelete.branchType === 'Branch') {
      const hasSubBranches = branches.some(sub => sub.parentBranch === branchCodeToDelete);
      if (hasSubBranches) {
        toast({
          title: "Deletion Prevented",
          description: `Branch "${branchToDelete.branchName}" cannot be deleted because it has sub-branches assigned to it.`,
          variant: "destructive",
        });
        return;
      }
    }
    
    await onBranchDelete(branchCodeToDelete);

    if (editingBranch && editingBranch.branchCode === branchCodeToDelete) {
      setEditingBranch(null);
    }
  }, [branches, editingBranch, onBranchDelete, toast]);

  return (
    <Card className="shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-2xl">Branch & Sub-Branch Management</CardTitle>
        <CardDescription>Create, view, edit, and delete your organization's branches and sub-branches.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        <div id="branch-management-form-card">
          <h3 className="text-xl font-semibold mb-4 text-primary border-b pb-2">
            {editingBranch ? `Edit Branch: ${editingBranch.branchName}` : 'Create New Branch / Sub-Branch'}
          </h3>
          <BranchForm
            onSubmit={handleBranchSubmit}
            branches={branches}
            editingBranch={editingBranch}
            onCancelEdit={handleCancelEdit}
          />
        </div>
        <Separator />
        <div>
          <h3 className="text-xl font-semibold mb-1 text-primary">Existing Branches Overview</h3>
          <BranchList
            branches={branches}
            onEdit={handleEditBranch}
            onDelete={handleDeleteBranch}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BranchManagement;
