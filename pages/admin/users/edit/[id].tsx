import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, Edit3, UserX } from 'lucide-react'; 
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { UserRole, UserStatus } from '@prisma/client'; 

/**
 * Zod schema for validating the user edit form data.
 * All fields are optional. Password and confirmPassword are validated together if password is provided.
 */
const editUserFormSchema = z.object({
  name: z.string().min(3, { message: "Full name must be at least 3 characters." }).optional(),
  email: z.string().email({ message: "Please enter a valid email address." }).optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }).optional().or(z.literal('')), 
  confirmPassword: z.string().optional().or(z.literal('')), 
}).refine((data) => {
  if (data.password && data.password.length > 0) { 
    return data.password === data.confirmPassword;
  }
  return true; 
}, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

/**
 * Type representing the validated values from the edit user form.
 * Inferred from the editUserFormSchema.
 */
type EditUserFormValues = z.infer<typeof editUserFormSchema>;

/**
 * Interface representing the user data structure received from the API.
 * Dates are expected to be serialized as strings.
 */
interface UserDataFromAPI { 
  id: number;
  name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  image: string | null;
  emailVerified: string | null; 
  createdAt: string; 
  updatedAt: string; 
}

/**
 * AdminEditUserPage component for editing an existing user's details.
 * Fetches user data based on ID from URL, pre-populates a form, and allows updates.
 * Includes functionality to change the user's password.
 * Submits data to the PUT /api/admin/users/[id] endpoint.
 */
const AdminEditUserPage = () => {
  const router = useRouter();
  /** @state {string | string[] | undefined} userId - The ID of the user being edited, from URL query. */
  const { id: userId } = router.query; 

  /** @state {boolean} isLoading - Indicates if a form submission (update) is in progress. */
  const [isLoading, setIsLoading] = useState(false);
  /** @state {boolean} isFetching - Indicates if the initial user data fetch is in progress. */
  const [isFetching, setIsFetching] = useState(true);
  /** @state {UserDataFromAPI | null} user - Stores the fetched user data. */
  const [user, setUser] = useState<UserDataFromAPI | null>(null); 

  /**
   * React Hook Form instance for managing the edit user form.
   * Uses Zod for schema validation and sets default values.
   * Form values are reset after initial data fetch and after successful updates.
   */
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      // role and status will be set by form.reset after fetch
    },
  });

  /**
   * Effect hook to fetch user data when the component mounts or the userId changes.
   * Sets fetching state, calls the GET /api/admin/users/[id] API endpoint.
   * On success, updates user state and resets the form with fetched data.
   * On failure, shows an error toast.
   */
  useEffect(() => {
    if (userId && typeof userId === 'string') {
      setIsFetching(true);
      const fetchUserData = async () => {
        try {
          const response = await fetch(`/api/admin/users/${userId}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.status}`);
          }
          const data: UserDataFromAPI = await response.json(); 
          setUser(data);
          form.reset({
            name: data.name || '',
            email: data.email || '', 
            role: data.role,
            status: data.status,
            password: '', 
            confirmPassword: '',
          });
        } catch (error: any) {
          console.error("Failed to fetch user data:", error);
          toast.error(error.message || "Failed to load user data.");
        } finally {
          setIsFetching(false);
        }
      };
      fetchUserData();
    }
  }, [userId, form, router]); // Added router to dependencies as it's used for potential navigation on error, though not explicitly here.

  /**
   * Handles the submission of the edit user form.
   * Validates user ID, sets loading state, and sends a PUT request to the API with changed data.
   * Only sends fields that have been modified or if a new password is set.
   * On success, displays a toast notification and resets the form with updated data.
   * On failure, shows an error toast.
   * @param {EditUserFormValues} data - The validated form data.
   */
  async function onSubmit(data: EditUserFormValues) {
    if (!userId || typeof userId !== 'string') {
      toast.error("User ID is missing or invalid.");
      return;
    }
    setIsLoading(true);
    try {
      const changedData = Object.fromEntries(
        Object.entries(data).filter(([key, v]) => {
          if (key === 'password' || key === 'confirmPassword') {
            return typeof v === 'string' && v.length > 0;
          }
          return form.formState.dirtyFields[key as keyof EditUserFormValues];
        })
      );

      if ('confirmPassword' in changedData) {
        delete changedData.confirmPassword;
      }

      if (changedData.password === '') {
        delete changedData.password;
      }

      if (Object.keys(changedData).length === 0) {
        toast.info("No changes detected to save.");
        setIsLoading(false);
        return;
      }
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      const updatedUser: UserDataFromAPI = await response.json();
      toast.success(`User "${updatedUser.name || 'User'}" updated successfully!`);
      form.reset({
        ...form.getValues(), 
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        role: updatedUser.role,
        status: updatedUser.status,
        password: '', 
        confirmPassword: '',
      });
      setUser(updatedUser); 
    } catch (error: any) {
      console.error("Failed to update user:", error);
      toast.error(error.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  const pageTitle = "Edit User";
  const pageDescription = user ? `Editing details for ${user.name || user.email}` : "Loading user details...";

  const actionButtons = (
    <>
      <Link href="/admin/users" passHref>
        <Button variant="outline" disabled={isLoading || isFetching}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
        </Button>
      </Link>
      <Button type="submit" form="edit-user-form" disabled={isLoading || isFetching || !form.formState.isDirty}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save Changes
      </Button>
    </>
  );
  
  if (isFetching) {
    return (
        <AdminLayout pageTitle="Loading..." pageDescription="Fetching user data..." pageIcon={Loader2} actionButtons={actionButtons}>
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        </AdminLayout>
    );
  }

  if (!user && !isFetching) {
     return (
        <AdminLayout pageTitle="Error" pageDescription="User not found or could not be loaded." pageIcon={UserX} actionButtons={actionButtons}>
            <Card>
                <CardHeader><CardTitle>User Not Found</CardTitle></CardHeader>
                <CardContent>
                    <p>The user you are trying to edit could not be found. They may have been deleted, or the ID is incorrect.</p>
                    <Link href="/admin/users" passHref className="mt-4">
                        <Button variant="default">Go to User Management</Button>
                    </Link>
                </CardContent>
            </Card>
        </AdminLayout>
    );   
  }

  return (
    <AdminLayout
      pageTitle={pageTitle}
      pageDescription={pageDescription}
      pageIcon={Edit3}
      actionButtons={actionButtons}
    >
      <Head>
        <title>{pageTitle} - Admin</title>
      </Head>

      <Form {...form}>
        <form id="edit-user-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Update the user's profile details, role, and status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Doe" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g. user@example.com" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value as UserRole} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(UserRole).map((roleValue) => (
                            <SelectItem key={roleValue} value={roleValue}>
                              {roleValue.charAt(0).toUpperCase() + roleValue.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value as UserStatus} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(UserStatus).map((statusValue) => (
                            <SelectItem key={statusValue} value={statusValue}>
                              {statusValue.charAt(0).toUpperCase() + statusValue.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter new password" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm new password" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </form>
      </Form>
    </AdminLayout>
  );
};

export default AdminEditUserPage;
