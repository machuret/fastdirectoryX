import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import type { NextComponentType, NextPage, GetServerSideProps, GetServerSidePropsContext, NextPageContext } from 'next';
import type { NextApiRequest, NextApiResponse } from 'next';
import React, { useEffect, useState } from 'react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getServerSession, type Session } from 'next-auth'; 
import { authOptions } from '../pages/api/auth/[...nextauth]';

interface WithAdminAuthInjectedProps {
  session?: Session | null;
}

// Helper to get display name
const getDisplayName = (WrappedComponent: any) => {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
};

const withAdminAuth = <P extends object>(
  WrappedComponent: 
    | NextComponentType<NextPageContext, any, P & WithAdminAuthInjectedProps> 
    | ( (req: NextApiRequest, res: NextApiResponse, session?: Session) => Promise<void> | void )
) => {

  const isPageReactComponent = (
    component: any
  ): component is NextComponentType<NextPageContext, any, P & WithAdminAuthInjectedProps> => {
    return (
      typeof component === 'function' &&
      (!!component.prototype?.isReactComponent || 
       /^[A-Z]/.test(component.name) || 
       component.displayName || 
       (component as any).getServerSideProps || 
       (component as any).getStaticProps ||
       (component as any).getInitialProps
      )
    );
  };

  if (!isPageReactComponent(WrappedComponent)) {
    const ApiAuthHandler = async (req: NextApiRequest, res: NextApiResponse) => {
      const session = await getServerSession(req, res, authOptions);
      if (!session || session.user?.role !== 'ADMIN' || session.user?.status !== 'ACTIVE') {
        res.status(403).json({ message: 'Forbidden: Admin access required and account must be active.' });
        return;
      }
      const apiRoute = WrappedComponent as (req: NextApiRequest, res: NextApiResponse, session?: Session) => Promise<void> | void;
      return apiRoute(req, res, session);
    };
    return ApiAuthHandler as any; 
  }

  // The PageComponent variable is used for rendering, keep its existing type for that.
  const PageComponent = WrappedComponent as NextComponentType<NextPageContext, any, P & WithAdminAuthInjectedProps>;

  // Check for getServerSideProps directly on WrappedComponent
  if (typeof (WrappedComponent as any).getServerSideProps === 'function') {
    const ServerSideAuthComponent: NextPage<P & WithAdminAuthInjectedProps, any> & {
      getServerSideProps?: GetServerSideProps<any, any>;
    } = (props: P & WithAdminAuthInjectedProps) => {
      const { data: sessionFromHook, status } = useSession();
      const router = useRouter();
      const [isClientForGSSP, setIsClientForGSSP] = useState(false);

      useEffect(() => {
        setIsClientForGSSP(true);
      }, []);

      const currentSession = props.session || sessionFromHook;

      useEffect(() => {
        if (!isClientForGSSP || status === 'loading') return;
        if (!currentSession || currentSession.user?.role !== 'ADMIN' || currentSession.user?.status !== 'ACTIVE') {
          router.push('/login?error=Unauthorized&message=You do not have permission to view this page (GSSP).');
        }
      }, [currentSession, status, router, isClientForGSSP]);

      if (!isClientForGSSP || status === 'loading' || !currentSession || currentSession.user?.role !== 'ADMIN' || currentSession.user?.status !== 'ACTIVE') {
        return <LoadingSpinner />;
      }
      // Pass all original props, including the session from GSSP if it was injected
      return <PageComponent {...props as P & WithAdminAuthInjectedProps} />;
    };

    ServerSideAuthComponent.displayName = `WithAdminAuth_GSSP(${getDisplayName(WrappedComponent)})`;
    
    // @ts-ignore
    const originalGetServerSideProps = (WrappedComponent as any).getServerSideProps; 
    
    // Only assign if originalGetServerSideProps is indeed a function
    if (typeof originalGetServerSideProps === 'function') {
      ServerSideAuthComponent.getServerSideProps = async (context: GetServerSidePropsContext) => {
        const session = await getServerSession(context.req, context.res, authOptions);
        if (!session || session.user?.role !== 'ADMIN' || session.user?.status !== 'ACTIVE') {
          return {
            redirect: {
              destination: '/login?error=Unauthorized&message=Admin access required (GSSP).',
              permanent: false,
            },
          };
        }
        
        // Call original GSSP and inject session, ensuring it's a function
        // No need for another typeof check here as we are inside one for originalGetServerSideProps
        const gsspFunction = originalGetServerSideProps as GetServerSideProps<any, any>;
        const originalProps = await gsspFunction(context);
        if ('props' in originalProps) {
          return { ...originalProps, props: { ...originalProps.props, session } };
        }
        // Handle cases where originalProps might not have 'props' (e.g. redirect/notFound)
        // or when originalProps.props is undefined
        const existingProps = (originalProps as any).props || {};
        return { ...originalProps, props: { ...existingProps, session } };
      };
    } // End if typeof originalGetServerSideProps === 'function'

    if ((WrappedComponent as any).getInitialProps) ServerSideAuthComponent.getInitialProps = (WrappedComponent as any).getInitialProps;
    // Add other static methods if needed (getStaticProps, getStaticPaths - though less common with GSSP)

    return ServerSideAuthComponent;

  } else {
    const ClientSideAuthComponent: NextPage<P & WithAdminAuthInjectedProps> = (props: P & WithAdminAuthInjectedProps) => {
      const [isClient, setIsClient] = useState(false);
      const { data: session, status } = useSession();
      const router = useRouter();

      useEffect(() => {
        setIsClient(true);
      }, []);

      useEffect(() => {
        if (!isClient || status === 'loading') return;
        if (!session || session.user?.role !== 'ADMIN' || session.user?.status !== 'ACTIVE') {
          router.push('/login?error=Unauthorized&message=You do not have permission to view this page.');
        }
      }, [session, status, router, isClient]);

      if (!isClient || status === 'loading' || !session || session.user?.role !== 'ADMIN' || session.user?.status !== 'ACTIVE') {
        return <LoadingSpinner />;
      }
      return <PageComponent {...props as P & WithAdminAuthInjectedProps} session={session} />;
    };

    ClientSideAuthComponent.displayName = `WithAdminAuth_Client(${getDisplayName(WrappedComponent)})`;
    if ((WrappedComponent as any).getInitialProps) ClientSideAuthComponent.getInitialProps = (WrappedComponent as any).getInitialProps;
    return ClientSideAuthComponent;
  }
};

export default withAdminAuth;
