// /pages/admin/photo-importer.tsx

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import withAdminAuth from '@/hoc/withAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminHeader } from '@/components/AdminHeaderContext';
import { Image as ImageIconLucide } from 'lucide-react'; // Using Image icon as a placeholder
import type { NextPageWithLayout, MyAppPageProps } from '@/pages/_app'; // Added for getLayout
import { iconMap } from '@/components/admin/iconMap'; // Added for getLayout
import type { LucideIcon } from 'lucide-react'; // Added for getLayout typing

interface ImportResult {
  sourceUrl: string;
  newUrl?: string;
  photoId?: string;
  status: 'success' | 'failed';
  error?: string;
}

function PhotoImporterPage() {
  const { setPageSpecificHeaderElements } = useAdminHeader();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<ImportResult[]>([]);
  const [queries, setQueries] = useState<string>(''); // For comma-separated queries
  const [maxResults, setMaxResults] = useState<number>(10);
  const [businessId, setBusinessId] = useState<string>(''); // Input as string, convert to number later

  useEffect(() => {
    setPageSpecificHeaderElements({
      title: 'Photo Importer',
      icon: <ImageIconLucide />,
      description: 'Import photos from external sources to Azure Blob Storage.',
    });
  }, [setPageSpecificHeaderElements]);

  const handleImportPhotos = async () => {
    setIsLoading(true);
    setMessage('');
    setResults([]);

    const queryArray = queries.split(',').map(q => q.trim()).filter(q => q.length > 0);
    if (queryArray.length === 0) {
      setMessage('Please enter at least one search query.');
      setIsLoading(false);
      return;
    }

    const parsedBusinessId = businessId ? parseInt(businessId, 10) : undefined;
    if (businessId && (parsedBusinessId === undefined || isNaN(parsedBusinessId))) {
      setMessage('Invalid Business ID. Must be a number.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/import-photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queries: queryArray,
          maxResultsPerQuery: maxResults,
          businessId: parsedBusinessId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setMessage(data.message || 'Import process initiated.');
      if (data.results) {
        setResults(data.results);
      }
    } catch (error: any) {
      console.error('Failed to import photos:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Photo Importer</title>
      </Head>
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Admin Photo Importer</h1>
        <p>
          This tool will fetch images from the configured Apify source,
          download them, upload them to Azure Blob Storage, and update the database.
        </p>

        <div style={{ marginBottom: '20px' }}>
          <div>
            <label htmlFor="queries" style={{ display: 'block', marginBottom: '5px' }}>Search Queries (comma-separated):</label>
            <input 
              type="text" 
              id="queries" 
              value={queries} 
              onChange={(e) => setQueries(e.target.value)} 
              placeholder="e.g., modern office, city skyline"
              style={{ width: '300px', padding: '8px', marginBottom: '10px' }}
            />
          </div>
          <div>
            <label htmlFor="maxResults" style={{ display: 'block', marginBottom: '5px' }}>Max Results Per Query:</label>
            <input 
              type="number" 
              id="maxResults" 
              value={maxResults} 
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) {
                  setMaxResults(val);
                } else if (e.target.value === '') { // Allow clearing the input, default to 1 or handle as error
                  setMaxResults(1); // Or some other default / show error
                } else {
                  setMaxResults(1); // Default to 1 if invalid input
                }
              }} 
              min="1"
              style={{ width: '100px', padding: '8px', marginBottom: '10px' }}
            />
          </div>
          <div>
            <label htmlFor="businessId" style={{ display: 'block', marginBottom: '5px' }}>Business ID (Optional):</label>
            <input 
              type="text" // Using text to allow empty string, will parse to number
              id="businessId" 
              value={businessId} 
              onChange={(e) => setBusinessId(e.target.value)} 
              placeholder="e.g., 123"
              style={{ width: '100px', padding: '8px', marginBottom: '20px' }}
            />
          </div>
        </div>

        <button onClick={handleImportPhotos} disabled={isLoading} style={{ padding: '10px 15px', fontSize: '16px' }}>
          {isLoading ? 'Importing...' : 'Start Photo Import'}
        </button>

        {message && <p style={{ marginTop: '20px', fontWeight: 'bold' }}>{message}</p>}

        {results.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h2>Import Details:</h2>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {results.map((result, index) => (
                <li key={index} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
                  <strong>Source URL:</strong> {result.sourceUrl} <br />
                  <strong>Status:</strong> <span style={{ color: result.status === 'success' ? 'green' : 'red' }}>{result.status}</span> <br />
                  {result.status === 'success' && result.newUrl && (
                    <><strong>New Azure URL:</strong> <a href={result.newUrl} target="_blank" rel="noopener noreferrer">{result.newUrl}</a> (ID: {result.photoId})<br /></>
                  )}
                  {result.status === 'failed' && result.error && (
                    <><strong>Error:</strong> {result.error}<br /></>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}

// Apply Admin Layout and Authentication
const AuthedPhotoImporterPage = withAdminAuth(PhotoImporterPage);

(AuthedPhotoImporterPage as NextPageWithLayout).getLayout = function getLayout(page: React.ReactElement, pageProps: MyAppPageProps) {
  const defaultPageTitle = "Photo Importer";
  const DefaultPageIconComponent: LucideIcon = ImageIconLucide; // Using imported ImageIconLucide

  const titleForLayout = pageProps?.pageTitle || defaultPageTitle;
  
  let iconComponentForLayout: React.ElementType = DefaultPageIconComponent;
  if (pageProps?.pageIcon) {
    if (typeof pageProps.pageIcon === 'string' && iconMap[pageProps.pageIcon as keyof typeof iconMap]) {
      iconComponentForLayout = iconMap[pageProps.pageIcon as keyof typeof iconMap];
    } else if (typeof pageProps.pageIcon !== 'string') { // It's already an ElementType
      iconComponentForLayout = pageProps.pageIcon;
    } // If it's a string but not in iconMap, it defaults to DefaultPageIconComponent
  }

  const descriptionForLayout = pageProps?.pageDescription || "Import photos from URLs to Azure Blob Storage.";
  const actionButtonsForLayout = pageProps?.actionButtons;

  return (
    <AdminLayout
      pageTitle={titleForLayout}
      pageIcon={iconComponentForLayout}
      pageDescription={descriptionForLayout}
      actionButtons={actionButtonsForLayout}
    >
      {page}
    </AdminLayout>
  );
};

export default AuthedPhotoImporterPage;
