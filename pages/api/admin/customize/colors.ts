import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, SiteSetting } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]'; // Adjust path if necessary

const prisma = new PrismaClient();

export interface ColorSettingData {
  key: string;
  value: string;
  label: string;
  group: string;
  type: 'color';
  defaultValue?: string;
}

export const colorSettingDefinitions: Record<string, Omit<ColorSettingData, 'key' | 'value'> & { defaultValue: string }> = {
  // General / Site-wide
  'color_header_bg': { label: 'Header Menu Background', group: 'General', type: 'color', defaultValue: '#1A1F2C' },
  'color_header_font': { label: 'Header Menu Font', group: 'General', type: 'color', defaultValue: '#FFFFFF' },
  'color_footer_bg': { label: 'Footer Background', group: 'General', type: 'color', defaultValue: '#F8F8F8' },
  'color_footer_font': { label: 'Footer Font', group: 'General', type: 'color', defaultValue: '#0A0A0A' },
  'color_category_icon_bg': { label: 'Category Icon Background (Homepage Listing Cards)', group: 'General', type: 'color', defaultValue: '#E9ECEF' },

  // Homepage - Hero Section
  'color_homepage_hero_bg': { label: 'Hero Section Background', group: 'Homepage Hero', type: 'color', defaultValue: '#007BFF' },
  'color_homepage_hero_title_font': { label: 'Hero Title Font', group: 'Homepage Hero', type: 'color', defaultValue: '#FFFFFF' },
  'color_homepage_hero_subtitle_font': { label: 'Hero Subtitle Font', group: 'Homepage Hero', type: 'color', defaultValue: '#F0F0F0' },
  'color_homepage_hero_search_btn_bg': { label: 'Hero Search Button Background', group: 'Homepage Hero', type: 'color', defaultValue: '#28A745' },
  'color_homepage_hero_search_btn_font': { label: 'Hero Search Button Font/Icon', group: 'Homepage Hero', type: 'color', defaultValue: '#FFFFFF' },
  'color_homepage_hero_browse_all_btn_bg': { label: 'Hero "Browse All" Button Background', group: 'Homepage Hero', type: 'color', defaultValue: '#17A2B8' },
  'color_homepage_hero_browse_all_btn_font': { label: 'Hero "Browse All" Button Font', group: 'Homepage Hero', type: 'color', defaultValue: '#FFFFFF' },

  // Homepage - Listing Filters
  'color_homepage_filter_btn_bg': { label: 'Filter Buttons Background', group: 'Homepage Filters', type: 'color', defaultValue: '#6C757D' },
  'color_homepage_filter_btn_font': { label: 'Filter Buttons Font', group: 'Homepage Filters', type: 'color', defaultValue: '#FFFFFF' },

  // Homepage - Listing Cards
  'color_homepage_listing_card_bg': { label: 'Listing Card Background', group: 'Homepage Listing Cards', type: 'color', defaultValue: '#FFFFFF' },
  'color_homepage_listing_card_category_btn_bg': { label: 'Listing Card Category Button Background', group: 'Homepage Listing Cards', type: 'color', defaultValue: '#E9ECEF' },
  'color_homepage_listing_card_category_btn_font': { label: 'Listing Card Category Button Font', group: 'Homepage Listing Cards', type: 'color', defaultValue: '#495057' },
  
  // Homepage - Call to Action (CTA) Section
  'color_homepage_cta_bg': { label: 'CTA Background', group: 'Homepage CTA', type: 'color', defaultValue: '#343A40' },
  'color_homepage_cta_sub_bg': { label: 'CTA Sub-Background', group: 'Homepage CTA', type: 'color', defaultValue: '#212529' },
  'color_homepage_cta_title_font': { label: 'CTA Title Font', group: 'Homepage CTA', type: 'color', defaultValue: '#FFFFFF' },
  'color_homepage_cta_subtitle_font': { label: 'CTA Subtitle Font', group: 'Homepage CTA', type: 'color', defaultValue: '#F8F9FA' },
  'color_homepage_cta_btn_bg': { label: 'CTA Button Background', group: 'Homepage CTA', type: 'color', defaultValue: '#007BFF' },
  'color_homepage_cta_btn_font': { label: 'CTA Button Font', group: 'Homepage CTA', type: 'color', defaultValue: '#FFFFFF' },

  // Listings Page (Individual Listing Detail)
  'color_listing_actions_btn_bg': { label: 'Actions Buttons Background', group: 'Listing Detail Page', type: 'color', defaultValue: '#007BFF' },
  'color_listing_actions_btn_font': { label: 'Actions Buttons Font/Icon', group: 'Listing Detail Page', type: 'color', defaultValue: '#FFFFFF' },
  'color_listing_other_listings_section_bg': { label: '"Other Listings" Section Background', group: 'Listing Detail Page', type: 'color', defaultValue: '#F8F9FA' },
  'color_listing_claim_section_bg': { label: '"Own this Business?" Section Background', group: 'Listing Detail Page', type: 'color', defaultValue: '#E9ECEF' },
  'color_listing_claim_section_title_font': { label: '"Own this Business?" Title Font', group: 'Listing Detail Page', type: 'color', defaultValue: '#212529' },
  'color_listing_claim_section_content_font': { label: '"Own this Business?" Content Font', group: 'Listing Detail Page', type: 'color', defaultValue: '#495057' },
  'color_listing_claim_btn_bg': { label: '"Claim this Business" Button Background', group: 'Listing Detail Page', type: 'color', defaultValue: '#28A745' },
  'color_listing_claim_btn_font': { label: '"Claim this Business" Button Font', group: 'Listing Detail Page', type: 'color', defaultValue: '#FFFFFF' },

  // Categories Page
  'color_categories_page_category_btn_bg': { label: 'Category Buttons Background', group: 'Category Page', type: 'color', defaultValue: '#007BFF' },
  'color_categories_page_category_btn_font': { label: 'Category Buttons Font', group: 'Category Page', type: 'color', defaultValue: '#FFFFFF' },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Access denied.' });
  }

  if (req.method === 'GET') {
    try {
      const dbSettings = await prisma.siteSetting.findMany({
        where: {
          key: {
            startsWith: 'color_',
          },
        },
      });

      const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));
      const allColorSettings: Record<string, ColorSettingData> = {};

      for (const key in colorSettingDefinitions) {
        if (Object.prototype.hasOwnProperty.call(colorSettingDefinitions, key)) {
          const definition = colorSettingDefinitions[key];
          allColorSettings[key] = {
            key: key,
            value: (settingsMap.get(key) as string | undefined) ?? definition.defaultValue,
            label: definition.label,
            group: definition.group,
            type: definition.type,
          };
        }
      }
      return res.status(200).json(allColorSettings);
    } catch (error) {
      console.error('Error fetching color settings:', error);
      return res.status(500).json({ message: 'Failed to fetch color settings' });
    }
  } else if (req.method === 'POST') {
    try {
      const updates: Record<string, string> = req.body;
      const operations = [];

      for (const key in updates) {
        if (Object.prototype.hasOwnProperty.call(updates, key) && colorSettingDefinitions[key]) {
          const value = updates[key];
          const definition = colorSettingDefinitions[key];
          
          operations.push(
            prisma.siteSetting.upsert({
              where: { key: key },
              update: { value: value },
              create: {
                key: key,
                value: value,
                label: definition.label,
                group: definition.group,
                type: definition.type,
              },
            })
          );
        }
      }

      await prisma.$transaction(operations);
      return res.status(200).json({ message: 'Color settings updated successfully.' });
    } catch (error) {
      console.error('Error updating color settings:', error);
      return res.status(500).json({ message: 'Failed to update color settings' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
