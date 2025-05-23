import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminHeaderProvider, useAdminHeader, HeaderElements } from '@/components/AdminHeaderContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Edit, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { NextPageWithLayout, MyAppPageProps } from '@/pages/_app';

interface ClientOwnFAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

const EditOwnFaqPageContent: React.FC<{ faqId: string }> = ({ faqId }) => {
  const { setPageSpecificHeaderElements } = useAdminHeader();
  const router = useRouter();

  useEffect(() => {
    setPageSpecificHeaderElements({
      title: 'Edit Website FAQ',
      icon: <Edit />,
      description: 'Modify an existing Frequently Asked Question for your website.',
      actionButtons: (
        <Link href="/admin/own-faq" passHref legacyBehavior>
          <Button variant="outline" asChild>
            <a><ArrowLeft className="mr-2 h-4 w-4" /> Back to FAQ List</a>
          </Button>
        </Link>
      ),
    });
  }, [setPageSpecificHeaderElements]);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [order, setOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  
  const [isLoadingFaq, setIsLoadingFaq] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFaqDetails = useCallback(async (id: string) => {
    setIsLoadingFaq(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/own-faq/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Failed to fetch FAQ details');
      }
      const data: ClientOwnFAQ = await response.json();
      setQuestion(data.question);
      setAnswer(data.answer);
      setCategory(data.category);
      setOrder(data.order);
      setIsPublished(data.isPublished);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(`Error fetching FAQ: ${errorMessage}`);
    } finally {
      setIsLoadingFaq(false);
    }
  }, []);

  useEffect(() => {
    if (faqId) {
      fetchFaqDetails(faqId);
    }
  }, [faqId, fetchFaqDetails]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!question.trim() || !answer.trim()) {
      setError('Question and Answer fields are required.');
      setIsSubmitting(false);
      toast.error('Question and Answer fields are required.');
      return;
    }

    try {
      const response = await fetch(`/api/admin/own-faq/${faqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          answer,
          category: category ? category.trim() : null,
          order: Number(order),
          isPublished,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Failed to update FAQ');
      }
      toast.success('FAQ updated successfully!');
      router.push('/admin/own-faq');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(`Error updating FAQ: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingFaq) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mr-2 text-primary" />
        Loading FAQ details...
      </div>
    );
  }

  if (error && !question) { // Show full error if FAQ couldn't be loaded at all
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-6 w-6 mr-2" /> Error Loading FAQ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Link href="/admin/own-faq" passHref legacyBehavior>
            <Button variant="outline" asChild className="mt-4">
              <a><ArrowLeft className="mr-2 h-4 w-4" /> Back to FAQ List</a>
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        {/* Title and description handled by AdminHeaderProvider */}
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 border border-red-300">
            <p>{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="question">Question <span className="text-red-500">*</span></Label>
            <Input id="question" value={question} onChange={(e) => setQuestion(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="answer">Answer <span className="text-red-500">*</span></Label>
            <Textarea id="answer" value={answer} onChange={(e) => setAnswer(e.target.value)} rows={6} required />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={category || ''} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="order">Display Order</Label>
            <Input id="order" type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
            <p className="text-sm text-muted-foreground mt-1">Lower numbers appear first.</p>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="isPublished" checked={isPublished} onCheckedChange={(checked) => setIsPublished(checked === true)} />
            <Label htmlFor="isPublished" className="font-normal">Publish this FAQ</Label>
          </div>
          <div className="flex justify-end space-x-3">
            <Link href="/admin/own-faq" passHref legacyBehavior>
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting || isLoadingFaq}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const EditOwnFaqAdminPage: NextPageWithLayout<MyAppPageProps & { faqId: string }> = ({ faqId }) => {
  return (
    <>
      <Head>
        <title>Edit Website FAQ - Admin</title>
      </Head>
      {faqId ? <EditOwnFaqPageContent faqId={faqId} /> : <p>FAQ ID not found.</p>}
    </>
  );
};

export async function getServerSideProps(context: any) {
  const { id } = context.params;
  // Ensure id is a string, handle cases where it might be an array or undefined if necessary
  const faqId = Array.isArray(id) ? id[0] : id;
  if (!faqId) {
    return { notFound: true }; // Or handle as an error, redirect, etc.
  }
  return {
    props: {
      faqId: faqId,
    },
  };
}

EditOwnFaqAdminPage.getLayout = function getLayout(page: React.ReactElement, pageProps: MyAppPageProps) {
  const initialHeaderElements: HeaderElements = {
    title: pageProps.pageTitle || 'Edit Website FAQ',
    description: pageProps.pageDescription || 'Modify an existing Frequently Asked Question.',
    icon: pageProps.pageIcon || <Edit />,
  };
  return (
    <AdminHeaderProvider initialBaseElements={initialHeaderElements}>
      <AdminLayout pageTitle={initialHeaderElements.title!}>
        {page}
      </AdminLayout>
    </AdminHeaderProvider>
  );
};

export default EditOwnFaqAdminPage;
