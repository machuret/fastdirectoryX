import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as LucideIcons from 'lucide-react';

export interface FeatureItem {
  title: string;
  description: string;
  icon?: keyof typeof LucideIcons; // Use keyof to ensure valid icon names
}

interface FeatureCardsSectionProps {
  isEnabled?: boolean;
  title?: string;
  items?: FeatureItem[];
}

// Helper to get Lucide icon component by name
const getIcon = (iconName?: keyof typeof LucideIcons) => {
  if (!iconName) return null;
  const IconComponent = LucideIcons[iconName] as React.ElementType;
  return IconComponent ? <IconComponent className="h-8 w-8 text-primary mb-4" /> : <LucideIcons.Gift className="h-8 w-8 text-primary mb-4" />; // Default icon
};

const FeatureCardsSection: React.FC<FeatureCardsSectionProps> = ({ 
  isEnabled = false,
  title = 'Key Features',
  items = [] 
}) => {
  if (!isEnabled || items.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16">
        {title && (
          <div className="text-center mt-10 md:mt-12 mb-8 md:mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary font-raleway tracking-tight">
              {title}
            </h2>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {items.map((item, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card text-card-foreground border-border">
              <CardHeader className="items-center text-center">
                {getIcon(item.icon)}
                <CardTitle className="font-raleway text-xl font-semibold text-text-primary">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-text-secondary font-raleway">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCardsSection;
