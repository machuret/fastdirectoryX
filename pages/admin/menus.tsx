// c:\alpha\pages\admin\menus.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListTree, PlusCircle, Trash2, Edit3 } from 'lucide-react';
import { Menu as PrismaMenu } from '@prisma/client';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';

interface MenuManagementPageProps {
  pageTitle: string;
  pageDescription: string;
  pageIconName: string;
}

const MenuManagementPage: React.FC<MenuManagementPageProps> = (props) => {
  const [menus, setMenus] = useState<PrismaMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuLocation, setNewMenuLocation] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchMenus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/menus');
      if (!response.ok) {
        throw new Error('Failed to fetch menus');
      }
      const data = await response.json();
      setMenus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setMenus([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleAddMenu = async (e: FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!newMenuName.trim() || !newMenuLocation.trim()) {
      setAddError('Menu name and location are required.');
      return;
    }
    setIsAdding(true);
    try {
      const response = await fetch('/api/admin/menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newMenuName, location: newMenuLocation }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add menu');
      }
      setNewMenuName('');
      setNewMenuLocation('');
      fetchMenus(); // Refresh the list
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Menu</CardTitle>
          <CardDescription>Define a new menu by providing a name and a unique location identifier (e.g., 'HEADER', 'FOOTER_LEGAL').</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMenu} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="newMenuName" className="block text-sm font-medium text-gray-700 mb-1">Menu Name</label>
                <Input
                  id="newMenuName"
                  type="text"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  placeholder="e.g., Main Navigation"
                  disabled={isAdding}
                />
              </div>
              <div>
                <label htmlFor="newMenuLocation" className="block text-sm font-medium text-gray-700 mb-1">Menu Location (ID)</label>
                <Input
                  id="newMenuLocation"
                  type="text"
                  value={newMenuLocation}
                  onChange={(e) => setNewMenuLocation(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                  placeholder="e.g., PRIMARY_HEADER"
                  disabled={isAdding}
                />
              </div>
            </div>
            {addError && <p className="text-sm text-red-600">{addError}</p>}
            <Button type="submit" disabled={isAdding || !newMenuName.trim() || !newMenuLocation.trim()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {isAdding ? 'Adding...' : 'Add Menu'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Menus</CardTitle>
          <CardDescription>Manage items for the menus listed below.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading menus...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {!isLoading && !error && menus.length === 0 && (
            <p>No menus found. Create one above to get started.</p>
          )}
          {!isLoading && !error && menus.length > 0 && (
            <ul className="space-y-3">
              {menus.map((menu) => (
                <li key={menu.id} className="flex items-center justify-between p-4 border rounded-md shadow-sm bg-white">
                  <div>
                    <h3 className="text-lg font-semibold text-primary">{menu.name}</h3>
                    <p className="text-sm text-gray-500">Location: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{menu.location}</code></p>
                  </div>
                  <div className="space-x-2">
                    <Link href={`/admin/menus/items?location=${menu.location}`} passHref legacyBehavior>
                      <Button variant="outline" size="sm" asChild>
                        <a>
                          <Edit3 className="mr-2 h-4 w-4" /> Manage Items
                        </a>
                      </Button>
                    </Link>
                    <Button variant="destructive" size="sm" onClick={() => alert(`Delete ${menu.name}`)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Menu
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<MenuManagementPageProps> = async (context) => {
  return {
    props: {
      pageTitle: 'Menu Management',
      pageDescription: 'Create, edit, and manage navigation menus for your site.',
      pageIconName: 'ListTree',
    },
  };
};

export default MenuManagementPage;
