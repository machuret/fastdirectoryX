import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import slugifyLibrary from 'slugify';
import { PrismaClient, ListingBusiness } from '@prisma/client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a unique slug for a listing title.
 * Converts the title to a URL-friendly slug and ensures uniqueness in the database.
 * @param title The title to slugify.
 * @param prisma The Prisma client instance.
 * @returns A unique slug string.
 */
export async function generateUniqueSlug(title: string, prisma: PrismaClient): Promise<string> {
  let slug = slugifyLibrary(title, { lower: true, strict: true, remove: /[*+~.()_'"!:@]/g });

  let counter = 1;
  let uniqueSlug = slug;

  // Check if the slug already exists and append a counter if it does
  // Need to cast prisma.listingBusiness to <any> to satisfy type constraints for findUnique with where on a non-ID field if not explicitly indexed in client generation
  // This is a common workaround if Prisma client generation doesn't perfectly type dynamic where clauses on non-unique-by-default fields before they are indexed.
  // However, 'slug' IS @unique, so this direct approach should work. If not, a more specific type for the where clause might be needed.
  while (await (prisma.listingBusiness as any).findUnique({ where: { slug: uniqueSlug } })) {
    counter++;
    uniqueSlug = `${slug}-${counter}`;
  }

  return uniqueSlug;
}
