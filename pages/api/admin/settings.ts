import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import withAdminAuth from '@/hoc/withAdminAuth'; 

interface SiteSettingData {
  key: string;
  value: string | null;
  label?: string;
  group?: string;
  type?: string;
}

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
