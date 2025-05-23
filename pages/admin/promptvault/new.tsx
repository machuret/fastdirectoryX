import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { PromptStatus } from '@prisma/client'; // Import Enum
import { GetServerSideProps, NextPage } from 'next'; // Added NextPage and GetServerSideProps
import { getSession } from 'next-auth/react'; // Added for session check
import { UserRole } from '@prisma/client'; // Added for UserRole enum

interface NewPromptPageProps {
  // pageTitle will be implicitly passed by _app.tsx if returned from getServerSideProps
}

const NewPromptPage: NextPage<NewPromptPageProps> = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [promptText, setPromptText] = useState('');
  const [version, setVersion] = useState('1');
  const [status, setStatus] = useState<PromptStatus>(PromptStatus.ACTIVE);
  const [placeholders, setPlaceholders] = useState(''); // Comma-separated string
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    if (!name.trim() || !slug.trim() || !promptText.trim()) {
      setError('Name, Slug, and Prompt Text are required.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/promptvault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description,
          promptText,
          version: parseInt(version, 10),
          status,
          placeholders: placeholders ? placeholders.split(',').map(p => p.trim()).filter(p => p) : [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create prompt');
      }

      setSuccessMessage(`Prompt "${data.name}" created successfully!`);
      // Optionally redirect or clear form
      // router.push('/admin/promptvault'); 
      setName('');
      setSlug('');
      setDescription('');
      setPromptText('');
      setVersion('1');
      setStatus(PromptStatus.ACTIVE);
      setPlaceholders('');

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* The h1 title will be set by AdminHeaderProvider via _app.tsx and pageProps.pageTitle */}
      {/* <h1 className="text-3xl font-bold text-gray-800 mb-6">Add New Prompt</h1> */}
      
      {error && <div className="mb-4 p-3 rounded bg-red-100 text-red-700">{error}</div>}
      {successMessage && <div className="mb-4 p-3 rounded bg-green-100 text-green-700">{successMessage}</div>}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 font-bold mb-2">Name*</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div>

        <div className="mb-4">
          <label htmlFor="slug" className="block text-gray-700 font-bold mb-2">Slug* (Unique Identifier)</label>
          <input type="text" id="slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          <p className="text-xs text-gray-500 mt-1">E.g., faq-generation-default. Will be auto-kebab-cased.</p>
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-gray-700 font-bold mb-2">Description</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
        </div>

        <div className="mb-4">
          <label htmlFor="promptText" className="block text-gray-700 font-bold mb-2">Prompt Text*</label>
          <textarea id="promptText" value={promptText} onChange={(e) => setPromptText(e.target.value)} rows={10} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
          <p className="text-xs text-gray-500 mt-1">The actual prompt template. Use placeholders like {'{variable_name}'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="version" className="block text-gray-700 font-bold mb-2">Version</label>
            <input type="number" id="version" value={version} onChange={(e) => setVersion(e.target.value)} min="1" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="status" className="block text-gray-700 font-bold mb-2">Status</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value as PromptStatus)} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
              {Object.values(PromptStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="placeholders" className="block text-gray-700 font-bold mb-2">Placeholders (comma-separated)</label>
            <input type="text" id="placeholders" value={placeholders} onChange={(e) => setPlaceholders(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            <p className="text-xs text-gray-500 mt-1">E.g., business_name, location, service_list</p>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button type="button" onClick={() => router.push('/admin/promptvault')} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded mr-2 transition duration-150 ease-in-out">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out disabled:opacity-50">
            {isLoading ? 'Creating...' : 'Create Prompt'}
          </button>
        </div>
      </form>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  const pageTitle = "Add New Prompt";

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

export default NewPromptPage;
