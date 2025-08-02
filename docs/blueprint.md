# **App Name**: AccessGuard

## Core Features:

- Role Hierarchy: Define roles with hierarchical inheritance. Roles inherit permissions from their parent roles.
- Granular Permissions: Configure granular permissions (View, Fill, Edit) for each section (Customer Forms, KYC, etc.) based on the assigned role.
- User Role Assignment: Implement a user interface to assign roles to users and manage permissions effectively.

## Style Guidelines:

- Primary color: Dark blue (#1A237E) for a professional and secure feel.
- Secondary color: Light gray (#EEEEEE) for backgrounds and content separation.
- Accent: Teal (#00BCD4) to highlight interactive elements and important actions.
- Clear visual hierarchy to present permissions and roles in a manageable way.
- Use distinct icons to represent different permission types (view, fill, edit).

## Original User Request:
Role-Based Access Control (RBAC) System with Hierarchical Branch Management & Granular Permissions
1. Role-Based Access Control (RBAC) - Permission Levels
Admin has full control to assign access levels for each section.

Each section (Customer Forms, KYC Verification, Loan Collection, Pending Dues, etc.) will have three permission types:

View Only: User can see data but cannot fill or modify anything.

View + Fill: User can enter new data but cannot modify or delete existing records.

View + Fill + Edit: User can enter new data and modify existing records (only if Admin explicitly grants edit permissions).

If no edit permission is granted, existing data remains locked and cannot be modified by the user.
  