
'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Branch } from './BranchManagement'; // Import the Branch type
import { Badge } from '@/components/ui/badge';
import { Building, GitFork, MapPin, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BranchListProps {
  branches: Branch[];
  onEdit: (branch: Branch) => void;
  onDelete: (branchCode: string) => void;
}

const BranchList = ({ branches, onEdit, onDelete }: BranchListProps) => {
  const mainBranches = branches.filter(b => b.branchType === 'Branch');
  const subBranches = branches.filter(b => b.branchType === 'Sub-Branch');

  const getParentBranchName = (parentCode?: string) => {
    if (!parentCode) return 'N/A';
    const parent = branches.find(b => b.branchCode === parentCode);
    return parent ? `${parent.branchCode} - ${parent.branchName}` : 'Unknown Parent';
  };

  const BranchItemCard = ({ branch }: { branch: Branch }) => (
    <Card className="mb-3 hover:shadow-md transition-shadow flex flex-col">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {branch.branchType === 'Branch' ? <Building className="h-5 w-5 text-primary" /> : <GitFork className="h-5 w-5 text-accent" />}
            <CardTitle className="text-base font-semibold">
              {branch.branchCode} - {branch.branchName}
            </CardTitle>
          </div>
          <Badge variant={branch.branchType === 'Branch' ? 'secondary' : 'outline'}>
            {branch.branchType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-1 text-sm space-y-1 flex-grow">
        {branch.branchType === 'Sub-Branch' && (
          <p className="text-muted-foreground">
            <span className="font-medium">Parent:</span> {getParentBranchName(branch.parentBranch)}
          </p>
        )}
        <div className="flex items-start text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <span>{branch.branchAddress}</span>
        </div>
      </CardContent>
      <div className="p-4 pt-2 border-t flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(branch)}>
          <Edit className="mr-1.5 h-4 w-4" /> Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the branch
                "{branch.branchCode} - {branch.branchName}". Ensure this branch is not in active use.
                {branch.branchType === 'Branch' && " Deleting a main branch with sub-branches is not allowed."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(branch.branchCode)}>
                Yes, delete branch
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 mt-8">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Main Branches ({mainBranches.length})</CardTitle>
          <CardDescription>List of all primary branches.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[250px] w-full rounded-md border p-1">
            {mainBranches.length > 0 ? (
              <div className="p-3">
                {mainBranches.map((branch) => (
                  <BranchItemCard key={branch.branchCode} branch={branch} />
                ))}
              </div>
            ) : (
              <p className="p-4 text-center text-muted-foreground">No main branches created yet.</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

       <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Sub-Branches ({subBranches.length})</CardTitle>
           <CardDescription>List of all sub-branches linked to a parent branch.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[250px] w-full rounded-md border p-1">
            {subBranches.length > 0 ? (
              <div className="p-3">
                {subBranches.map((branch) => (
                  <BranchItemCard key={branch.branchCode} branch={branch} />
                ))}
              </div>
            ) : (
              <p className="p-4 text-center text-muted-foreground">No sub-branches created yet.</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchList;
