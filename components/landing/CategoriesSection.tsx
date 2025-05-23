import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tag } from 'lucide-react'; // Example icon

// Define a more precise type for the data this component actually uses
interface CategoryForDisplay {
  category_id: number;
  category_name: string;
  slug?: string | null; // slug is used for the link
  _count?: { businesses?: number }; // For displaying business count
}

interface CategoriesSectionProps {
  categories: CategoryForDisplay[];
  isEnabled: boolean;
  title?: string | null;
}

const CategoriesSection: React.FC<CategoriesSectionProps> = ({ categories, isEnabled, title }) => {
  if (!isEnabled || !categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-12 text-text-primary font-raleway tracking-tight">
          {title || 'Browse by Category'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link 
              key={category.category_id} 
              href={`/listings/category/${category.slug || category.category_id}`} 
              passHref
              legacyBehavior
            >
              <a className="block group">
                <Card className="h-full overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 bg-card text-card-foreground rounded-xl flex flex-col items-center justify-center text-center p-6 aspect-square">
                  {/* Using a generic icon, can be replaced with category-specific icons later */}
                  <div className="mb-3 p-3 bg-primary/10 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Tag className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-md md:text-lg font-semibold text-text-primary font-raleway tracking-tight leading-tight group-hover:text-primary transition-colors">
                    {category.category_name}
                  </CardTitle>
                  {category._count?.businesses !== undefined && (
                    <p className="text-xs text-text-secondary mt-1 font-raleway">
                      ({category._count.businesses})
                    </p>
                  )}
                </Card>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
