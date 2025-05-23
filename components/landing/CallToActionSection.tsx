import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CallToActionSectionProps {
  isEnabled?: boolean;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundImageUrl?: string; // Optional background image
}

const CallToActionSection: React.FC<CallToActionSectionProps> = ({
  isEnabled = false,
  title = 'Ready to Dive In?',
  subtitle = 'Join our community today and discover the best local experiences.',
  buttonText = 'Get Started Now',
  buttonLink = '/register', // Default link, can be changed via props
  backgroundImageUrl,
}) => {
  if (!isEnabled) {
    return null;
  }

  const sectionStyle = backgroundImageUrl 
    ? { backgroundImage: `url(${backgroundImageUrl})` }
    : {};

  return (
    <section 
      className={cn(
        'py-16 md:py-24 text-center bg-primary text-primary-foreground',
        backgroundImageUrl && 'bg-cover bg-center bg-no-repeat'
      )}
      style={sectionStyle}
    >
      <div className={cn(
        'container mx-auto px-4 sm:px-6 lg:px-8',
        backgroundImageUrl && 'bg-black/50 py-12 md:py-16 rounded-lg' // Adds a semi-transparent overlay if bg image exists
      )}>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 font-raleway tracking-tight">
          {title}
        </h2>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto font-raleway">
          {subtitle}
        </p>
        {buttonLink && buttonText && (
          <Link href={buttonLink} passHref legacyBehavior>
            <Button 
              asChild 
              size="lg" 
              className="bg-background text-primary hover:bg-background/90 font-raleway text-lg px-8 py-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <a>{buttonText}</a>
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
};

export default CallToActionSection;
