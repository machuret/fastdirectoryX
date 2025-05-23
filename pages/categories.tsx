import React from 'react';
import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head'; 
import prisma from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'; 
import { ListingCategory } from '@prisma/client';

interface CategoryItem {
  name: string;
  slug: string;
  imageUrl?: string | null;
  description?: string | null;
}

interface CategoriesPageProps {
  categories: CategoryItem[];
  error?: string;
}

const CategoriesPage: NextPage<CategoriesPageProps> = ({ categories, error }) => {
  return (
    <>
      <Head>
        <title>All Categories - Your Site Name</title> 
        <meta name="description" content="Browse all categories of listings available on Your Site Name." /> 
      </Head>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">All Categories</h1>
        {error ? (
          <p className="text-center text-muted-foreground">{error}</p>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link key={category.slug} href={`/category/${category.slug}`} passHref legacyBehavior>
                <a className="block hover:no-underline">
                  <Card className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col overflow-hidden">
                    {category.imageUrl && (
                      <div className="w-full h-40 relative overflow-hidden">
                        <img 
                          src={category.imageUrl} 
                          alt={`Image for ${category.name}`} 
                          className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105" 
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-center text-xl leading-tight">{category.name}</CardTitle>
                    </CardHeader>
                    {category.description && (
                      <CardContent className="flex-grow">
                        <CardDescription className="text-sm text-center text-muted-foreground line-clamp-3">
                          {category.description}
                        </CardDescription>
                      </CardContent>
                    )}
                  </Card>
                </a>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No categories found.</p>
        )}
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<CategoriesPageProps> = async () => {
  try {
    console.log("getServerSideProps for /categories: Fetching all categories directly...");

    const activeCategoriesData = await prisma.listingCategory.findMany({
      select: {
        category_name: true,
        slug: true,
        imageUrl: true, 
        description: true 
      },
      orderBy: {
        category_name: 'asc',
      },
      distinct: ['category_name', 'slug'], 
    });
    console.log("getServerSideProps for /categories: Raw activeCategoriesData from DB (direct fetch):", activeCategoriesData);

    const categories: CategoryItem[] = activeCategoriesData
      .map(cat => ({ 
        name: cat.category_name as string, 
        slug: cat.slug as string,        
        imageUrl: cat.imageUrl, 
        description: cat.description 
      }));
    console.log("getServerSideProps for /categories: Mapped categories for page (direct fetch):", categories);

    return {
      props: { categories },
    };
  } catch (error) {
    console.error("getServerSideProps for /categories: Error fetching categories (direct fetch):", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return {
      props: { categories: [], error: `Failed to load categories: ${errorMessage}` },
    };
  }
};

export default CategoriesPage;
