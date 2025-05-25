import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useState, useMemo } from 'react';
import prisma from '@/lib/prisma';
import { Prisma, SiteSetting, PartnerLogo, ListingBusiness, ListingCategory, ListingImageUrl, ListingBusinessCategory } from '@prisma/client';
import HeroSection from '@/components/landing/HeroSection';
import PartnerCarousel from '@/components/landing/PartnerCarousel';
import FeaturedListingsSection from '@/components/landing/FeaturedListingsSection';
import CategoriesSection from '@/components/landing/CategoriesSection';
import RecentListingsSection from '@/components/landing/RecentListingsSection';
import FeatureCardsSection, { FeatureItem } from '@/components/landing/FeatureCardsSection';
import WelcomeSection from '@/components/landing/WelcomeSection';
import CallToActionSection from '@/components/landing/CallToActionSection';
import * as LucideIcons from 'lucide-react'; // Import LucideIcons for icon key type

interface HomePageSettings {
  heroEnabled?: boolean;
  heroTitle?: string;
  heroSubtitle?: string;
  heroCtaText?: string;
  heroCtaLink?: string;
  heroImageUrl?: string;
  welcomeEnabled?: boolean;
  welcomeTitle?: string;
  welcomeContent?: string;
  welcomeImageUrl?: string;
  welcomeImagePosition?: 'left' | 'right';
  featuresEnabled?: boolean;
  featuresTitle?: string;
  featuresItem1Title?: string;
  featuresItem1Icon?: keyof typeof LucideIcons;
  featuresItem1Description?: string;
  featuresItem2Title?: string;
  featuresItem2Icon?: keyof typeof LucideIcons;
  featuresItem2Description?: string;
  featuresItem3Title?: string;
  featuresItem3Icon?: keyof typeof LucideIcons;
  featuresItem3Description?: string;
  carouselEnabled?: boolean;
  carouselTitle?: string; 
  featuredListingsEnabled?: boolean;
  featuredListingsTitle?: string;
  featuredListingsMaxItems?: number;
  categoriesSectionEnabled?: boolean;
  categoriesSectionTitle?: string;
  categoriesMaxItems?: number;
  recentListingsEnabled?: boolean;
  recentListingsTitle?: string;
  recentListingsMaxItems?: number;
  ctaEnabled?: boolean;
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctaButtonText?: string;
  ctaButtonLink?: string;
  ctaBackgroundImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

interface SerializedCategory {
  category_id: number;
  category_name: string;
  slug?: string | null;
  _count?: { businesses?: number };
}

interface SerializedPhotoMinimal {
  id: string;
  url: string;
  alt_text?: string | null;
}

interface SerializedListing {
  business_id: string;
  title: string;
  slug?: string | null;
  price_range?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  displayImageUrl: string | null; 
  imageUrls?: SerializedPhotoMinimal[]; 
  categories: { category: { category_id: number; category_name: string; slug?: string | null; } }[]; 
  category_name?: string | null;
  category_slug?: string | null;
  isFeatured: boolean;
  updatedAt: string;
}

interface HomePageProps {
  settings: HomePageSettings;
  partnerLogos: PartnerLogo[];
  featuredListings: SerializedListing[];
  categories: SerializedCategory[];
  listingsForFilterableSection: SerializedListing[];
  error?: string | null;
}

// Define the type for listings as returned by Prisma with includes
type ListingForHomePage = Prisma.ListingBusinessGetPayload<{
  include: {
    imageUrls: true; // True will fetch all, or specify select/take if needed. Prisma handles take:1 correctly.
    categories: {
      include: {
        category: true;
      };
    };
  };
}>;

function serializeListingForHomePage(listing: ListingForHomePage): SerializedListing {
  let displayImageUrl = listing.image_url || undefined;
  if (!displayImageUrl && listing.imageUrls && listing.imageUrls.length > 0) {
    const primaryImage = listing.imageUrls[0];
    displayImageUrl = primaryImage?.url;
  }

  const firstCategoryName = listing.categories && listing.categories.length > 0 
    ? listing.categories[0].category.category_name 
    : null;

  const firstCategorySlug = listing.categories && listing.categories.length > 0
    ? listing.categories[0].category.slug
    : null;

  return {
    business_id: listing.business_id.toString(),
    title: listing.title,
    slug: listing.slug,
    price_range: listing.price_range,
    address: listing.address,
    phone: listing.phone,
    website: listing.website,
    description: listing.description,
    displayImageUrl: displayImageUrl || null, 
    imageUrls: listing.imageUrls?.map((img: ListingImageUrl) => ({ 
      id: img.image_url_id.toString(), 
      url: img.url, 
      alt_text: img.description
    })),
    categories: listing.categories.map((cb: ListingBusinessCategory & { category: ListingCategory }) => ({
      category: {
        category_id: cb.category.category_id,
        category_name: cb.category.category_name,
        slug: cb.category.slug,
      }
    })),
    category_name: firstCategoryName,
    category_slug: firstCategorySlug,
    isFeatured: listing.isFeatured,
    updatedAt: listing.updatedAt.toISOString(),
  };
}

// Helper function to convert snake_case to camelCase
function snakeToCamel(str: string): string {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
}

const HomePage: NextPage<HomePageProps> = ({ 
  settings,
  partnerLogos,
  featuredListings,
  categories,
  listingsForFilterableSection,
  error 
}) => {
  console.log('[HomePage RENDER] settings.seoTitle:', settings.seoTitle, 'TYPE:', typeof settings.seoTitle);

  const [sortKey, setSortKey] = useState<'latest' | 'featured' | 'alphabetical'>('latest');

  const displayedListings = useMemo(() => {
    if (!listingsForFilterableSection) return [];
    let result = [...listingsForFilterableSection]; // Use the new prop

    switch (sortKey) {
      case 'featured':
        result = result.filter(listing => listing.isFeatured);
        // Sort featured items by date as well, most recent first
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'latest':
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }
    return result;
  }, [listingsForFilterableSection, sortKey]);

  if (error) {
    return (
      <>
        <div className="container mx-auto p-4 text-red-500">Error loading homepage: {error}</div>
      </>
    );
  }

  // Construct featuresItems array for FeatureCardsSection
  const featuresItemsForComponent: FeatureItem[] = [];
  if (settings.featuresItem1Title && settings.featuresItem1Description) {
    featuresItemsForComponent.push({
      title: settings.featuresItem1Title,
      description: settings.featuresItem1Description,
      icon: settings.featuresItem1Icon,
    });
  }
  if (settings.featuresItem2Title && settings.featuresItem2Description) {
    featuresItemsForComponent.push({
      title: settings.featuresItem2Title,
      description: settings.featuresItem2Description,
      icon: settings.featuresItem2Icon,
    });
  }
  if (settings.featuresItem3Title && settings.featuresItem3Description) {
    featuresItemsForComponent.push({
      title: settings.featuresItem3Title,
      description: settings.featuresItem3Description,
      icon: settings.featuresItem3Icon,
    });
  }

  return (
    <>
      <Head>
        {/* --- SEO and Page Metadata --- */}
        {/* Sets the browser tab title, meta description, keywords for search engines, and favicon. */}
        <title>{settings.seoTitle || 'Welcome to Our Directory'}</title>
        <meta name="description" content={settings.seoDescription || 'Find the best businesses in town.'} />
        {settings.seoKeywords && <meta name="keywords" content={settings.seoKeywords} />} 
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* --- Hero Section --- */}
      {/* The main banner at the top of the page, usually with a title, subtitle, background image, and a call-to-action. */}
      {settings.heroEnabled && <HeroSection settings={settings} />}

      {/* --- Combined Welcome & Features Section --- */}
      <section className="py-12 md:py-20 bg-background-alt">
        <WelcomeSection 
          isEnabled={settings.welcomeEnabled}
          title={settings.welcomeTitle}
          content={settings.welcomeContent}
          imageUrl={settings.welcomeImageUrl}
          imagePosition={settings.welcomeImagePosition}
        />
        <FeatureCardsSection 
          isEnabled={settings.featuresEnabled} 
          title={settings.featuresTitle} 
          items={featuresItemsForComponent} // Use the constructed array
        />
      </section>
      
      {/* --- Partner Carousel Section --- */}
      {/* A scrolling carousel to display logos of partners or sponsors. */}
      <PartnerCarousel 
        logos={partnerLogos} 
        isEnabled={settings.carouselEnabled ?? false} 
        title={settings.carouselTitle}
      />
      
      {/* --- Featured Listings Section --- */}
      {/* Showcases a selection of hand-picked or promoted business listings. */}
      <FeaturedListingsSection 
        listings={featuredListings} 
        isEnabled={settings.featuredListingsEnabled ?? false} 
        title={settings.featuredListingsTitle}
      />
      
      {/* --- Categories Section --- */}
      {/* Allows users to browse listings by category. */}
      {(settings.categoriesSectionEnabled && categories && categories.length > 0) && (
        <CategoriesSection 
          categories={categories} 
          isEnabled={settings.categoriesSectionEnabled ?? false} 
          title={settings.categoriesSectionTitle} 
        />
      )}
      
      {/* --- Recent Listings Section --- */}
      {/* Displays the most recently added business listings. */}
      {settings.recentListingsEnabled && listingsForFilterableSection && (
        <RecentListingsSection 
          listings={displayedListings} 
          isEnabled={settings.recentListingsEnabled ?? false} 
          title={settings.recentListingsTitle}
          currentSortKey={sortKey}
          onSortKeyChange={setSortKey} // Pass setter to allow child component to change sort
        />
      )}
      
      {/* --- Call To Action Section --- */}
      {/* A section designed to encourage a specific user action, like signing up or exploring further. */}
      <CallToActionSection 
        isEnabled={settings.ctaEnabled}
        title={settings.ctaTitle}
        subtitle={settings.ctaSubtitle}
        buttonText={settings.ctaButtonText}
        buttonLink={settings.ctaButtonLink}
        backgroundImageUrl={settings.ctaBackgroundImageUrl}
      />
      {/* Main tag removed, Layout provides it */}
    </>
  );
};

export const getServerSideProps: GetServerSideProps<HomePageProps> = async (context) => {
  console.log('[getServerSideProps] Starting...');

  // Define default settings at the top of the try block or even outside if truly constant
  const defaultHomePageSettings: HomePageSettings = {
    heroEnabled: true,
    heroTitle: 'Welcome to Our Directory!',
    heroSubtitle: 'Find the best local businesses and services.',
    heroCtaText: 'Explore Now',
    heroCtaLink: '/listings',
    heroImageUrl: '/images/placeholder-hero.jpg',
    welcomeEnabled: true,
    welcomeTitle: 'Discover Our Community',
    welcomeContent: 'We are dedicated to connecting you with the best local resources and businesses. Explore what our community has to offer.',
    welcomeImageUrl: '/images/placeholder-welcome.jpg',
    welcomeImagePosition: 'right',
    featuresEnabled: true,
    featuresTitle: 'Why Choose Us?',
    featuresItem1Title: 'Quality Listings',
    featuresItem1Icon: 'Award',
    featuresItem1Description: 'Curated and verified listings to ensure quality.',
    featuresItem2Title: 'Easy to Use',
    featuresItem2Icon: 'Navigation',
    featuresItem2Description: 'Simple and intuitive interface for browsing.',
    featuresItem3Title: 'Community Focused',
    featuresItem3Icon: 'Users',
    featuresItem3Description: 'Connecting local businesses with the community.',
    carouselEnabled: true,
    carouselTitle: 'Our Partners',
    featuredListingsEnabled: true,
    featuredListingsTitle: 'Featured Businesses',
    featuredListingsMaxItems: 6,
    categoriesSectionEnabled: true,
    categoriesSectionTitle: 'Browse Categories',
    categoriesMaxItems: 8,
    recentListingsEnabled: true,
    recentListingsTitle: 'Recently Added',
    recentListingsMaxItems: 4,
    ctaEnabled: true,
    ctaTitle: 'Ready to Get Started?',
    ctaSubtitle: 'Join our directory or find what you need today.',
    ctaButtonText: 'Sign Up',
    ctaButtonLink: '/register',
    ctaBackgroundImageUrl: '/images/placeholder-cta-bg.jpg',
    seoTitle: 'Homepage - Your Business Directory',
    seoDescription: 'The official homepage for Your Business Directory.',
    seoKeywords: 'business, directory, local, listings',
  };

  let settings = { ...defaultHomePageSettings }; // Initialize with defaults

  try {
    const siteSettingsFromDB = await prisma.siteSetting.findMany();
    
    // Override defaults with database values
    siteSettingsFromDB.forEach(dbSetting => {
      const camelCaseKey = snakeToCamel(dbSetting.key) as keyof HomePageSettings;
      let value: any = dbSetting.value;

      if (Object.prototype.hasOwnProperty.call(settings, camelCaseKey)) {
        if (typeof (settings as any)[camelCaseKey] === 'boolean') {
          value = dbSetting.value === 'true';
        } else if (typeof (settings as any)[camelCaseKey] === 'number') {
          value = Number(dbSetting.value);
          if (isNaN(value)) value = (defaultHomePageSettings as any)[camelCaseKey]; // Fallback to default if NaN
        }
        (settings as any)[camelCaseKey] = value;
      }
    });

    console.log('[getServerSideProps] Settings after DB override:', JSON.stringify(settings, null, 2));

    let partnerLogos: PartnerLogo[] = [];
    if (settings.carouselEnabled) {
      try {
        partnerLogos = await prisma.partnerLogo.findMany({
          where: { isVisible: true },
          orderBy: { order: 'asc' },
        });
      } catch (error) {
        console.error("Error fetching partner logos:", error);
      }
    }
    console.log('[getServerSideProps] Fetched partnerLogos count:', partnerLogos.length);

    let featuredListings: SerializedListing[] = [];
    if (settings.featuredListingsEnabled) {
      const featuredListingsData: ListingForHomePage[] = await prisma.listingBusiness.findMany({
        where: {
          isFeatured: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: settings.featuredListingsMaxItems || 3,
        include: {
          imageUrls: { take: 1, orderBy: { created_at: 'asc' } },
          categories: {
            include: {
              category: true,
            },
          },
        },
      });
      featuredListings = featuredListingsData.map(serializeListingForHomePage);
    }

    const categoriesFromDB = await prisma.listingCategory.findMany({
      include: {
        _count: { select: { businesses: true } },
      },
      orderBy: { category_name: 'asc' },
      take: settings.categoriesMaxItems, 
    });
    const categories: SerializedCategory[] = categoriesFromDB.map(cat => ({
      category_id: cat.category_id,
      category_name: cat.category_name,
      slug: cat.slug,
      _count: { businesses: cat._count.businesses },
    }));

    // Fetch a general list of listings for the filterable section
    let listingsForFilterableSection: SerializedListing[] = [];
    if (settings.recentListingsEnabled) { // Use existing setting to control this section
      const listingsData: ListingForHomePage[] = await prisma.listingBusiness.findMany({
        orderBy: {
          updatedAt: 'desc', // Default sort for initial fetch
        },
        take: 50, // Fetch a larger number for client-side filtering/sorting
        include: {
          imageUrls: { take: 1, orderBy: { created_at: 'asc' } },
          categories: {
            include: {
              category: true,
            },
          },
        },
      });
      listingsForFilterableSection = listingsData.map(serializeListingForHomePage);
    }

    console.log('[getServerSideProps] FINAL settings.seoTitle:', settings.seoTitle, 'TYPE:', typeof settings.seoTitle);

    return {
      props: {
        settings,
        partnerLogos,
        featuredListings,
        categories,
        listingsForFilterableSection,
        error: null,
      },
    };
  } catch (error) {
    console.error('[getServerSideProps] Error fetching homepage data:', error);
    // In case of error, settings might not be fully populated from DB, 
    // but it would have defaultHomePageSettings values.
    // We can choose to return the partially updated 'settings' or stick to 'defaultHomePageSettings'
    // For safety, let's ensure minimal defaults are used if specific settings are critical for error page rendering.
    const errorPageSettings: HomePageSettings = {
      ...defaultHomePageSettings, // Start with all defaults
      heroEnabled: true, // Override specific fields for error display
      heroTitle: 'Error Loading Content',
      heroSubtitle: 'Please try again later.',
      seoTitle: 'Error',
      seoDescription: 'Could not load page content.',
      welcomeEnabled: false,
      featuresEnabled: false,
      carouselEnabled: false,
      featuredListingsEnabled: false,
      categoriesSectionEnabled: false,
      recentListingsEnabled: false,
      ctaEnabled: false,
    };
    return {
      props: {
        settings: errorPageSettings, // Use the specially crafted error settings
        partnerLogos: [],
        featuredListings: [],
        categories: [],
        listingsForFilterableSection: [],
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      },
    };
  }
};

export default HomePage;
