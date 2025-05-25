import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ColoursTab from '@/components/admin/customize/ColoursTab';
import { Palette, LayoutGrid } from 'lucide-react'; // Icons for tabs
import type { NextPageWithLayout, MyAppPageProps } from '@/pages/_app'; 
import { AdminHeaderProvider } from '@/components/AdminHeaderContext';
import type { DisplayMenuItemFE } from '@/lib/menu';

const CustomizePageContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'colours' | 'tabs'>('colours');

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('colours')}
            className={`
              ${activeTab === 'colours' 
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
            `}
          >
            <Palette className="mr-2 h-5 w-5" />
            Colours
          </button>
          {/* <button
            onClick={() => setActiveTab('tabs')}
            className={`
              ${activeTab === 'tabs' 
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
            `}
          >
            <LayoutGrid className="mr-2 h-5 w-5" />
            Tabs
          </button> */}
          {/* Placeholder for Tabs tab button - uncomment when TabsSettingsTab is ready */}
        </nav>
      </div>

      <div>
        {activeTab === 'colours' && <ColoursTab />}
        {/* {activeTab === 'tabs' && <TabsSettingsTab />} */}
      </div>
    </div>
  );
};

const CustomizePage: NextPageWithLayout = () => {
  return <CustomizePageContent />;
};

CustomizePage.getLayout = function getLayout(
  page: React.ReactElement,
  pageProps: MyAppPageProps, 
  headerMenuItems: DisplayMenuItemFE[],
  footerMenuItems: DisplayMenuItemFE[]
) {
  const pageTitle = "Site Customization";
  const PageIconComponent = Palette; 
  const pageDescription = "Customize the appearance and enabled features of your site.";

  return (
    <AdminHeaderProvider
      initialBaseElements={{
        title: pageTitle,
        description: pageDescription,
        icon: <PageIconComponent className="h-5 w-5" />, 
      }}
    >
      <AdminLayout
        pageTitle={pageTitle}
        pageIcon={PageIconComponent} 
        pageDescription={pageDescription}
        headerMenuItems={headerMenuItems} 
        footerMenuItems={footerMenuItems} 
      >
        {page}
      </AdminLayout>
    </AdminHeaderProvider>
  );
};

export default CustomizePage;
