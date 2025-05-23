import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import withAdminAuth from '@/hoc/withAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminHeader, AdminHeaderProvider } from '@/components/AdminHeaderContext';
import { ImageIcon as ImageIconLucide } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { NextPageWithLayout, MyAppPageProps } from '@/pages/_app';

// Placeholder type for logo data - this will evolve
interface SiteLogoData {
  id?: string; // or number
  purpose: string;
  imageUrl: string;
  altText?: string;
  targetUrl?: string;
}

const AdminLogoManagementPageContent: React.FC = () => {
  const { setPageSpecificHeaderElements } = useAdminHeader();
  const [logos, setLogos] = useState<SiteLogoData[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Example: State for a single logo upload form
  const [currentLogoFile, setCurrentLogoFile] = useState<File | null>(null);
  const [currentLogoPurpose, setCurrentLogoPurpose] = useState('main_header_logo');
  const [currentLogoAlt, setCurrentLogoAlt] = useState('');
  const [currentLogoLink, setCurrentLogoLink] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setPageSpecificHeaderElements({
      title: 'Site Logo Management',
      icon: <ImageIconLucide />,
      description: 'Manage site logos and favicons.',
    });
  }, [setPageSpecificHeaderElements]);

  // TODO: Fetch existing logos
  useEffect(() => {
    const fetchLogos = async () => {
      setIsLoading(true);
      try {
        // const response = await fetch('/api/admin/logos');
        // if (!response.ok) throw new Error('Failed to fetch logos');
        // const data = await response.json();
        // setLogos(data);
        setLogos([]); // Placeholder
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogos();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setCurrentLogoFile(event.target.files[0]);
    }
  };

  const handleSubmitLogo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentLogoFile) {
      alert('Please select a logo file to upload.');
      return;
    }
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('logoFile', currentLogoFile);
    formData.append('purpose', currentLogoPurpose);
    formData.append('altText', currentLogoAlt);
    formData.append('targetUrl', currentLogoLink);

    try {
      // This will first go to our specific /api/admin/logos endpoint
      // which will then internally call a generic /api/upload endpoint
      const response = await fetch('/api/admin/logos', {
        method: 'POST',
        body: formData,
        // Headers are not set to 'application/json' when sending FormData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to upload logo.');
      }

      // const newLogo = await response.json();
      // TODO: Refresh logos list or update state
      alert('Logo uploaded successfully! (Placeholder)');
      setCurrentLogoFile(null);
      // Optionally clear other form fields
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <p>Loading logo settings...</p>;
  // if (error) return <p className="text-red-500">Error: {error}</p>; // Display error more gracefully

  return (
    <>
      <Head>
        <title>Site Logo Management - Admin</title>
      </Head>
      <div className="space-y-6">
        <form onSubmit={handleSubmitLogo} className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Upload New Logo</h2>
          {error && <p className="text-red-500">Error: {error}</p>} 
          <div>
            <Label htmlFor="logoPurpose">Logo Purpose (e.g., main_header_logo)</Label>
            <Input 
              id="logoPurpose" 
              type="text" 
              value={currentLogoPurpose} 
              onChange={(e) => setCurrentLogoPurpose(e.target.value)} 
              required 
            />
          </div>
          <div>
            <Label htmlFor="logoFile">Logo Image</Label>
            <Input id="logoFile" type="file" onChange={handleFileChange} accept="image/png, image/jpeg, image/svg+xml, image/gif" required />
          </div>
          <div>
            <Label htmlFor="logoAlt">Alt Text (for accessibility)</Label>
            <Input id="logoAlt" type="text" value={currentLogoAlt} onChange={(e) => setCurrentLogoAlt(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="logoLink">Target URL (if logo is a link)</Label>
            <Input id="logoLink" type="url" value={currentLogoLink} onChange={(e) => setCurrentLogoLink(e.target.value)} placeholder="https://example.com" />
          </div>
          <Button type="submit" disabled={isUploading || !currentLogoFile}>
            {isUploading ? 'Uploading...' : 'Upload Logo'}
          </Button>
        </form>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold">Current Logos</h2>
          {logos.length === 0 && !isLoading && (
            <p>No logos configured yet.</p>
          )}
          {/* TODO: Display current logos here */}
        </div>
      </div>
    </>
  );
};

const AuthenticatedLogoPageContent = withAdminAuth(AdminLogoManagementPageContent);

const SiteLogosPage: NextPageWithLayout<MyAppPageProps> = (props) => {
  return <AuthenticatedLogoPageContent {...props} />;
};

SiteLogosPage.getLayout = function getLayout(page: React.ReactElement, pageProps: MyAppPageProps) {
  const initialBaseElements = {
    title: pageProps.pageTitle || 'Site Logo Management',
    description: pageProps.pageDescription || 'Manage site logos and favicons.',
    icon: pageProps.pageIconName ? <ImageIconLucide /> : <ImageIconLucide />,
    actionButtons: pageProps.actionButtons,
  };

  return (
    <AdminHeaderProvider initialBaseElements={initialBaseElements}>
      <AdminLayout
        pageTitle={initialBaseElements.title}
      >
        {page}
      </AdminLayout>
    </AdminHeaderProvider>
  );
};

export default SiteLogosPage;
