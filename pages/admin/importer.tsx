import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner'; 

interface ImportReport {
  totalProcessed: number;
  listingsImported: number; 
  categoriesProcessed: number;
  openingHoursProcessed: number;
  photosImported: number;
  reviewsImported: number;
  errors: string[];
}

const ImporterPage = () => {
  const [jsonUrl, setJsonUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [report, setReport] = useState<ImportReport | null>(null);

  const handleImport = async () => {
    if (!jsonUrl) {
      toast.error('Please enter a JSON URL.');
      return;
    }

    setIsLoading(true);
    setReport(null);

    try {
      const response = await fetch('/api/admin/import-listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: jsonUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Import failed');
      }

      setReport(result.report);
      toast.success('Import process completed!');
    } catch (error: any) {
      console.error('Import error:', error.message, '\nStack:', error.stack);
      
      setReport({
        totalProcessed: 0,
        listingsImported: 0, 
        categoriesProcessed: 0,
        openingHoursProcessed: 0,
        photosImported: 0,
        reviewsImported: 0,
        errors: [error.message || 'An unexpected error occurred.'],
      });
      toast.error(error.message || 'An unexpected error occurred during import.');
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mass Import Listings</CardTitle>
          <CardDescription>
            Import business listings from a JSON data source URL (e.g., Apify dataset).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="jsonUrl" className="block text-sm font-medium text-gray-700 mb-1">
              JSON Data URL
            </label>
            <Input
              id="jsonUrl"
              type="url"
              value={jsonUrl}
              onChange={(e) => setJsonUrl(e.target.value)}
              placeholder="https://api.apify.com/v2/datasets/.../items?format=json"
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleImport} disabled={isLoading || !jsonUrl}>
            {isLoading ? 'Importing...' : 'Start Import'}
          </Button>
        </CardFooter>
      </Card>

      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Import Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>Total Listings Processed: {report.totalProcessed}</p>
            <p>Listings Imported (Created/Updated): {report.listingsImported}</p> 
            <p>Categories Processed (Created/Connected): {report.categoriesProcessed}</p>
            <p>Opening Hours Records Created: {report.openingHoursProcessed}</p>
            <p>Photos Imported (Main Image): {report.photosImported}</p>
            <p>Reviews Imported (Placeholder): {report.reviewsImported}</p>
            {report.errors.length > 0 && (
              <div>
                <h4 className="font-semibold mt-2">Errors:</h4>
                <ul className="list-disc list-inside text-red-600">
                  {report.errors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImporterPage;
