import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, UserPlus } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from 'sonner'; // For toast notifications

// Define UserRole and UserStatus enums to match Prisma schema if not already globally available
// For simplicity, defining them here if not imported from a central types file.
// Ensure these match exactly with your Prisma schema definitions.
const UserRole = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  EDITOR: 'EDITOR', // Assuming EDITOR is a role
  // ... other roles
} as const;

const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED',
  // ... other statuses
} as const;

type UserRoleType = typeof UserRole[keyof typeof UserRole];
type UserStatusType = typeof UserStatus[keyof typeof UserStatus];

const newUserFormSchema = z.object({
  name: z.string().min(3, { message: "Full name must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  role: z.nativeEnum(UserRole).optional(), // Made optional, default is handled by useForm's defaultValues
  // status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE), // Status might be set by backend by default
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"], // Path to field to display error
});

type NewUserFormValues = z.infer<typeof newUserFormSchema>;

const AdminAddNewUserPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter(); // Initialize router

  const form = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: UserRole.USER,
      // status: UserStatus.ACTIVE,
    },
  });

  async function onSubmit(data: NewUserFormValues) {
    setIsLoading(true);
    setApiError(null);
    try {
      // Exclude confirmPassword from the data sent to the API
      const { confirmPassword, ...userData } = data;

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const newUser = await response.json();
      toast.success(`User "${newUser.name}" has been successfully created.`);
      router.push('/admin/users'); // Redirect to user list

    } catch (error: any) {
      console.error("Failed to create user:", error);
      setApiError(error.message || "An unexpected error occurred. Please try again.");
      toast.error(error.message || "An unexpected error occurred. Please try again.");
    }
    setIsLoading(false);
  }

  const pageTitle = "Add New User";
  const pageDescription = "Create a new user account and assign roles.";

  const actionButtons = (
    <div className="flex gap-2">
        <Link href="/admin/users" passHref>
            <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
            </Button>
        </Link>
        <Button type="submit" form="new-user-form" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Create User
        </Button>
    </div>
  );

  return (
    <AdminLayout
        pageTitle={pageTitle}
        pageDescription={pageDescription}
        pageIcon={UserPlus}
        actionButtons={actionButtons}
    >
      <Head>
        <title>{pageTitle} - Admin</title>
      </Head>

      <form id="new-user-form" onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>Enter the information for the new user.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {apiError && (
              <p className="text-sm font-medium text-destructive">{apiError}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                <Input 
                  id="name" 
                  placeholder="Enter user's full name"
                  {...form.register("name")}
                  disabled={isLoading} 
                  className="mt-1"
                />
                {form.formState.errors.name && <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter user's email"
                  {...form.register("email")}
                  disabled={isLoading}
                  className="mt-1"
                />
                {form.formState.errors.email && <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter password"
                  {...form.register("password")}
                  disabled={isLoading}
                  className="mt-1"
                />
                {form.formState.errors.password && <p className="text-sm text-red-500 mt-1">{form.formState.errors.password.message}</p>}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="Confirm password"
                  {...form.register("confirmPassword")}
                  disabled={isLoading}
                  className="mt-1"
                />
                {form.formState.errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{form.formState.errors.confirmPassword.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="role">Role <span className="text-destructive">*</span></Label>
              <Select 
                {...form.register("role")}
                defaultValue={form.getValues("role") || UserRole.USER} 
                onValueChange={(value) => form.setValue('role', value as UserRoleType, { shouldValidate: true })} 
                disabled={isLoading}
              >
                <SelectTrigger id="role" className="mt-1">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserRole).map((roleValue) => (
                    <SelectItem key={roleValue} value={roleValue}>
                      {roleValue.charAt(0).toUpperCase() + roleValue.slice(1).toLowerCase()} {/* Nicer formatting */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.role && <p className="text-sm text-red-500 mt-1">{form.formState.errors.role.message}</p>}
            </div>

          </CardContent>
        </Card>
      </form>
    </AdminLayout>
  );
};

export default AdminAddNewUserPage;
