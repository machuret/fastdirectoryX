import { NextPage } from 'next';
import { useEffect, useState, useCallback, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import withAdminAuth from '@/hoc/withAdminAuth';

// Define a more structured type for individual settings, including their UI properties
interface SettingConfig {
  key: string;
  label: string;
  defaultValue: string | null;
  group: string;
  type: 'text' | 'textarea' | 'boolean' | 'image_url' | 'number';
}

// Define the structure of the settings data fetched from the API
interface SettingsApiResponse {
  settingsArray: Array<{ key: string; value: string | null; label?: string; group?: string; type?: string }>;
  settingsObject: Record<string, string | null>;
}

// Define default settings configurations. This could be moved to a separate config file if it grows large.
const DEFAULT_SETTING_CONFIGS: SettingConfig[] = [
  // Hero Section
  { key: 'hero_enabled', label: 'Enable Hero Section', defaultValue: 'true', group: 'hero', type: 'boolean' },
  { key: 'hero_title', label: 'Hero Title', defaultValue: 'Welcome to Our Directory!', group: 'hero', type: 'text' },
  { key: 'hero_subtitle', label: 'Hero Subtitle', defaultValue: 'Find the best local businesses, services, and places.', group: 'hero', type: 'text' },
  { key: 'hero_search_placeholder', label: 'Hero Search Placeholder', defaultValue: 'Search for listings...', group: 'hero', type: 'text' },
  { key: 'hero_cta_text', label: 'Hero CTA Button Text', defaultValue: 'Browse All', group: 'hero', type: 'text' },
  { key: 'hero_cta_link', label: 'Hero CTA Button Link', defaultValue: '/listings', group: 'hero', type: 'text' },
  { key: 'hero_background_image_url', label: 'Hero Background Image URL', defaultValue: '', group: 'hero', type: 'image_url' },

  // Welcome Section
  { key: 'welcome_enabled', label: 'Enable Welcome Section', defaultValue: 'true', group: 'welcome', type: 'boolean' },
  { key: 'welcome_title', label: 'Welcome Title', defaultValue: 'Welcome to Our Community', group: 'welcome', type: 'text' },
  { key: 'welcome_content', label: 'Welcome Content', defaultValue: 'Discover a curated selection of the finest local businesses and services right in your neighborhood. Our platform is designed to connect you with unique experiences and reliable professionals.\n\nFrom cozy cafes to expert artisans, explore what our community has to offer. We believe in supporting local talent and fostering connections that enrich our everyday lives.', group: 'welcome', type: 'textarea' },

  // Feature Section
  { key: 'features_enabled', label: 'Enable Features Section', defaultValue: 'true', group: 'features', type: 'boolean' },
  { key: 'features_title', label: 'Features Section Title', defaultValue: 'Why Choose Us?', group: 'features', type: 'text' },
  { key: 'features_item1_title', label: 'Feature 1 Title', defaultValue: 'Quality Listings', group: 'features', type: 'text' },
  { key: 'features_item1_description', label: 'Feature 1 Description', defaultValue: 'Detailed and verified business information.', group: 'features', type: 'textarea' },
  { key: 'features_item1_icon', label: 'Feature 1 Icon (e.g., lucide-react icon name)', defaultValue: 'CheckSquare', group: 'features', type: 'text' },
  { key: 'features_item2_title', label: 'Feature 2 Title', defaultValue: 'Easy Search', group: 'features', type: 'text' },
  { key: 'features_item2_description', label: 'Feature 2 Description', defaultValue: 'Find what you need quickly and easily.', group: 'features', type: 'textarea' },
  { key: 'features_item2_icon', label: 'Feature 2 Icon', defaultValue: 'Search', group: 'features', type: 'text' },
  { key: 'features_item3_title', label: 'Feature 3 Title', defaultValue: 'User Reviews', group: 'features', type: 'text' },
  { key: 'features_item3_description', label: 'Feature 3 Description', defaultValue: 'Read authentic reviews from other users.', group: 'features', type: 'textarea' },
  { key: 'features_item3_icon', label: 'Feature 3 Icon', defaultValue: 'MessageSquare', group: 'features', type: 'text' },

  // Carousel Section
  { key: 'carousel_enabled', label: 'Enable Partners Carousel', defaultValue: 'true', group: 'carousel', type: 'boolean' },
  { key: 'carousel_title', label: 'Carousel Title', defaultValue: 'Our Partners', group: 'carousel', type: 'text' },

  // Featured Listings Section
  { key: 'featured_listings_enabled', label: 'Enable Featured Listings', defaultValue: 'true', group: 'featured_listings', type: 'boolean' },
  { key: 'featured_listings_title', label: 'Featured Listings Title', defaultValue: 'Featured Businesses', group: 'featured_listings', type: 'text' },
  { key: 'featured_listings_subtitle', label: 'Featured Listings Subtitle', defaultValue: 'Handpicked selections for you.', group: 'featured_listings', type: 'text' },
  { key: 'featured_listings_max_items', label: 'Max Featured Listings to Show', defaultValue: '6', group: 'featured_listings', type: 'number' },

  // Categories Section
  { key: 'categories_section_enabled', label: 'Enable Categories Section', defaultValue: 'true', group: 'categories', type: 'boolean' },
  { key: 'categories_section_title', label: 'Categories Title', defaultValue: 'Browse by Category', group: 'categories', type: 'text' },
  { key: 'categories_section_subtitle', label: 'Categories Subtitle', defaultValue: 'Explore various business categories.', group: 'categories', type: 'text' },
  { key: 'categories_max_items', label: 'Max Categories to Show', defaultValue: '8', group: 'categories', type: 'number' },

  // Recent Listings Section
  { key: 'recent_listings_enabled', label: 'Enable Recent Listings', defaultValue: 'true', group: 'recent_listings', type: 'boolean' },
  { key: 'recent_listings_title', label: 'Recent Listings Title', defaultValue: 'Newly Added', group: 'recent_listings', type: 'text' },
  { key: 'recent_listings_subtitle', label: 'Recent Listings Subtitle', defaultValue: 'Check out the latest additions.', group: 'recent_listings', type: 'text' },
  { key: 'recent_listings_max_items', label: 'Max Recent Listings to Show', defaultValue: '4', group: 'recent_listings', type: 'number' },

  // CTA (Call to Action) Section
  { key: 'cta_section_enabled', label: 'Enable CTA Section', defaultValue: 'true', group: 'cta', type: 'boolean' },
  { key: 'cta_title', label: 'CTA Title', defaultValue: 'Ready to Get Started?', group: 'cta', type: 'text' },
  { key: 'cta_content', label: 'CTA Content', defaultValue: '<p>Join our directory or list your business today!</p>', group: 'cta', type: 'textarea' },
  { key: 'cta_button_text', label: 'CTA Button Text', defaultValue: 'Learn More', group: 'cta', type: 'text' },
  { key: 'cta_button_link', label: 'CTA Button Link', defaultValue: '/about', group: 'cta', type: 'text' },
  
  // General SEO Settings for Homepage
  { key: 'seo_homepage_title', label: 'Homepage SEO Title', defaultValue: 'Your Business Directory | Find Local Businesses', group: 'seo', type: 'text' },
  { key: 'seo_homepage_description', label: 'Homepage Meta Description', defaultValue: 'The best place to find and connect with local businesses in your area. Explore listings, reviews, and more.', group: 'seo', type: 'textarea' },
];

const HomepageSettingsPage: NextPage = () => {
  // State for the form values, keyed by setting key
  const [formValues, setFormValues] = useState<Record<string, string | null>>({});
  // State to hold the metadata for rendering (merged from defaults and DB)
  const [settingConfigsToRender, setSettingConfigsToRender] = useState<SettingConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Fetch settings from the API and initialize form state
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/settings');
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch settings: ${response.status} ${errorText}`);
        }
        const data: SettingsApiResponse = await response.json();
        
        const fetchedValues = data.settingsObject || {};
        const initialFormState: Record<string, string | null> = {};

        // Merge default configs with fetched values to ensure all fields are present
        // and form is controlled from the start.
        const mergedConfigs = DEFAULT_SETTING_CONFIGS.map(config => {
          const fetchedValue = fetchedValues[config.key];
          initialFormState[config.key] = fetchedValue !== undefined ? fetchedValue : config.defaultValue;
          return {
            ...config,
            // Retain the fetched value if present, otherwise use default for display if needed
            // (though formValues will be the source of truth for inputs)
          };
        });

        setSettingConfigsToRender(mergedConfigs);
        setFormValues(initialFormState);

      } catch (error) {
        console.error("Error loading settings:", error);
        toast({
          title: 'Error Loading Settings',
          description: (error instanceof Error) ? error.message : 'An unknown error occurred.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [toast]); // toast is a stable function, so this effect runs once on mount

  // Handle input changes for form fields
  const handleInputChange = useCallback((key: string, value: string | boolean) => {
    setFormValues(prev => ({ ...prev, [key]: typeof value === 'boolean' ? String(value) : value }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      // Prepare data in the format expected by the API (array of {key, value})
      // Using settingConfigsToRender to ensure we only save defined settings
      const settingsToSave = settingConfigsToRender.map(config => ({
        key: config.key,
        value: formValues[config.key] ?? null, // Send current form value, or null if undefined
        // Include label, group, type if your API uses them for upsert logic
        label: config.label,
        group: config.group,
        type: config.type,
      }));

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToSave),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save settings and parse error response.' }));
        throw new Error(errorData.message || 'Failed to save settings');
      }

      toast({
        title: 'Settings Saved!',
        description: 'Homepage settings have been successfully updated.',
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: 'Error Saving Settings',
        description: (error instanceof Error) ? error.message : 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [formValues, settingConfigsToRender, toast]);

  // Render individual form fields based on their type
  const renderField = (config: SettingConfig) => {
    const currentValue = formValues[config.key] ?? ''; // Default to empty string for controlled inputs

    switch (config.type) {
      case 'textarea':
        return <Textarea value={currentValue} onChange={(e) => handleInputChange(config.key, e.target.value)} rows={5} className="mt-1" />;
      case 'boolean':
        return <Switch checked={currentValue === 'true'} onCheckedChange={(checked) => handleInputChange(config.key, checked)} className="mt-1" />;
      case 'number':
        return <Input type="number" value={currentValue} onChange={(e) => handleInputChange(config.key, e.target.value)} className="mt-1" />;
      case 'image_url':
      case 'text':
      default:
        return <Input type="text" value={currentValue} onChange={(e) => handleInputChange(config.key, e.target.value)} className="mt-1" />;
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading homepage settings...</div>;
  }

  // Group settings by their 'group' property for rendering in sections
  const groupedSettingsToRender = settingConfigsToRender.reduce((acc, setting) => {
    const groupName = setting.group || 'general';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(setting);
    return acc;
  }, {} as Record<string, SettingConfig[]>);

  return (
    <div className="container mx-auto p-6 bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-8">Homepage Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-12">
        {Object.entries(groupedSettingsToRender).map(([groupName, configsInGroup]) => (
          <div key={groupName} className="p-6 border rounded-lg shadow-sm bg-card text-card-foreground">
            <h2 className="text-2xl font-semibold mb-6 capitalize border-b pb-2">{groupName.replace(/_/g, ' ')} Section</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {configsInGroup.map((config) => (
                <div key={config.key} className="flex flex-col">
                  <Label htmlFor={config.key} className="mb-1 font-medium">
                    {config.label}
                  </Label>
                  {renderField(config)}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex justify-end mt-10">
          <Button type="submit" disabled={isSaving || isLoading} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            {isSaving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
};

// getInitialProps is generally not recommended for new Next.js apps using App Router or for client-side data fetching.
// If server-side rendering of initial settings is strictly needed with Pages Router, ensure it's implemented correctly.
// For client-side fetching as implemented in useEffect, getInitialProps is not necessary here.
/*
HomepageSettingsPage.getInitialProps = async (ctx) => {
  // Example: If you needed to pre-fetch on server for some reason
  // const session = await getSession(ctx);
  // if (!session || session.user.role !== 'ADMIN') { /* redirect or handle access * / }
  return { }; // Return empty or pre-fetched props
};
*/

export default withAdminAuth(HomepageSettingsPage);
