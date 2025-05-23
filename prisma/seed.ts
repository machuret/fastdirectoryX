import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Seed Categories ---
  const categoriesData: Prisma.ListingCategoryCreateInput[] = [
    { category_name: 'Restaurants & Cafes' },
    { category_name: 'Shopping & Retail' },
    { category_name: 'Health & Beauty' },
    { category_name: 'Home Services' },
    { category_name: 'Automotive' },
    { category_name: 'Entertainment' },
    { category_name: 'Professional Services' },
    { category_name: 'Travel & Tourism' },
  ];

  for (const catData of categoriesData) {
    const category = await prisma.listingCategory.upsert({
      where: { category_name: catData.category_name },
      update: {},
      create: catData,
    });
    console.log(`Created or found category with id: ${category.category_id}`);
  }

  // Fetch created categories to link them to businesses
  const allCategories = await prisma.listingCategory.findMany();
  if (allCategories.length === 0) {
    console.log('No categories found to link to businesses. Please seed categories first.');
    return;
  }

  // --- Seed Businesses ---
  const businessesData: Omit<Prisma.ListingBusinessCreateInput, 'categories' | 'imageUrls'>[] = [
    {
      title: 'The Cozy Corner Cafe',
      slug: 'cozy-corner-cafe',
      description: 'A warm and inviting cafe serving the best coffee and pastries in town. Perfect for a morning pick-me-up or a relaxing afternoon.',
      address: '123 Main Street, Anytown',
      phone: '555-0101',
      website: 'https://cozycorner.example.com',
      price_range: '$$',
      isFeatured: true,
      image_url: '/listings/cafe-exterior.jpg',
    },
    {
      title: 'Trendy Threads Boutique',
      slug: 'trendy-threads-boutique',
      description: 'Your one-stop shop for the latest fashion trends. We offer a wide variety of clothing and accessories for men and women.',
      address: '456 Oak Avenue, Anytown',
      phone: '555-0102',
      website: 'https://trendythreads.example.com',
      price_range: '$$$',
      isFeatured: true,
      image_url: '/listings/boutique-front.jpg',
    },
    {
      title: 'Green Thumb Gardeners',
      slug: 'green-thumb-gardeners',
      description: 'Expert gardening and landscaping services to make your outdoor space beautiful. We handle everything from lawn care to full garden design.',
      address: '789 Pine Lane, Anytown',
      phone: '555-0103',
      website: 'https://greenthumb.example.com',
      price_range: '$$',
      isFeatured: false,
      image_url: '/listings/gardening-service.jpg',
    },
    {
      title: 'QuickFix Auto Repair',
      slug: 'quickfix-auto-repair',
      description: 'Reliable and affordable auto repair services. From oil changes to engine diagnostics, our certified mechanics have you covered.',
      address: '101 Maple Drive, Anytown',
      phone: '555-0104',
      website: 'https://quickfixauto.example.com',
      price_range: '$$',
      isFeatured: true,
      image_url: '/listings/auto-repair-shop.jpg',
    },
    {
      title: 'Serene Spa & Wellness',
      slug: 'serene-spa-wellness',
      description: 'Indulge in a relaxing spa experience. We offer massages, facials, and a variety of wellness treatments to rejuvenate your body and mind.',
      address: '202 Birch Road, Anytown',
      phone: '555-0105',
      website: 'https://serenespa.example.com',
      price_range: '$$$$',
      isFeatured: false,
      image_url: '/listings/spa-interior.jpg',
    },
    {
      title: 'Adventure Travel Co.',
      slug: 'adventure-travel-co',
      description: 'Plan your next adventure with us! We specialize in exotic destinations and customized travel packages for thrill-seekers.',
      address: '303 Cedar Street, Anytown',
      phone: '555-0106',
      website: 'https://adventuretravel.example.com',
      price_range: '$$$$',
      isFeatured: true,
      image_url: '/listings/travel-agency.jpg',
    }
  ];

  for (let i = 0; i < businessesData.length; i++) {
    const bizData = businessesData[i];
    const business = await prisma.listingBusiness.create({
      data: {
        ...bizData,
        categories: {
          create: [
            // Assign 1-2 categories to each business
            {
              category: { connect: { category_id: allCategories[i % allCategories.length].category_id } }
            },
            allCategories.length > 1 ? {
              category: { connect: { category_id: allCategories[(i + 1) % allCategories.length].category_id } }
            } : undefined,
          ].filter(Boolean) as Prisma.ListingBusinessCategoryCreateNestedManyWithoutBusinessInput['create'],
        },
        imageUrls: {
          create: [
            { url: bizData.image_url || '/listings/default-1.jpg', description: `${bizData.title} primary image`, is_cover_image: true },
            { url: `/listings/default-img-${i % 3 + 2}.jpg`, description: `Additional image for ${bizData.title}` }, // Ensure unique URLs if needed
          ]
        }
      },
    });
    console.log(`Created business with id: ${business.business_id} - ${business.title}`);
  }

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
