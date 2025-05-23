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
import { UserRole, UserStatus } from '@prisma/client'; // Import from Prisma client

/**
 * Zod schema for validating the new user form data.
 * Defines rules for name, email, password, confirmPassword, role, and status fields.
 */
const newUserFormSchema = z.object({
  name: z.string().min(3, { message: "Full name must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  role: z.nativeEnum(UserRole), 
  status: z.nativeEnum(UserStatus),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"], // Path to field to display error
});

/**
 * Type representing the validated values from the new user form.
 * Inferred from the newUserFormSchema.
 */
type NewUserFormValues = z.infer<typeof newUserFormSchema>;

/**
 * AdminAddNewUserPage component for creating a new user account.
 * Provides a form with fields for user details, password, role, and status.
 * Submits data to the POST /api/admin/users endpoint.
 */
const AdminAddNewUserPage = () => {
  /** @state {boolean} isLoading - Indicates if the form submission is in progress. */
  const [isLoading, setIsLoading] = useState(false);
  /** @state {string | null} apiError - Stores error messages from the API submission. */
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter(); // Initialize router

  /**
   * React Hook Form instance for managing the new user form.
   * Uses Zod for schema validation and sets default values for form fields.
   */
  const form = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: UserRole.USER,
      status: UserStatus.ACTIVE, // Add status to defaultValues
    },
  });

  /**
   * Handles the submission of the new user form.
   * Sets loading state, sends a POST request to the API with form data.
   * On success, displays a toast notification and redirects to the user list page.
   * On failure, sets API error state and displays an error toast.
   * @param {NewUserFormValues} data - The validated form data.
   */
  async function onSubmit(data: NewUserFormValues) {
    setIsLoading(true);
    setApiError(null);
    try {
      // Exclude confirmPassword from the data sent to the API
      // Role and status will be included; if they were undefined (e.g. not set by form defaultValues),
      // the API defaults would kick in. With useForm defaultValues, they should always be present.
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="role">Role <span className="text-destructive">*</span></Label>
                <Select 
                  value={form.watch("role")}
                  onValueChange={(value) => form.setValue('role', value as UserRole, { shouldValidate: true })} 
                  disabled={isLoading}
                >
                  <SelectTrigger id="role" className="mt-1">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(UserRole).map((roleValue) => (
                      <SelectItem key={roleValue} value={roleValue}>
                        {roleValue}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.role && <p className="text-sm text-red-500 mt-1">{form.formState.errors.role.message}</p>}
              </div>

              <div>
                <Label htmlFor="status">Status <span className="text-destructive">*</span></Label>
                <Select 
                  value={form.watch("status")}
                  onValueChange={(value) => form.setValue('status', value as UserStatus, { shouldValidate: true })} 
                  disabled={isLoading}
                >
                  <SelectTrigger id="status" className="mt-1">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(UserStatus).map((statusValue) => (
                      <SelectItem key={statusValue} value={statusValue}>
                        {statusValue}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.status && <p className="text-sm text-red-500 mt-1">{form.formState.errors.status.message}</p>}
              </div>
            </div>

          </CardContent>
        </Card>
      </form>
    </AdminLayout>
  );
};

export default AdminAddNewUserPage;
