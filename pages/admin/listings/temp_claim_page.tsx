import { NextPage, GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useSession, getSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import prisma from '@/lib/prisma';

interface ClaimPageProps {
  listingId: string;
  listingTitle?: string;
  listingSlug?: string; // Added for back link
  error?: string;
}

const ClaimPage: NextPage<ClaimPageProps> = ({ listingId, listingTitle, listingSlug, error }) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    claimant_name: '',
    company_name: '',
    claimant_email: '',
    claimant_phone: '',
    message: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setFormData(prev => ({
        ...prev,
        claimant_name: session.user.name || '',
        claimant_email: session.user.email || '',
      }));
    }
  }, [session, status]);

  if (status === 'loading') {
    return <div className="container mx-auto p-4 text-center">Loading session...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto p-4 text-center">
        <Head><title>Login Required</title></Head>
        <h1 className="text-2xl font-bold mb-4">Login Required</h1>
        <p className="mb-4">You must be logged in to submit an ownership claim.</p>
        <button 
          onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          Log In
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Head><title>Error</title></Head>
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p>{error}</p>
        <Link href="/" legacyBehavior><a className="text-blue-500 hover:text-blue-700 mt-4 inline-block">Go to Homepage</a></Link>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    setFormSuccess(null);

    if (!formData.claimant_name || !formData.claimant_email || !formData.message) {
      setFormError('Please fill in your name, email, and message.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/claims/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, listing_business_id: listingId }),
      });

      const result = await response.json();

      if (!response.ok) {
        setFormError(result.message || 'An unknown error occurred.');
      } else {
        setFormSuccess(result.message || 'Claim submitted successfully!');
        setFormData({
            claimant_name: session?.user?.name || '',
            company_name: '',
            claimant_email: session?.user?.email || '',
            claimant_phone: '',
            message: '',
        });
      }
    } catch (err: any) {
      setFormError('Failed to submit the form. Please try again later.');
      console.error(err);
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Head>
        <title>Claim Ownership{listingTitle ? ` of ${listingTitle}` : ''}</title>
      </Head>
      <h1 className="text-3xl font-bold mb-6 text-center">
        Claim Ownership {listingTitle ? <span className='block text-xl font-normal text-gray-600'>for "{listingTitle}"</span> : ''}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 shadow-lg rounded-lg">
        <div>
          <label htmlFor="claimant_name" className="block text-sm font-medium text-gray-700">Your Name</label>
          <input
            type="text"
            name="claimant_name"
            id="claimant_name"
            value={formData.claimant_name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">Company Name (Optional)</label>
          <input
            type="text"
            name="company_name"
            id="company_name"
            value={formData.company_name}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="claimant_email" className="block text-sm font-medium text-gray-700">Your Email</label>
          <input
            type="email"
            name="claimant_email"
            id="claimant_email"
            value={formData.claimant_email}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="claimant_phone" className="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
          <input
            type="tel"
            name="claimant_phone"
            id="claimant_phone"
            value={formData.claimant_phone}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
          <textarea
            name="message"
            id="message"
            rows={4}
            value={formData.message}
            onChange={handleChange}
            required
            placeholder="Please provide details about your claim to this business listing. Include any information that can help us verify your ownership or management role."
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}
        {formSuccess && <p className="text-sm text-green-600">{formSuccess}</p>}

        <div>
          <button
            type="submit"
            disabled={isLoading || !!formSuccess} // Disable if loading or already successfully submitted
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {isLoading ? 'Submitting...' : 'Submit Claim'}
          </button>
        </div>
      </form>
      
      {listingSlug && (
        <div className="mt-6 text-center">
          <Link href={`/listings/${listingSlug}`} legacyBehavior>
            <a className='text-sm text-blue-600 hover:underline'>Back to "{listingTitle}"</a>
          </Link>
        </div>
      )}

    </div>
  );
};

export const getServerSideProps: GetServerSideProps<ClaimPageProps> = async (context) => {
  const session = await getSession(context);
  const { listing_id } = context.params || {}; // Changed from listingId to listing_id to match filename

  if (!listing_id || typeof listing_id !== 'string') {
    return { props: { listingId: '', error: 'Listing ID not provided or invalid.' } };
  }

  // Fetch listing title and slug for display purposes
  try {
    const listing = await prisma.listingBusiness.findUnique({
      where: { listing_business_id: parseInt(listing_id, 10) },
      select: { title: true, slug: true }, // Also fetch slug for back link
    });

    if (!listing) {
      return { props: { listingId: listing_id, error: 'Listing not found.' } };
    }

    return {
      props: {
        listingId: listing_id,
        listingTitle: listing.title,
        listingSlug: listing.slug, // Pass slug for 'back to listing' link
      },
    };
  } catch (e) {
    console.error('Error fetching listing details for claim page:', e);
    return { props: { listingId: listing_id, error: 'Could not load listing details.' } };
  }
};

export default ClaimPage;
