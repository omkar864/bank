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
}

interface RoleManagementProps {
  roles: Role[];
  selectedRole: string;
  setSelectedRole: (role: string) => void;
}

const RoleManagement = ({roles, selectedRole, setSelectedRole}: RoleManagementProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Management</CardTitle>
        <CardDescription>Manage roles and their descriptions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">{selectedRole}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {roles.map(role => (
                <DropdownMenuItem key={role.name} onClick={() => setSelectedRole(role.name)}>
                  {role.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {roles.map(role => (
            <div key={role.name} className="border rounded-md p-4">
              <h3 className="text-lg font-semibold">{role.name}</h3>
              <p className="text-sm text-muted-foreground">{role.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleManagement;
