import { FullScreenSignup } from '@/components/ui/full-screen-signup';
import Head from 'next/head';

const SignupPage = () => {
  return (
    <>
      <Head>
        <title>Sign Up - HextaStudio</title>
        <meta name="description" content="Create your HextaStudio account." />
      </Head>
      <FullScreenSignup />
    </>
  );
};

export default SignupPage;
