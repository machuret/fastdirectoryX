import React, { useState } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { getSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';

type ApiStatus = 'idle' | 'checking' | 'success' | 'error';

interface StatusDisplayProps {
  serviceName: string;
  status: ApiStatus;
  message?: string;
  onCheck: () => void;
  isLoading: boolean;
}

const StatusIndicator: React.FC<{ status: ApiStatus }> = ({ status }) => {
  switch (status) {
    case 'checking':
      return <span className="text-yellow-500 font-semibold">Checking...</span>;
    case 'success':
      return <span className="text-green-500 font-bold">GOOD</span>;
    case 'error':
      return <span className="text-red-500 font-bold">NOT GOOD</span>;
    default:
      return <span className="text-gray-500">Idle</span>;
  }
};

const ApiCheckCard: React.FC<StatusDisplayProps> = ({ serviceName, status, message, onCheck, isLoading }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">{serviceName} API Status</h2>
        <StatusIndicator status={status} />
      </div>
      {message && (
        <p className={`text-sm mb-4 p-2 rounded ${status === 'success' ? 'bg-green-50 text-green-600' : status === 'error' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'}`}>
          {message}
        </p>
      )}
      <button
        onClick={onCheck}
        disabled={isLoading}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Checking...' : `Check ${serviceName} API`}
      </button>
    </div>
  );
};

interface ApiCheckPageProps {
  // pageTitle will be implicitly passed by _app.tsx if returned from getServerSideProps
}

const ApiCheckPage: NextPage<ApiCheckPageProps> = () => {
  const [openaiStatus, setOpenaiStatus] = useState<ApiStatus>('idle');
  const [openaiMessage, setOpenaiMessage] = useState<string | undefined>('');
  const [isCheckingOpenAI, setIsCheckingOpenAI] = useState(false);

  const [apifyStatus, setApifyStatus] = useState<ApiStatus>('idle');
  const [apifyMessage, setApifyMessage] = useState<string | undefined>('');
  const [isCheckingApify, setIsCheckingApify] = useState(false);

  const handleCheckOpenAI = async () => {
    setIsCheckingOpenAI(true);
    setOpenaiStatus('checking');
    setOpenaiMessage(undefined);
    try {
      const response = await fetch('/api/admin/apicheck/openai');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'OpenAI API check failed');
      }
      setOpenaiStatus('success');
      setOpenaiMessage(data.message || 'OpenAI API is operational.');
    } catch (err: any) {
      setOpenaiStatus('error');
      setOpenaiMessage(err.message || 'An error occurred with OpenAI API.');
    } finally {
      setIsCheckingOpenAI(false);
    }
  };

  const handleCheckApify = async () => {
    setIsCheckingApify(true);
    setApifyStatus('checking');
    setApifyMessage(undefined);
    try {
      const response = await fetch('/api/admin/apicheck/apify');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Apify API check failed');
      }
      setApifyStatus('success');
      setApifyMessage(data.message || 'Apify API is operational.');
    } catch (err: any) {
      setApifyStatus('error');
      setApifyMessage(err.message || 'An error occurred with Apify API.');
    } finally {
      setIsCheckingApify(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* The h1 title will be set by AdminHeaderProvider via _app.tsx and pageProps.pageTitle */}
      <div className="max-w-md mx-auto">
        <ApiCheckCard 
          serviceName="OpenAI"
          status={openaiStatus}
          message={openaiMessage}
          onCheck={handleCheckOpenAI}
          isLoading={isCheckingOpenAI}
        />
        <ApiCheckCard 
          serviceName="Apify"
          status={apifyStatus}
          message={apifyMessage}
          onCheck={handleCheckApify}
          isLoading={isCheckingApify}
        />
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  const pageTitle = "API Status Check";

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

export default ApiCheckPage;
