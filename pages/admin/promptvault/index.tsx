import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Prisma, PromptTemplate as PromptWithId } from '@prisma/client'; 
import AdminLayout from '@/components/admin/AdminLayout';
import { toast } from 'react-toastify';

const PREDEFINED_PROMPT_SLUGS = ['description', 'guides', 'faq', 'web-faq', 'cities']; 

const PromptVaultPage: NextPage = () => {
  const { data: session, status } = useSession();
  const [prompts, setPrompts] = useState<PromptWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageTitle = "Prompt Vault";

  useEffect(() => {
    const fetchPrompts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/promptvault');
        if (!res.ok) {
          throw new Error(`Failed to fetch prompts: ${res.statusText}`);
        }
        const data: PromptWithId[] = await res.json();
        const filteredPrompts = data.filter(p => PREDEFINED_PROMPT_SLUGS.includes(p.slug));
        setPrompts(filteredPrompts);
        setError(null);
      } catch (err) {
        console.error('Error fetching prompts:', err);
        setError((err as Error).message);
        toast.error(`Error fetching prompts: ${(err as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchPrompts();
    }
  }, [session]);

  if (status === 'loading' || isLoading) {
    return <p>Loading prompts...</p>;
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return <p>Access Denied. You must be an admin to view this page.</p>;
  }

  if (error) {
    return <p>Error loading prompts: {error}</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Prompt Vault</h1>
      </div>

      {prompts.length === 0 ? (
        <p className="text-gray-600">No predefined prompts available. Please check the seed data.</p>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {prompts.map((prompt) => (
                <tr key={prompt.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 border-b border-gray-200 text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{prompt.name}</p>
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{prompt.slug}</p>
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm">
                    <Link href={`/admin/promptvault/edit/${prompt.slug}`} className="text-indigo-600 hover:text-indigo-900 font-medium">
                        Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

(PromptVaultPage as any).getLayout = function getLayout(page: React.ReactElement, pageProps: any) {
  return (
    <AdminLayout pageTitle={pageProps.pageTitle || "Prompt Vault"}>
      {page}
    </AdminLayout>
  );
};

export default PromptVaultPage;
