import React from 'react';
import { cn } from '@/lib/utils';

interface WelcomeSectionProps {
  isEnabled?: boolean;
  title?: string;
  content?: string;
  imageUrl?: string;
  imageAlt?: string;
  imagePosition?: 'left' | 'right';
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  isEnabled = false,
  title = 'Welcome to Our Platform',
  content = 'We are dedicated to providing you with the best experience. Explore our features and discover what makes us unique. Our community is growing, and we invite you to be a part of it. Learn more about our mission and how we strive to connect local businesses with customers like you.',
  imageUrl,
  imageAlt,
  imagePosition,
}) => {
  if (!isEnabled) {
    return null;
  }

  return (
    <section className="py-12 md:py-20"> 
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center"> 
        <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-black font-raleway tracking-tight mb-6">
          {title}
        </h2>
        <div className="prose prose-lg max-w-none font-raleway space-y-4 mx-auto">
          {content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-black dark:text-black">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;
