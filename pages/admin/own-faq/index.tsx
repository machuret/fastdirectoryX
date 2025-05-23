import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminHeaderProvider, useAdminHeader, HeaderElements } from '@/components/AdminHeaderContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Edit3,
  Trash2,
  ListChecks,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner'; // Assuming sonner is used for toasts
import type { NextPageWithLayout, MyAppPageProps } from '@/pages/_app';

// Client-side interface for OwnFAQ
interface ClientOwnFAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  order: number;
  isPublished: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

const OwnFaqAdminPageContent: React.FC = () => {
  const { setPageSpecificHeaderElements } = useAdminHeader();

  useEffect(() => {
    setPageSpecificHeaderElements({
      title: 'Website FAQs',
      icon: <ListChecks />,
      description: 'Manage Frequently Asked Questions for your website.',
      actionButtons: (
        <Link href="/admin/own-faq/new" passHref legacyBehavior>
          <Button asChild>
            <a><Plus className="mr-2 h-4 w-4" /> Add New FAQ</a>
          </Button>
        </Link>
      ),
    });
  }, []);

  const [faqs, setFaqs] = useState<ClientOwnFAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/own-faq');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Failed to fetch FAQs: ${response.statusText}`);
      }
      const data: ClientOwnFAQ[] = await response.json();
      setFaqs(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(`Error fetching FAQs: ${errorMessage}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
        const response = await fetch(`/api/admin/own-faq/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.message || `Failed to delete FAQ: ${response.statusText}`);
        }
        toast.success('FAQ deleted successfully!');
        fetchFaqs(); // Refresh the list
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage); // Show error in UI if needed, or rely on toast
        toast.error(`Error deleting FAQ: ${errorMessage}`);
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mr-2 text-primary" />
        Loading FAQs...
      </div>
    );
  }

  if (error && faqs.length === 0) {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-6 w-6 mr-2" /> Error Loading FAQs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button onClick={fetchFaqs} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        {/* Optional: Add search/filter controls here later */}
        {error && (
            <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 border border-red-300 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                <p>Last operation failed: {error}</p>
            </div>
        )}
      </CardHeader>
      <CardContent>
        {faqs.length === 0 ? (
          <div className="text-center py-12">
            <ListChecks className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium">No FAQs Found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by adding a new FAQ.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Published</TableHead>
                  <TableHead className="text-center">Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell className="font-medium max-w-md truncate" title={faq.question}>{faq.question}</TableCell>
                    <TableCell>{faq.category || '-'}</TableCell>
                    <TableCell className="text-center">
                      {faq.isPublished ? 
                        <CheckCircle2 className="h-5 w-5 text-green-500 inline-block" /> : 
                        <XCircle className="h-5 w-5 text-gray-400 inline-block" />}
                    </TableCell>
                    <TableCell className="text-center">{faq.order}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/admin/own-faq/edit/${faq.id}`} passHref legacyBehavior>
                        <Button variant="outline" size="icon" asChild className="h-8 w-8">
                          <a><Edit3 className="h-4 w-4" /></a>
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(faq.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const OwnFaqAdminPage: NextPageWithLayout<MyAppPageProps> = (props) => {
  return (
    <>
      <Head>
        <title>Manage Website FAQs - Admin</title>
      </Head>
      <OwnFaqAdminPageContent />
    </>
  );
};

OwnFaqAdminPage.getLayout = function getLayout(page: React.ReactElement, pageProps: MyAppPageProps) {
  const initialHeaderElements: HeaderElements = {
    title: pageProps.pageTitle || 'Website FAQs',
    description: pageProps.pageDescription || 'Manage Frequently Asked Questions for your website.',
    icon: pageProps.pageIcon || <ListChecks />,
  };

  return (
    <AdminHeaderProvider initialBaseElements={initialHeaderElements}>
      <AdminLayout pageTitle={initialHeaderElements.title!} /* AdminLayout still needs pageTitle */ >
        {page}
      </AdminLayout>
    </AdminHeaderProvider>
  );
};

export default OwnFaqAdminPage;
