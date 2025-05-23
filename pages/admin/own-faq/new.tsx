import React, { useState, useEffect } from 'react';
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
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { NextPageWithLayout, MyAppPageProps } from '@/pages/_app';

const NewOwnFaqPageContent: React.FC = () => {
  const { setPageSpecificHeaderElements } = useAdminHeader();
  const router = useRouter();

  useEffect(() => {
    setPageSpecificHeaderElements({
      title: 'Add New Website FAQ',
      icon: <PlusCircle />,
      description: 'Create a new Frequently Asked Question for your website.',
      actionButtons: (
        <Link href="/admin/own-faq" passHref legacyBehavior>
          <Button variant="outline" asChild>
            <a><ArrowLeft className="mr-2 h-4 w-4" /> Back to FAQ List</a>
          </Button>
        </Link>
      ),
    });
  }, []);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('');
  const [order, setOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const response = await fetch('/api/admin/own-faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question,
          answer,
          category: category.trim() || null,
          order: Number(order),
          isPublished 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Failed to create FAQ');
      }

      toast.success('FAQ created successfully!');
      router.push('/admin/own-faq'); // Redirect to the list page
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(`Error creating FAQ: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        {/* CardTitle and CardDescription are handled by AdminHeaderProvider */}
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
            <Input 
              id="question" 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)} 
              placeholder="e.g., How do I reset my password?"
              required 
            />
          </div>
          <div>
            <Label htmlFor="answer">Answer <span className="text-red-500">*</span></Label>
            <Textarea 
              id="answer" 
              value={answer} 
              onChange={(e) => setAnswer(e.target.value)} 
              placeholder="Provide a clear and concise answer..."
              rows={6}
              required 
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input 
              id="category" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              placeholder="e.g., Account Management (optional)"
            />
          </div>
          <div>
            <Label htmlFor="order">Display Order</Label>
            <Input 
              id="order" 
              type="number" 
              value={order} 
              onChange={(e) => setOrder(Number(e.target.value))} 
            />
            <p className="text-sm text-muted-foreground mt-1">Lower numbers appear first.</p>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isPublished" 
              checked={isPublished} 
              onCheckedChange={(checked) => setIsPublished(checked === true)} 
            />
            <Label htmlFor="isPublished" className="font-normal">
              Publish this FAQ immediately
            </Label>
          </div>
          <div className="flex justify-end space-x-3">
            <Link href="/admin/own-faq" passHref legacyBehavior>
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create FAQ'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const NewOwnFaqAdminPage: NextPageWithLayout<MyAppPageProps> = (props) => {
  return (
    <>
      <Head>
        <title>Add New Website FAQ - Admin</title>
      </Head>
      <NewOwnFaqPageContent />
    </>
  );
};

NewOwnFaqAdminPage.getLayout = function getLayout(page: React.ReactElement, pageProps: MyAppPageProps) {
  const initialHeaderElements: HeaderElements = {
    title: pageProps.pageTitle || 'Add New Website FAQ',
    description: pageProps.pageDescription || 'Create a new Frequently Asked Question for your website.',
    icon: pageProps.pageIcon || <PlusCircle />,
  };
  return (
    <AdminHeaderProvider initialBaseElements={initialHeaderElements}>
      <AdminLayout pageTitle={initialHeaderElements.title!}>
        {page}
      </AdminLayout>
    </AdminHeaderProvider>
  );
};

export default NewOwnFaqAdminPage;
