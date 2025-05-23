import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import withAdminAuth from '@/hoc/withAdminAuth'; 

/**
 * Interface representing the data structure for a single site setting.
 */
interface SiteSettingData {
  /** The unique key for the setting (e.g., 'siteName', 'maintenanceMode'). */
  key: string;
  /** The value of the setting. Can be null if the setting is not set. */
  value: string | null;
  /** An optional human-readable label for the setting (e.g., 'Site Name'). */
  label?: string;
  /** An optional group name to categorize the setting (e.g., 'General', 'Appearance'). */
  group?: string;
  /** An optional type hint for the setting's value (e.g., 'string', 'boolean', 'number'). */
  type?: string;
}

/**
 * API handler for managing site-wide settings.
 * Authentication and admin access are handled by the `withAdminAuth` higher-order component.
 *
 * @param {NextApiRequest} req The Next.js API request object.
 * @param {NextApiResponse} res The Next.js API response object.
 *
 * @route GET /api/admin/settings
 * @description Fetches all site settings.
 * @returns {Promise<void>} Responds with an array and an object representation of all settings.
 * @successResponse 200 OK - { settingsArray: SiteSettingData[], settingsObject: Record<string, string | null> }
 * @errorResponse 500 Internal Server Error - If an error occurs while fetching settings.
 *
 * @route POST /api/admin/settings
 * @description Saves/updates multiple site settings in a batch (upsert behavior).
 * @bodyParam {SiteSettingData[]} body - An array of setting objects to save.
 * @returns {Promise<void>} Responds with a success message and the saved settings data.
 * @successResponse 200 OK - { message: string, data: SiteSettingData[] } Settings saved successfully.
 * @errorResponse 400 Bad Request - If the request body is not an array of settings.
 * @errorResponse 500 Internal Server Error - If an error occurs while saving settings.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const settingsArray = await prisma.siteSetting.findMany({
        orderBy: { key: 'asc' }, // Optional: order by key or another field
      });

      // Transform into an object for easier access on the client if needed
      const settingsObject = settingsArray.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string | null>);

      res.status(200).json({ settingsArray, settingsObject });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: 'Error fetching settings', error: (error as Error).message });
    }
  } else if (req.method === 'POST') {
    try {
      const settingsToSave: SiteSettingData[] = req.body;

      if (!Array.isArray(settingsToSave)) {
        return res.status(400).json({ message: 'Invalid request body: Expected an array of settings.' });
      }

      const savedSettings = [];
      for (const setting of settingsToSave) {
        if (!setting.key) {
          // Skip if key is missing, or handle as an error
          console.warn('Skipping setting without a key:', setting);
          continue;
        }
        const upsertedSetting = await prisma.siteSetting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            label: setting.label, // Optional: update if provided
            group: setting.group, // Optional: update if provided
            type: setting.type,   // Optional: update if provided
          },
          create: {
            key: setting.key,
            value: setting.value,
            label: setting.label,
            group: setting.group,
            type: setting.type,
          },
        });
        savedSettings.push(upsertedSetting);
      }

      res.status(200).json({ message: 'Settings saved successfully', data: savedSettings });
    } catch (error) {
      console.error('Error saving settings:', error);
      res.status(500).json({ message: 'Error saving settings', error: (error as Error).message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAdminAuth(handler);
