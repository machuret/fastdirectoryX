import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { User, UserRole, UserStatus } from '@prisma/client'; // Assuming User is the prisma type
import { PlusCircle, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Interface for a user object as displayed in the admin panel.
 * This includes additional properties for display purposes.
 */
interface UserForAdminDisplay {
  id: number; 
  name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  image: string | null;
  emailVerified: string | null; 
  createdAt: string; 
  updatedAt: string; // Dates become strings after JSON serialization
}

/**
 * Props for the FetchUsersResponse if it were a component, but here it's an interface for API response.
 */
interface FetchUsersResponse {
  users: UserForAdminDisplay[];
  totalPages: number;
  currentPage: number;
  totalUsers: number;
}

/**
 * AdminUsersPage component for managing users in the admin panel.
 * Displays a list of users with pagination, search, and filtering capabilities.
 * Allows admins to add, edit, and delete users.
 */
const AdminUsersPage = () => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  
  /** @state {UserForAdminDisplay[]} users - List of users to display. */
  const [users, setUsers] = useState<UserForAdminDisplay[]>([]);
  /** @state {boolean} isLoading - General loading state for the page, primarily for fetching users. */
  const [isLoading, setIsLoading] = useState(true);
  /** @state {string | null} error - Error message if fetching users fails. */
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  /** @state {number} currentPage - The current page number for pagination. */
  const [currentPage, setCurrentPage] = useState(1);
  /** @state {number} totalPages - The total number of pages available. */
  const [totalPages, setTotalPages] = useState(1);
  /** @state {number} limit - The number of users to display per page. */
  const [limit, setLimit] = useState(10); // Items per page

  // Search and filter state
  /** @state {string} searchTerm - The current search term entered by the user. */
  const [searchTerm, setSearchTerm] = useState('');
  /** @state {UserRole | ''} roleFilter - The selected role to filter users by. Empty string means no filter. */
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  /** @state {UserStatus | ''} statusFilter - The selected status to filter users by. Empty string means no filter. */
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');

  /**
   * Fetches users from the API based on current pagination, search, and filter states.
   * Updates component state with fetched users, total pages, and current page.
   * Handles loading and error states during the fetch operation.
   */
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      if (searchTerm) queryParams.append('search', searchTerm);
      if (roleFilter) queryParams.append('role', roleFilter);
      if (statusFilter) queryParams.append('status', statusFilter);

      const response = await fetch(`/api/admin/users?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }
      const data: FetchUsersResponse = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error fetching users: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, searchTerm, roleFilter, statusFilter]);

  /**
   * Effect hook to fetch users when the session is authenticated and the user is an ADMIN.
   * Also re-fetches if any dependency in fetchUsers (pagination, filters) changes.
   */
  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [sessionStatus, session, fetchUsers]); // fetchUsers is memoized, dependencies are inside it

  /**
   * Handles changes to the search input field.
   * @param {React.ChangeEvent<HTMLInputElement>} event - The input change event.
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  /**
   * Handles the submission of the search form.
   * Prevents default form submission, resets to the first page, and triggers user fetching.
   * @param {React.FormEvent<HTMLFormElement>} event - The form submission event.
   */
  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchUsers();
  };

  /**
   * Handles changes to the role filter select input.
   * Updates the role filter state, resets to the first page.
   * Note: fetchUsers is triggered by the useEffect watching roleFilter.
   * @param {string} value - The selected role value.
   */
  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value as UserRole | '');
    setCurrentPage(1);
  };

  /**
   * Handles changes to the status filter select input.
   * Updates the status filter state, resets to the first page.
   * Note: fetchUsers is triggered by the useEffect watching statusFilter.
   * @param {string} value - The selected status value.
   */
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as UserStatus | '');
    setCurrentPage(1);
  };
  
  /**
   * Effect hook to refetch users when filters (role, status) or pagination (currentPage, limit) change.
   * This ensures the list updates automatically when these parameters are modified.
   * Relies on fetchUsers being memoized by useCallback.
   */
  useEffect(() => {
    // Refetch when filters change (excluding initial load handled by sessionStatus effect)
    if (sessionStatus === 'authenticated') {
        fetchUsers();
    }
  }, [roleFilter, statusFilter, currentPage, limit]); // fetchUsers is memoized

  /**
   * Handles the deletion of a user.
   * Prompts for confirmation before sending a DELETE request to the API.
   * On success, shows a toast notification and refetches the user list.
   * On failure, shows an error toast.
   * @param {number} userId - The ID of the user to delete.
   * @param {string | null} [userName] - The name of the user, for display in confirmation/toast messages.
   */
  const handleDeleteUser = async (userId: number, userName?: string | null) => {
    const confirmationMessage = userName 
      ? `Are you sure you want to delete the user "${userName}"?` 
      : 'Are you sure you want to delete this user?';

    if (window.confirm(confirmationMessage)) {
      setIsLoading(true); // You might want a more specific loading state for delete operations
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete user');
        }

        toast.success(`User ${userName || 'ID: ' + userId} deleted successfully.`);
        fetchUsers(); // Refetch users to update the list
      } catch (err: any) {
        setError(err.message); // This error state is general, consider specific delete error
        toast.error(`Error deleting user: ${err.message}`);
      } finally {
        setIsLoading(false); // Reset general loading state
      }
    }
  };

  if (sessionStatus === 'loading') {
    return <AdminLayout pageTitle="Loading Users..."><p>Loading session...</p></AdminLayout>;
  }

  if (sessionStatus === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    router.push('/auth/signin'); // Or a custom access denied page
    return <AdminLayout pageTitle="Access Denied"><p>Access Denied.</p></AdminLayout>;
  }

  return (
    <AdminLayout 
      pageTitle="Manage Users" 
      pageDescription="View, create, edit, and delete user accounts."
      pageIcon={PlusCircle}
      actionButtons={(
        <Button onClick={() => router.push('/admin/users/new')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New User
        </Button>
      )}
    >
      <div className="space-y-4">
        {/* Filter and Search Section */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-2 p-4 bg-card border rounded-lg shadow-sm">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="max-w-sm"
          />
          <Button type="submit" variant="outline"><Search className="mr-2 h-4 w-4"/>Search</Button>
          
          <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Roles</SelectItem>
              {Object.values(UserRole).map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {Object.values(UserStatus).map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </form>

        {isLoading && <p>Loading users...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!isLoading && !error && (
          <>
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name || 'N/A'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.status}</TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/users/edit/${user.id}`)} title={`Edit ${user.name || user.email}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id, user.name)} className="text-red-500 hover:text-red-600" title={`Delete ${user.name || user.email}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No users found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsersPage;
