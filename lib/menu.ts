// c:\\alpha\\lib\\menu.ts
import prisma from './prisma'; // Assuming prisma client is at lib/prisma.ts
import { MenuItem as PrismaMenuItem } from '@prisma/client';

// Interface for frontend display, ensuring dates are strings
export interface DisplayMenuItemFE extends Omit<PrismaMenuItem, 'createdAt' | 'updatedAt' | 'menu' | 'parent' | 'children'> {
  createdAt: string;
  updatedAt: string;
  children: DisplayMenuItemFE[]; // Explicitly type children
  menu_group?: string; // Made optional
}

// Simple in-memory cache
interface CacheEntry {
  data: DisplayMenuItemFE[];
  timestamp: number;
}
const menuCache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Function to clear cache for a specific location
export function clearMenuCacheForLocation(location: string): void {
  if (menuCache.has(location)) {
    menuCache.delete(location);
    console.log(`[Cache CLEARED] Cleared cache for menu location: ${location}`);
  } else {
    console.log(`[Cache INFO] No cache to clear for menu location: ${location}`);
  }
}

// Function to clear all menu caches
export function clearAllMenuCaches(): void {
  if (menuCache.size > 0) {
    menuCache.clear();
    console.log(`[Cache CLEARED] All menu caches cleared. Count: ${menuCache.size} (should be 0 after clear)`);
  } else {
    console.log(`[Cache INFO] No menu caches to clear.`);
  }
}

function serializeMenuItem(item: PrismaMenuItem): Omit<PrismaMenuItem, 'createdAt' | 'updatedAt' | 'menu' | 'parent' | 'children'> & { createdAt: string; updatedAt: string; menu_group?: string; } {
  return {
    ...item, // If menu_group is added to PrismaMenuItem later, it will be spread here
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    // menu_group is not explicitly set here anymore as it's not on PrismaMenuItem
    // If it were, it would be: menu_group: item.menu_group
  };
}

export async function getMenuItemsForLocation(location: string): Promise<DisplayMenuItemFE[]> {
  const cachedEntry = menuCache.get(location);
  if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_DURATION_MS)) {
    // console.log(`[Cache HIT] Serving menu for location: ${location}`);
    return JSON.parse(JSON.stringify(cachedEntry.data)); // Return a deep copy to prevent accidental mutation of cached data
  }
  // console.log(`[Cache MISS] Fetching menu from DB for location: ${location}`);

  const menuWithItems = await prisma.menu.findUnique({
    where: { location },
    include: {
      items: { // Fetch all items for the menu
        orderBy: [
          { order: 'asc' }, // Primary sort by order
        ],
      },
    },
  });

  if (!menuWithItems || !menuWithItems.items || menuWithItems.items.length === 0) {
    return [];
  }

  const itemMap = new Map<string, DisplayMenuItemFE>();
  const roots: DisplayMenuItemFE[] = [];

  // Serialize and map all items, initializing children arrays
  menuWithItems.items.forEach((item: PrismaMenuItem) => { 
    const serializedItem = serializeMenuItem(item) as DisplayMenuItemFE; // Cast needed due to potential mismatch until schema is fixed
    itemMap.set(item.id, { ...serializedItem, children: [] });
  });

  // Build the hierarchy: assign children to their parents
  menuWithItems.items.forEach((item: PrismaMenuItem) => { 
    const displayItem = itemMap.get(item.id)!; 
    if (item.parentId && itemMap.has(item.parentId)) {
      const parentItem = itemMap.get(item.parentId)!;
      parentItem.children.push(displayItem); 
    } else {
      roots.push(displayItem); 
    }
  });

  const sortChildrenRecursive = (menuItem: DisplayMenuItemFE) => {
    if (menuItem.children && menuItem.children.length > 0) {
      menuItem.children.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); // Added nullish coalescing for order
      menuItem.children.forEach(sortChildrenRecursive); 
    }
  };

  roots.forEach(sortChildrenRecursive); 
  roots.sort((a,b) => (a.order ?? 0) - (b.order ?? 0)); // Added nullish coalescing for order

  // Update cache
  menuCache.set(location, { data: roots, timestamp: Date.now() });

  return roots;
}