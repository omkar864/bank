
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {useState, useEffect, useCallback} from 'react';
import type {LoanSchemeFormValues} from './SchemeCreateForm.tsx';
import SchemeCreateForm from './SchemeCreateForm.tsx';
import SchemeList from './SchemeList.tsx';
import { useToast } from '@/hooks/use-toast';

interface LoanSchemeManagementProps {
  loanSchemes: LoanSchemeFormValues[];
  onSchemeSubmit: (values: LoanSchemeFormValues) => Promise<void>;
  onSchemeDelete: (schemeName: string) => Promise<void>;
}

const LoanSchemeManagement = ({
  loanSchemes,
  onSchemeSubmit,
  onSchemeDelete,
}: LoanSchemeManagementProps) => {
  const { toast } = useToast();
  const [editingScheme, setEditingScheme] = useState<LoanSchemeFormValues | null>(null);

  useEffect(() => {
    if (editingScheme) {
      const formElement = document.getElementById('loan-scheme-form-card');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [editingScheme]);


  const handleSchemeSubmit = useCallback(async (values: LoanSchemeFormValues) => {
    if (editingScheme && editingScheme.schemeName !== values.schemeName) {
      toast({
        title: "Error Updating Scheme",
        description: "Scheme Name cannot be changed during an update.",
        variant: "destructive",
      });
      return;
    }
    await onSchemeSubmit(values);
    setEditingScheme(null);
  }, [editingScheme, onSchemeSubmit, toast]);

  const handleEditScheme = (schemeToEdit: LoanSchemeFormValues) => {
    setEditingScheme(schemeToEdit);
  };

  const handleCancelEdit = () => {
    setEditingScheme(null);
  };

  const handleDeleteScheme = useCallback(async (schemeNameToDelete: string) => {
    await onSchemeDelete(schemeNameToDelete);
    if (editingScheme && editingScheme.schemeName === schemeNameToDelete) {
      setEditingScheme(null);
    }
  }, [editingScheme, onSchemeDelete]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan Scheme Management</CardTitle>
        <CardDescription>Create, view, edit, and delete loan schemes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div id="loan-scheme-form-card">
          <SchemeCreateForm
            onSubmit={handleSchemeSubmit}
            editingScheme={editingScheme}
            onCancelEdit={handleCancelEdit}
          />
        </div>
        <SchemeList
          loanSchemes={loanSchemes}
          onEdit={handleEditScheme}
          onDelete={handleDeleteScheme}
        />
      </CardContent>
    </Card>
  );
};

export default LoanSchemeManagement;
