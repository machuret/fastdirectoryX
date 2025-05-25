import { PrismaClient, Prisma, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Ensure an Admin User exists
  const adminEmail = 'admin@example.com';
  const adminPassword = 'password123'; // Choose a secure password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: UserRole.ADMIN }, // Ensure role is ADMIN if user exists
    create: {
      email: adminEmail,
      name: 'Admin User',
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(), // Mark email as verified for simplicity in seeding
    },
  });
  console.log(`Upserted admin user with ID: ${adminUser.user_id} and email: ${adminUser.email}`);

  // --- Seed Categories ---
  const categoriesData: Prisma.ListingCategoryCreateInput[] = [
    { category_name: 'Restaurants & Cafes', slug: 'restaurants-and-cafes' },
    { category_name: 'Shopping & Retail', slug: 'shopping-and-retail' },
    { category_name: 'Health & Beauty', slug: 'health-and-beauty' },
    { category_name: 'Home Services', slug: 'home-services' },
    { category_name: 'Automotive', slug: 'automotive' },
    { category_name: 'Entertainment', slug: 'entertainment' },
    { category_name: 'Professional Services', slug: 'professional-services' },
    { category_name: 'Travel & Tourism', slug: 'travel-and-tourism' },
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
  const businessesData: Omit<Prisma.ListingBusinessCreateInput, 'categories' | 'imageUrls' | 'business' | 'user'>[] = [
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

  const placeholderUserId = adminUser.user_id; // Use the ID of the upserted admin user

  /*
  // Temporarily commented out due to unique slug constraint error on ListingBusiness
  // User needs to fix this data or logic later.
  for (let i = 0; i < businessesData.length; i++) {
    const bizData = businessesData[i];

    // 1. Create the core Business record
    const coreBusiness = await prisma.business.create({
      data: {
        name: bizData.title, // Use listing title as business name
        user: { connect: { user_id: placeholderUserId } }, // Connect to an existing user
        // Add other required fields for Business model if any, e.g., address, phone if they are part of Business and not just ListingBusiness
      }
    });
    console.log(`Created core business with id: ${coreBusiness.business_id} - ${coreBusiness.name}`);

    // 2. Create the ListingBusiness record, linking to the core Business and User
    const listingBusiness = await prisma.listingBusiness.create({
      data: {
        ...bizData, // Spread the rest of the listing-specific data
        business: { connect: { business_id: coreBusiness.business_id } }, 
        user: { connect: { user_id: placeholderUserId } }, 
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
            { url: bizData.image_url || '/listings/default-1.jpg', description: `${bizData.title} primary image` }, // Removed is_primary
            { url: `/listings/default-img-${i % 3 + 2}.jpg`, description: `Additional image for ${bizData.title}` }, 
          ]
        }
      },
    });
    console.log(`Created listing business with id: ${listingBusiness.listing_business_id} - ${listingBusiness.title}`);
  }
  */

  // --- Seed Prompt Templates --- (Assuming this is for the Prompt Vault)
  console.log('Seeding Prompts for Prompt Vault...');
  const promptsToSeed: Prisma.PromptTemplateCreateInput[] = [
    {
      name: 'Description',
      slug: 'description',
      content: 'Generate a compelling business description based on the following keywords: [Keywords]. Highlight unique selling points such as [USP1] and [USP2]. The target audience is [Audience]. The tone should be [Tone].',
    },
    {
      name: 'Guides',
      slug: 'guides', 
      content: 'Create a step-by-step guide for [Task/Process]. The guide should be easy to follow for a beginner. Include tips for [Tip1] and common pitfalls to avoid like [Pitfall1].',
    },
    {
      name: 'FAQ',
      slug: 'faq',
      content: 'Develop a list of frequently asked questions (FAQs) and their answers for a [Product/Service/Topic]. Cover at least 5 common questions, including [Question1Example] and [Question2Example].',
    },
    {
      name: 'WebFAQ',
      slug: 'web-faq', 
      content: 'Generate a set of FAQs specifically for a website that [WebsitePurpose/Features]. Include questions about navigation, user accounts, and troubleshooting common issues like [IssueExample].',
    },
    {
      name: 'Cities',
      slug: 'cities', 
      content: 'Write a short, engaging overview of the city of [CityName]. Mention its famous landmarks like [Landmark1], cultural aspects such as [Culture1], and hidden gems like [HiddenGem1].',
    },
  ];

  for (const promptData of promptsToSeed) {
    const promptEntry = await prisma.promptTemplate.upsert({
      where: { slug: promptData.slug },
      update: { content: promptData.content, name: promptData.name }, 
      create: promptData,
    });
    console.log(`Created or updated Prompt Vault entry with id: ${promptEntry.id} - ${promptEntry.name}`);
  }

  console.log(`Seeding finished.`);
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
