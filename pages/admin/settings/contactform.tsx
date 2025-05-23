import { useEffect, useState, FormEvent } from 'react';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminHeader, AdminHeaderProvider } from '@/components/AdminHeaderContext';
import type { NextPageWithLayout } from '@/pages/_app';
import { Mail, Settings, FileText } from 'lucide-react'; // Icons

interface ContactFormSettings {
  admin_email: string;
  contact_form_title: string;
  contact_form_details: string;
}

const ContactFormSettingsPageContent = () => {
  const { setPageSpecificHeaderElements } = useAdminHeader();
  const [settings, setSettings] = useState<Partial<ContactFormSettings>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setPageSpecificHeaderElements({
      title: 'Contact Form Settings',
      icon: <FileText />,
      description: 'Configure the public contact form and where submissions are sent.',
    });

    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/settings/contact-form-config');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch settings');
        }
        const data = await response.json();
        setSettings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [setPageSpecificHeaderElements]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch('/api/admin/settings/contact-form-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        credentials: 'include', // Explicitly include credentials (cookies)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update settings');
      }
      const result = await response.json();
      setSuccessMessage(result.message || 'Settings updated successfully!');
      if (result.settings) {
        setSettings(result.settings);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccessMessage(null), 5000); // Clear success message after 5s
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  if (isLoading && !Object.keys(settings).length) {
    return <div className="p-6">Loading settings...</div>;
  }

  return (
    <>
      <Head>
        <title>Contact Form Settings - Admin</title>
      </Head>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" /> Contact Submission Email
          </CardTitle>
          <CardDescription>
            This email address will receive a copy of all messages submitted through the public contact form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="admin_email">Admin Email Address</Label>
              <Input 
                id="admin_email" 
                name="admin_email"
                type="email" 
                value={settings.admin_email || ''} 
                onChange={handleChange} 
                placeholder="e.g., admin@example.com"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_form_title">Contact Page Title</Label>
              <Input 
                id="contact_form_title" 
                name="contact_form_title"
                type="text" 
                value={settings.contact_form_title || ''} 
                onChange={handleChange} 
                placeholder="e.g., Get In Touch"
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                This title will be displayed on the public contact us page.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_form_details">Contact Page Introduction/Details</Label>
              <Textarea 
                id="contact_form_details" 
                name="contact_form_details"
                value={settings.contact_form_details || ''} 
                onChange={handleChange} 
                placeholder="e.g., We'd love to hear from you! Fill out the form below..."
                rows={4}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                This text will appear above the contact form on the public page.
              </p>
            </div>

            {error && <p className="text-sm text-red-600">Error: {error}</p>}
            {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

const ContactFormSettingsAdminPage: NextPageWithLayout = () => {
  return <ContactFormSettingsPageContent />;
};

ContactFormSettingsAdminPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <AdminHeaderProvider initialBaseElements={{
      title: 'Contact Form Settings',
      icon: <Settings />,
      description: 'Manage contact form configurations.'
    }}>
      <AdminLayout pageTitle="Contact Form Settings">
        {page}
      </AdminLayout>
    </AdminHeaderProvider>
  );
};

export default ContactFormSettingsAdminPage;
