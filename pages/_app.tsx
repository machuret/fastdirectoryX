import '@/styles/globals.css';
import type { AppContext, AppProps, AppInitialProps } from 'next/app';
import { Toaster } from "@/components/ui/toaster"; 
import Layout from '@/components/Layout'; 
import AdminLayout from '@/components/admin/AdminLayout'; 
import { AdminHeaderProvider } from '@/components/AdminHeaderContext'; 
import { iconMap } from '@/components/admin/iconMap'; 
import type { LucideIcon } from 'lucide-react'; 
import { useRouter } from 'next/router'; 
import { DisplayMenuItemFE, getMenuItemsForLocation } from '@/lib/menu'; 
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import ErrorBoundary from '@/components/ErrorBoundary'; 
import Head from 'next/head'; 

// Add NextPage type with optional getLayout property
import type { NextPage } from 'next';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: React.ReactElement, pageProps: MyAppPageProps, headerMenuItems: DisplayMenuItemFE[], footerMenuItems: DisplayMenuItemFE[]) => React.ReactNode;
};

// Extend AppProps to include potential menu items in pageProps
export interface MyAppPageProps {
  headerMenuItems?: DisplayMenuItemFE[];
  footerMenuItems?: DisplayMenuItemFE[];
  pageTitle?: string;
  pageDescription?: string;
  pageIconName?: string;
  [key: string]: any; // Allow other pageProps
}

interface MyAppProps extends AppProps<MyAppPageProps> {
  headerMenuItems: DisplayMenuItemFE[]; // Now directly on MyAppProps
  footerMenuItems: DisplayMenuItemFE[]; // Now directly on MyAppProps
  Component: NextPageWithLayout<MyAppPageProps>; // Use the new type for Component
}

function MyApp({ Component, pageProps, headerMenuItems, footerMenuItems }: MyAppProps) {
  const router = useRouter(); // Get the router object

  // Use the getLayout defined on the page, otherwise fall back to default logic
  const getLayout = Component.getLayout ?? ((page: React.ReactElement, props: MyAppPageProps, hMenu: DisplayMenuItemFE[], fMenu: DisplayMenuItemFE[]) => {
    let LayoutComponent: React.FC<any> = Layout; // Default to standard Layout
    let layoutProps: any = { headerMenuItems: hMenu, footerMenuItems: fMenu };

    if (router.pathname.startsWith('/admin/')) {
      LayoutComponent = AdminLayout;
      // AdminLayout requires pageTitle. Get it from props (pageProps) or use a default.
      layoutProps.pageTitle = props.pageTitle || 'Admin Dashboard'; 
    }
    return <LayoutComponent {...layoutProps}>{page}</LayoutComponent>;
  });

  let pageContent = getLayout(<Component {...pageProps} />, pageProps, headerMenuItems, footerMenuItems);

  // If it's an admin page and the component *doesn't* define its own getLayout
  // (meaning AdminLayout was applied by the fallback), wrap with AdminHeaderProvider.
  // If getLayout *was* provided by the page, that layout is responsible for AdminHeaderProvider.
  if (router.pathname.startsWith('/admin/') && !Component.getLayout) {
    const initialBaseElements: { title?: string; description?: string; icon?: React.ReactNode } = {};
    if (pageProps.pageTitle) {
      initialBaseElements.title = pageProps.pageTitle;
    }
    if (pageProps.pageDescription) {
      initialBaseElements.description = pageProps.pageDescription;
    }
    if (pageProps.pageIconName && typeof pageProps.pageIconName === 'string') {
      const IconComponent = iconMap[pageProps.pageIconName as keyof typeof iconMap] as LucideIcon | undefined;
      if (IconComponent) {
        initialBaseElements.icon = <IconComponent />;
      }
    }
    pageContent = (
      <AdminHeaderProvider initialBaseElements={initialBaseElements}>
        {pageContent} 
      </AdminHeaderProvider>
    );
  }

  return (
    <SessionProvider session={pageProps.session}>
      <Head>
        <title>My Alpha Site</title> {/* Default title */}
        {/* You can also add a default title or other global head elements here if needed */}
      </Head>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ErrorBoundary>
          {pageContent}
        </ErrorBoundary>
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  );
}

MyApp.getInitialProps = async (appContext: AppContext): Promise<AppInitialProps & { headerMenuItems: DisplayMenuItemFE[], footerMenuItems: DisplayMenuItemFE[] }> => {
  // Call the page's `getInitialProps` and fill `appProps.pageProps`
  // Note: appContext.Component.getInitialProps is deprecated in favor of page-level data fetching methods like getServerSideProps or getStaticProps
  // However, for _app, getInitialProps is still the way to fetch data common to all pages.
  let pageProps = {};
  if (appContext.Component.getInitialProps) {
    pageProps = await appContext.Component.getInitialProps(appContext.ctx);
  }

  // Fetch global menu items
  // These will be available in `MyApp`'s props, and we pass them to Layout
  let headerItems: DisplayMenuItemFE[] = [];
  let footerItems: DisplayMenuItemFE[] = [];

  // Only fetch menu items if we're on the server (appContext.ctx.req will exist)
  if (appContext.ctx.req) {
    try {
      // We run these in parallel to speed up fetching
      [headerItems, footerItems] = await Promise.all([
        getMenuItemsForLocation('header'),
        getMenuItemsForLocation('footer')
      ]);
      console.log('[MyApp.getInitialProps SERVER] Fetched headerItems:', JSON.stringify(headerItems, null, 2)); // Log fetched items
    } catch (error) {
      console.error("Error fetching menu items in _app.getInitialProps on server:", error);
      // Initialize with empty arrays in case of error to prevent further issues
      headerItems = [];
      footerItems = [];
    }
  }
  // If not on the server (i.e., client-side navigation), headerItems and footerItems will remain empty.
  // This means the Layout component will receive empty menu arrays during client-side navigations.

  return {
    pageProps,
    headerMenuItems: headerItems,
    footerMenuItems: footerItems,
  };
};

export default MyApp;
