'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Role {
  name: string;
  description: string;
  // Add icon or other properties if needed later
  // icon: React.ComponentType<{ className?: string }>; 
}

interface RoleManagementProps {
  roles: Role[];
  selectedRole: string;
  setSelectedRole: (role: string) => void;
}

const RoleManagement = ({roles, selectedRole, setSelectedRole}: RoleManagementProps) => {
  const currentRoleDetails = roles.find(r => r.name === selectedRole);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Management</CardTitle>
        <CardDescription>Select a role to view its description and manage associated permissions elsewhere.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="font-medium">Selected Role:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between">
                {selectedRole}
                <span className="ml-2">▼</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
              {roles.map(role => (
                <DropdownMenuItem key={role.name} onSelect={() => setSelectedRole(role.name)}>
                  {role.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {currentRoleDetails && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>{currentRoleDetails.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{currentRoleDetails.description}</p>
              {/* Permissions configuration for this role would typically be handled in the "Permissions" tab */}
            </CardContent>
          </Card>
        )}

        {/* Displaying all roles and descriptions - can be removed if redundant with selection above */}
        {/* <h3 className="text-lg font-semibold mt-6">All Roles</h3>
        <div className="grid gap-4">
          {roles.map(role => (
            <div key={role.name} className="border rounded-md p-4">
              <h4 className="text-md font-semibold">{role.name}</h4>
              <p className="text-xs text-muted-foreground">{role.description}</p>
            </div>
          ))}
        </div> */}
      </CardContent>
    </Card>
  );
};

export default RoleManagement;
