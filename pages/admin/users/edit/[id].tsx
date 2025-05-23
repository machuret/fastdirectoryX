import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, Edit3, UserX } from 'lucide-react'; // Added Edit3, UserX
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

// Enums (ensure these match your Prisma schema and backend API expectations)
const UserRole = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  EDITOR: 'EDITOR',
} as const;

const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING: 'PENDING', // If applicable
} as const;

type UserRoleType = typeof UserRole[keyof typeof UserRole];
type UserStatusType = typeof UserStatus[keyof typeof UserStatus];

// Schema for editing a user
const editUserFormSchema = z.object({
  name: z.string().min(3, { message: "Full name must be at least 3 characters." }).optional(),
  email: z.string().email({ message: "Please enter a valid email address." }).optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

type EditUserFormValues = z.infer<typeof editUserFormSchema>;

interface UserData {
  user_id: string;
  name: string | null;
  email: string | null;
  role: UserRoleType;
  status: UserStatusType;
}

const AdminEditUserPage = () => {
  const router = useRouter();
  const { id: userId } = router.query; // Get user ID from URL

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

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
          const data: UserData = await response.json();
          setUser(data);
          form.reset({
            name: data.name || '',
            email: data.email || '',
            role: data.role,
            status: data.status,
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
  }, [userId, form, router]);

  async function onSubmit(data: EditUserFormValues) {
    if (!userId || typeof userId !== 'string') {
      toast.error("User ID is missing or invalid.");
      return;
    }
    setIsLoading(true);
    try {
      const changedData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      if (Object.keys(changedData).length === 0) {
        toast.info("No changes detected.");
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
      const updatedUser = await response.json();
      toast.success(`User "${updatedUser.name || 'User'}" updated successfully!`);
      form.reset(updatedUser); 
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
                      <Select onValueChange={field.onChange} defaultValue={field.value as UserRoleType} disabled={isLoading}>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value as UserStatusType} disabled={isLoading}>
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
            </CardContent>
          </Card>
        </form>
      </Form>
    </AdminLayout>
  );
};

export default AdminEditUserPage;
