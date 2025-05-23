import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react'; // For search bar icon

interface HeroSettings {
  heroTitle?: string;
  heroSubtitle?: string;
  heroCtaText?: string;
  heroCtaLink?: string;
  heroImageUrl?: string;
}

interface HeroSectionProps {
  settings: HeroSettings;
}

const HeroSection: React.FC<HeroSectionProps> = ({ settings }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Use the values from settings if they exist, otherwise default to empty string.
  const heroTitle = settings.heroTitle || ''; 
  const heroSubtitle = settings.heroSubtitle || '';
  
  // For CTA, keep existing logic: fallback to defaults if not provided or null/undefined
  const heroCtaText = settings.heroCtaText !== undefined && settings.heroCtaText !== null ? settings.heroCtaText : 'Explore Listings';
  const heroCtaLink = settings.heroCtaLink !== undefined && settings.heroCtaLink !== null ? settings.heroCtaLink : '/listings';
  const heroImageUrl = settings.heroImageUrl; // This is handled by pages/index.tsx to be undefined if not set in DB

  const sectionStyle = heroImageUrl ? {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${heroImageUrl})`,
  } : {};

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/listings?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <section
      className={`relative text-white py-20 md:py-32 px-4 text-center ${heroImageUrl ? 'bg-cover bg-center' : 'bg-gradient-to-br from-primary-dark via-primary to-primary-focus'}`}
      style={sectionStyle}
    >
      <div className="container mx-auto max-w-4xl z-10 relative">
        {/* Only render h1 if heroTitle has content */}
        {heroTitle && (
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight font-raleway tracking-tight">
            {heroTitle}
          </h1>
        )}
        {/* Only render p if heroSubtitle has content */}
        {heroSubtitle && (
          <p className="text-lg md:text-xl text-text-light-muted mb-10 max-w-2xl mx-auto font-raleway">
            {heroSubtitle}
          </p>
        )}
        
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
          <div className="relative flex items-center">
            <input 
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for restaurants, services, etc."
              className="w-full p-5 pr-16 text-lg text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-accent-purple focus:border-accent-purple shadow-lg"
            />
            <Button 
              type="submit" 
              className="absolute top-1/2 right-2 transform -translate-y-1/2 h-[calc(100%-1rem)] px-6 bg-accent-purple hover:bg-purple-700 rounded-md text-lg"
              aria-label="Search"
            >
              <Search className="h-6 w-6 text-white" />
            </Button>
          </div>
        </form>

        {heroCtaText && heroCtaLink && (
          <Link href={heroCtaLink} passHref legacyBehavior>
            <Button 
              size="lg" 
              className="bg-accent-purple hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-transform duration-300 ease-in-out hover:scale-105 shadow-lg"
            >
              {heroCtaText}
            </Button>
          </Link>
        )}
      </div>
      {/* Optional: Add a subtle pattern or overlay if no image and using gradient */}
      {!heroImageUrl && (
        <div className="absolute inset-0 bg-black opacity-10 z-0"></div>
      )}
    </section>
  );
};

export default HeroSection;
