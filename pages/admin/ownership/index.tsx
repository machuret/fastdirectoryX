import { NextPage } from 'next';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import withAdminAuth from '@/hoc/withAdminAuth';
import { ClaimStatus, UserRole } from '@prisma/client';
import { ShieldCheck, RefreshCw } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; 

interface ClaimUser {
  user_id: number;
  name: string | null;
  email: string | null;
}

interface ClaimListingBusiness {
  listing_business_id: number;
  title: string;
  slug: string;
}

interface OwnershipClaimData {
  claim_id: number;
  listing_business_id: number;
  user_id: number;
  claimant_name: string;
  company_name: string | null;
  claimant_email: string;
  claimant_phone: string | null;
  message: string;
  status: ClaimStatus;
  requested_at: string; 
  reviewed_at: string | null; 
  admin_notes: string | null;
  user: ClaimUser;
  listingBusiness: ClaimListingBusiness;
}

interface ApiResponse {
  claims: OwnershipClaimData[];
  totalPages: number;
  currentPage: number;
  totalClaims: number;
}

const SPECIAL_ALL_STATUSES_VALUE = 'ALL_STATUSES'; 

const AdminOwnershipClaimsPage: NextPage = () => {
  const [claims, setClaims] = useState<OwnershipClaimData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<ClaimStatus | typeof SPECIAL_ALL_STATUSES_VALUE>(SPECIAL_ALL_STATUSES_VALUE);

  const fetchClaims = useCallback(async (page = 1, statusFilter: ClaimStatus | typeof SPECIAL_ALL_STATUSES_VALUE = SPECIAL_ALL_STATUSES_VALUE) => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/admin/claims?page=${page}&limit=10`;
      if (statusFilter && statusFilter !== SPECIAL_ALL_STATUSES_VALUE) {
        url += `&status=${statusFilter}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to fetch claims');
      }
      const data: ApiResponse = await response.json();
      setClaims(data.claims);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (err: any) {
      setError(err.message);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchClaims(currentPage, filterStatus);
  }, [fetchClaims, currentPage, filterStatus]);

  const handleUpdateClaimStatus = async (claimId: number, newStatus: ClaimStatus) => {
    const notes = prompt(
      newStatus === ClaimStatus.APPROVED 
        ? 'Optional admin notes for approval:' 
        : 'Optional admin notes for rejection (can be empty):'
    );
    
    try {
      const response = await fetch('/api/admin/claims', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_id: claimId, status: newStatus, admin_notes: notes }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update claim');
      }
      fetchClaims(currentPage, filterStatus); 
      alert(`Claim ${newStatus.toLowerCase()} successfully.`);
    } catch (err: any) {
      setError(err.message); 
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <>
      <Head>
        <title>Manage Ownership Claims</title>
      </Head>
      
      <Card className="shadow-elevation">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-xl">All Claims</CardTitle>
            <div className="flex items-center space-x-2">
              <div>
                <Label htmlFor="statusFilter" className="sr-only">Filter by status:</Label>
                <Select 
                  value={filterStatus} 
                  onValueChange={(value) => {
                    setFilterStatus(value as ClaimStatus | typeof SPECIAL_ALL_STATUSES_VALUE);
                    setCurrentPage(1); 
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SPECIAL_ALL_STATUSES_VALUE}>All Statuses</SelectItem> 
                    {Object.values(ClaimStatus).map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="outline"
                onClick={() => fetchClaims(currentPage, filterStatus)} 
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && claims.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Loading claims...</p>
            </div>
          )}
          {error && (
            <div className="text-center py-10">
              <p className="text-destructive">Error: {error}</p>
              <Button onClick={() => fetchClaims(currentPage, filterStatus)} className="mt-2">Try Again</Button>
            </div>
          )}

          {!isLoading && !error && claims.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No claims found{filterStatus !== SPECIAL_ALL_STATUSES_VALUE ? ` with status ${filterStatus}` : ''}.</p>
            </div>
          )}

          {!isLoading && !error && claims.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Claimant</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Listing</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Requested</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {claims.map((claim) => (
                    <tr key={claim.claim_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{claim.claimant_name}</div>
                        <div className="text-sm text-muted-foreground">{claim.claimant_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/listing/${claim.listingBusiness.slug}`} legacyBehavior>
                          <a className="text-sm text-primary hover:underline" target="_blank">{claim.listingBusiness.title}</a>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${claim.status === ClaimStatus.PENDING ? 'bg-yellow-100 text-yellow-800' : claim.status === ClaimStatus.APPROVED ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {claim.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(claim.requested_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {claim.status === ClaimStatus.PENDING && (
                          <>
                            <Button variant="default" size="sm" onClick={() => handleUpdateClaimStatus(claim.claim_id, ClaimStatus.APPROVED)} disabled={isLoading}>Approve</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleUpdateClaimStatus(claim.claim_id, ClaimStatus.REJECTED)} disabled={isLoading}>Reject</Button>
                          </>
                        )}
                        {/* Add a view details button/modal here if needed */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-2">
              <Button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                disabled={currentPage === 1 || isLoading}
                variant="outline"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                disabled={currentPage === totalPages || isLoading}
                variant="outline"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

AdminOwnershipClaimsPage.getInitialProps = async () => {
  return {
    pageTitle: 'Ownership Claims',
    pageDescription: 'Review and manage business ownership claims.',
    pageIconName: 'ShieldCheck', 
  };
};

export default withAdminAuth(AdminOwnershipClaimsPage); 
