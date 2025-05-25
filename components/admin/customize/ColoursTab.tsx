import React, { useEffect, useState, useCallback } from 'react';
import type { ColorSettingData } from '@/pages/api/admin/customize/colors';

interface GroupedColorSettings {
  [groupName: string]: ColorSettingData[];
}

// Helper to ensure a value is a valid hex color, falling back to defaultValue or a final default
const getValidColor = (value: string | undefined | null, defaultValue: string | undefined | null, finalDefault = '#000000'): string => {
  const isValidHex = (hex: string | undefined | null): boolean => !!hex && /^#[0-9A-Fa-f]{6}$/.test(hex);
  if (isValidHex(value)) return value!;
  if (isValidHex(defaultValue)) return defaultValue!;
  return finalDefault;
};

const ColoursTab = () => {
  const [settings, setSettings] = useState<Record<string, ColorSettingData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch('/api/admin/customize/colors');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch settings: ${response.statusText}`);
      }
      const rawData: Record<string, ColorSettingData> = await response.json();
      
      // Process rawData to ensure valid color values
      const processedSettings: Record<string, ColorSettingData> = {};
      Object.keys(rawData).forEach(key => {
        const setting = rawData[key];
        processedSettings[key] = {
          ...setting,
          value: getValidColor(setting.value, setting.defaultValue),
        };
      });
      setSettings(processedSettings);

    } catch (err: any) {
      setError(err.message);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleInputChange = (key: string, newValue: string) => {
    // Ensure the new value for the text input is also processed for validity if needed, 
    // or allow partial hex codes temporarily until blur/save.
    // For simplicity, we'll directly set it, assuming the color picker provides valid hex.
    // The text input might need more robust validation on its own (e.g., onBlur).
    setSettings(prevSettings => ({
      ...prevSettings,
      [key]: { ...prevSettings[key], value: newValue }, 
    }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const valuesToSave: Record<string, string> = {};
      Object.keys(settings).forEach(key => {
        // Ensure the value being saved is the current, potentially updated, valid color
        valuesToSave[key] = getValidColor(settings[key]?.value, settings[key]?.defaultValue);
      });

      const response = await fetch('/api/admin/customize/colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(valuesToSave),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save settings: ${response.statusText}`);
      }
      setSuccessMessage('Color settings saved successfully!');
      const cssLink = document.getElementById('dynamic-css-variables') as HTMLLinkElement;
      if (cssLink) {
        cssLink.href = `/api/css-variables?v=${new Date().getTime()}`;
      }
      // Optionally, re-fetch settings to ensure UI is perfectly in sync with DB after save
      // await fetchSettings(); 
    } catch (err: any) {
      setError(err.message);
    }
    setIsSaving(false);
  };

  // Derive groupedSettings directly from settings state for rendering
  const currentGroupedSettings: GroupedColorSettings = {};
  Object.values(settings).forEach(setting => {
    if (!setting) return;
    const group = setting.group || 'uncategorized';
    if (!currentGroupedSettings[group]) {
      currentGroupedSettings[group] = [];
    }
    currentGroupedSettings[group].push(setting);
  });

  if (isLoading) {
    return <p className="text-gray-600">Loading colour settings...</p>;
  }

  // Display a general error if loading failed and no settings are available
  if (error && Object.keys(settings).length === 0) {
    return <p className="text-red-600">Error loading settings: {error}</p>;
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-xl leading-6 font-semibold text-gray-900">
          Colour Customization
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Manage the colour scheme for various sections of your website. Click on the color box to pick a new color.
        </p>

        {/* Display non-critical errors (e.g., from save attempts) here */}
        {error && Object.keys(settings).length > 0 && 
          <p className="mt-4 text-sm text-red-600">Error: {error}</p>}
        {successMessage && <p className="mt-4 text-sm text-green-600">{successMessage}</p>}

        <form onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }} className="mt-6 space-y-8">
          {Object.entries(currentGroupedSettings)
            .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
            .map(([groupName, groupItems]) => (
            <div key={groupName} className="p-4 border border-gray-200 rounded-md">
              <h4 className="text-lg font-medium text-gray-800 mb-4 capitalize">{groupName}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                {groupItems.sort((a,b) => (a.label || '').localeCompare(b.label || '')).map((setting) => {
                  if (!setting) return null;
                  // The value for the inputs should directly be setting.value, which is now guaranteed to be a valid hex
                  const currentColorValue = setting.value; 
                  return (
                    <div key={setting.key}>
                      <label htmlFor={setting.key} className="block text-sm font-medium text-gray-700 mb-1">
                        {setting.label}
                      </label>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="color" 
                          id={setting.key} 
                          name={setting.key} 
                          value={currentColorValue} 
                          onChange={(e) => handleInputChange(setting.key, e.target.value)} 
                          className="h-12 w-12 p-0 border-gray-300 rounded-md shadow-sm cursor-pointer focus:ring-2 focus:ring-primary focus:border-primary" 
                        />
                        <input
                          type="text"
                          value={currentColorValue}
                          onChange={(e) => handleInputChange(setting.key, e.target.value)}
                          onBlur={(e) => {
                            const blurredValue = e.target.value;
                            if (!/^#[0-9A-Fa-f]{6}$/.test(blurredValue)) {
                              handleInputChange(setting.key, getValidColor(blurredValue, setting.defaultValue));
                            }
                          }}
                          className="ml-0 block w-32 h-10 px-3 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                          placeholder={setting.defaultValue || '#RRGGBB'}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-8 pt-5 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving || isLoading}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ColoursTab;
