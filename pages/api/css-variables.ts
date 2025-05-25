import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { colorSettingDefinitions } from './admin/customize/colors'; // Adjust path if necessary

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const dbSettings = await prisma.siteSetting.findMany({
      where: {
        key: {
          startsWith: 'color_',
        },
      },
    });

    const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));
    let cssVariables = ':root {\n';

    for (const key in colorSettingDefinitions) {
      if (Object.prototype.hasOwnProperty.call(colorSettingDefinitions, key)) {
        const definition = colorSettingDefinitions[key];
        const value = settingsMap.get(key) ?? definition.defaultValue;
        // CSS variable names usually use dashes instead of underscores
        const cssVarName = key.replace(/^color_/, '').replace(/_/g, '-');
        cssVariables += `  --${cssVarName}: ${value};\n`;
      }
    }

    cssVariables += '}';

    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60'); // Cache for 1 minute
    res.status(200).send(cssVariables);

  } catch (error) {
    console.error('Error generating CSS variables:', error);
    // Fallback to default variables or an empty :root to prevent site breaking
    let fallbackCss = ':root {\n';
    for (const key in colorSettingDefinitions) {
      if (Object.prototype.hasOwnProperty.call(colorSettingDefinitions, key)) {
        const definition = colorSettingDefinitions[key];
        const cssVarName = key.replace(/^color_/, '').replace(/_/g, '-');
        fallbackCss += `  --${cssVarName}: ${definition.defaultValue};\n`;
      }
    }
    fallbackCss += '}';
    res.setHeader('Content-Type', 'text/css');
    res.status(500).send(fallbackCss); // Send defaults on error
  }
}
