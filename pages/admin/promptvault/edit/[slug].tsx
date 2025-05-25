import React, { useState, useEffect, FormEvent } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { PromptTemplate } from '@prisma/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { toast } from 'react-toastify';

const EditPromptPage: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { slug } = router.query;

  const [prompt, setPrompt] = useState<PromptTemplate | null>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrompt = async () => {
      if (!slug || typeof slug !== 'string') {
        setIsLoading(false);
        setError('Slug is missing or invalid.');
        toast.error('Slug is missing or invalid.');
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/promptvault/${slug}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Failed to fetch prompt: ${res.statusText}`);
        }
        const data: PromptTemplate = await res.json();
        setPrompt(data);
        setContent(data.content || ''); // Use content field
        setError(null);
      } catch (err) {
        console.error('Error fetching prompt:', err);
        setError((err as Error).message);
        toast.error(`Error fetching prompt: ${(err as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (session && slug) {
      fetchPrompt();
    }
  }, [session, slug]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/promptvault/${prompt.slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }), // Send content field
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update prompt');
      }

      toast.success('Prompt updated successfully!');
      // Optionally, redirect or update local state
      // router.push('/admin/promptvault'); 
    } catch (err) {
      console.error('Error updating prompt:', err);
      toast.error(`Error updating prompt: ${(err as Error).message}`);
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || (isLoading && !prompt)) {
    return <p>Loading prompt data...</p>;
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return <p>Access Denied. You must be an admin.</p>;
  }

  if (error && !prompt) {
    return <p>Error: {error}</p>;
  }
  
  if (!prompt) {
     return <p>Prompt not found or you do not have permission to edit it.</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Edit Prompt: <span className='text-blue-600'>{prompt.name}</span></h1>
      <p className='text-sm text-gray-500 mb-6'>Slug: {prompt.slug} (Name and Slug are not editable)</p>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">Error: {error}</p>}

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-8">
        <div className="mb-6">
          <label htmlFor="promptContent" className="block text-gray-700 text-sm font-bold mb-2">
            Prompt Content:
          </label>
          <textarea
            id="promptContent"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={15}
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
            placeholder="Enter the prompt content here..."
            required
          />
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

(EditPromptPage as any).getLayout = function getLayout(page: React.ReactElement, pageProps: any) {
  const title = "Edit Prompt"; 
  return (
    <AdminLayout pageTitle={title}>
      {page}
    </AdminLayout>
  );
};

export default EditPromptPage;
