import React, { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Prisma } from '@prisma/client'; // Import Prisma types
import { GetServerSideProps, NextPage } from 'next'; // Added NextPage and GetServerSideProps
import { getSession } from 'next-auth/react'; // Added for session check
import { UserRole } from '@prisma/client'; // Added for UserRole enum

// Define the type for a Prompt, including what you expect from the API
type PromptWithId = Prisma.PromptGetPayload<{}>

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    const error = new Error('Failed to fetch prompts');
    // @ts-ignore // Attach extra info to the error object
    error.info = res.json();
    // @ts-ignore
    error.status = res.status;
    throw error;
  }
  return res.json();
});

interface PromptVaultPageProps {
  // No specific page props needed from getServerSideProps for initial data, SWR handles it
  // pageTitle will be implicitly passed by _app.tsx if returned from getServerSideProps
}

const PromptVaultPage: NextPage<PromptVaultPageProps> = () => {
  const { data: prompts, error, mutate } = useSWR<PromptWithId[]>('/api/admin/promptvault', fetcher);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const handleDelete = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/promptvault/${promptId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete prompt');
      }
      setFeedbackMessage('Prompt deleted successfully.');
      mutate(); // Re-fetch the prompt list
    } catch (err: any) {
      setFeedbackMessage(err.message || 'An error occurred while deleting.');
      console.error(err);
    }
  };

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-red-500">Failed to load prompts: {error.message}</div>;
  }
  if (!prompts) {
    return <div className="container mx-auto px-4 py-8">Loading prompts...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div /> {/* Placeholder to keep Add button to the right if title is removed/handled by layout */}
        <Link href="/admin/promptvault/new" legacyBehavior>
          <a className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out">
            + Add New Prompt
          </a>
        </Link>
      </div>

      {feedbackMessage && (
        <div className={`mb-4 p-3 rounded ${feedbackMessage.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {feedbackMessage}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Name</th>
              <th className="py-3 px-6 text-left">Slug</th>
              <th className="py-3 px-6 text-left">Version</th>
              <th className="py-3 px-6 text-center">Status</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {prompts.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6">
                  No prompts found. <Link href="/admin/promptvault/new" className="text-blue-500 hover:underline">Add one now!</Link>
                </td>
              </tr>
            ) : (
              prompts.map((prompt) => (
                <tr key={prompt.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 text-left whitespace-nowrap">{prompt.name}</td>
                  <td className="py-3 px-6 text-left">{prompt.slug}</td>
                  <td className="py-3 px-6 text-left">{prompt.version}</td>
                  <td className="py-3 px-6 text-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${prompt.status === 'ACTIVE' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                      {prompt.status}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <Link href={`/admin/promptvault/edit/${prompt.slug}`} legacyBehavior>
                      <a className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-1 px-3 rounded text-xs mr-2 transition duration-150 ease-in-out">Edit</a>
                    </Link>
                    <button 
                      onClick={() => handleDelete(prompt.id)} 
                      className="bg-red-500 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded text-xs transition duration-150 ease-in-out"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  const pageTitle = "Prompt Vault";

  // @ts-ignore session.user.role is custom
  if (!session || session.user?.role !== UserRole.ADMIN) {
    return {
      redirect: {
        destination: '/login?error=NotAuthorizedAdmin',
        permanent: false,
      },
    };
  }

  return {
    props: {
      pageTitle, // This will be available in _app.tsx
    },
  };
};

export default PromptVaultPage;
