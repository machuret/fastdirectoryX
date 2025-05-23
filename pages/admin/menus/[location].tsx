import { useRouter } from 'next/router';
import React, { useState, useEffect, FormEvent } from 'react';
import Head from 'next/head';

// Interface for MenuItem with potential children for rendering
interface DisplayMenuItem {
  id: string;
  label: string;
  url: string;
  order: number;
  target: string | null;
  parentId: string | null;
  menuId: string;
  createdAt: string;
  updatedAt: string;
  children?: DisplayMenuItem[];
}

// Interface for the form data
interface MenuItemFormData {
  id?: string;
  label: string;
  url: string;
  order: number;
  target: string;
  parentId: string | null;
}

const ManageMenuLocationPage = () => {
  const router = useRouter();
  const { location } = router.query as { location: string };

  const [menuItems, setMenuItems] = useState<DisplayMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<MenuItemFormData>({
    label: '',
    url: '',
    order: 0,
    target: '_self',
    parentId: null,
  });
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const fetchMenuItems = async () => {
    if (!location) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/menus/${location}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch menu items: ${response.status}`);
      }
      const data: DisplayMenuItem[] = await response.json();
      const itemMap = new Map<string, DisplayMenuItem>();
      const roots: DisplayMenuItem[] = [];

      data.forEach(item => {
        const displayItem = { ...item, children: [] };
        itemMap.set(item.id, displayItem);
      });

      data.forEach(item => {
        if (item.parentId && itemMap.has(item.parentId)) {
          itemMap.get(item.parentId)?.children?.push(itemMap.get(item.id)!);
        } else {
          roots.push(itemMap.get(item.id)!);
        }
      });

      roots.forEach(root => sortChildrenRecursive(root));
      itemMap.forEach(item => sortChildrenRecursive(item));

      setMenuItems(roots);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setMenuItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sortChildrenRecursive = (item: DisplayMenuItem) => {
    if (item.children && item.children.length > 0) {
      item.children.sort((a, b) => a.order - b.order);
      item.children.forEach(sortChildrenRecursive);
    }
  };

  useEffect(() => {
    if (location) {
      fetchMenuItems();
    }
  }, [location]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'order' ? parseInt(value, 10) : value,
    }));
  };

  const resetForm = () => {
    setFormData({ label: '', url: '', order: 0, target: '_self', parentId: null });
    setIsEditing(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!location) return;

    const apiUrl = isEditing
      ? `/api/admin/menus/items/${isEditing}`
      : `/api/admin/menus/${location}`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const { id, ...submitData } = formData;
      const body = isEditing ? submitData : formData;

      const response = await fetch(apiUrl, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} menu item`);
      }

      fetchMenuItems();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (item: DisplayMenuItem) => {
    setIsEditing(item.id);
    setFormData({
      id: item.id,
      label: item.label,
      url: item.url,
      order: item.order,
      target: item.target || '_self',
      parentId: item.parentId || null,
    });
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item? This may also delete sub-items.')) return;
    try {
      const response = await fetch(`/api/admin/menus/items/${itemId}`, {
        method: 'DELETE',
      });
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete menu item');
      }
      fetchMenuItems();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const pageTitle = location ? `${location.charAt(0).toUpperCase() + location.slice(1)} Menu Management` : 'Menu Management';

  const renderMenuItems = (items: DisplayMenuItem[], level = 0) => {
    return (
      <ul style={{ listStyleType: 'none', paddingLeft: `${level * 20}px` }}>
        {items.map(item => (
          <li key={item.id} style={{ border: '1px solid #eee', margin: '5px', padding: '10px' }}>
            <div>
              <strong>{item.label}</strong> ({item.url}) - Order: {item.order} {item.target && item.target !== '_self' ? `(Target: ${item.target})` : ''}
            </div>
            <button onClick={() => handleEdit(item)} style={{ marginRight: '5px' }}>Edit</button>
            <button onClick={() => handleDelete(item.id)}>Delete</button>
            {item.children && item.children.length > 0 && renderMenuItems(item.children, level + 1)}
          </li>
        ))}
      </ul>
    );
  };

  const getParentOptions = (currentItemId?: string): DisplayMenuItem[] => {
    const allItemsFlat: DisplayMenuItem[] = [];
    const addItemsRecursive = (items: DisplayMenuItem[]) => {
      items.forEach(item => {
        allItemsFlat.push(item);
        if (item.children) addItemsRecursive(item.children);
      });
    };
    addItemsRecursive(menuItems);

    if (!currentItemId) return allItemsFlat;

    const descendants = new Set<string>();
    const findDescendants = (id: string) => {
      const item = allItemsFlat.find(i => i.id === id);
      if (item) {
        descendants.add(item.id);
        item.children?.forEach(child => findDescendants(child.id));
      }
    };
    findDescendants(currentItemId);

    return allItemsFlat.filter(item => !descendants.has(item.id));
  };

  if (!location) return <div>Loading location...</div>;
  if (isLoading) return <div>Loading menu items...</div>;
  if (error && !menuItems.length) return <div>Error: {error} <button onClick={fetchMenuItems}>Retry</button></div>;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <div style={{ padding: '20px' }}>
        <h1>{pageTitle}</h1>

        {error && <p style={{ color: 'red' }}>An error occurred: {error}</p>}

        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc' }}>
          <h2>{isEditing ? 'Edit' : 'Add New'} Menu Item</h2>
          <input type="hidden" name="id" value={formData.id || ''} />
          <div>
            <label htmlFor="label">Label:</label>
            <input type="text" id="label" name="label" value={formData.label} onChange={handleInputChange} required />
          </div>
          <div>
            <label htmlFor="url">URL:</label>
            <input type="text" id="url" name="url" value={formData.url} onChange={handleInputChange} required />
          </div>
          <div>
            <label htmlFor="order">Order:</label>
            <input type="number" id="order" name="order" value={formData.order} onChange={handleInputChange} required />
          </div>
          <div>
            <label htmlFor="target">Target:</label>
            <select name="target" id="target" value={formData.target || '_self'} onChange={handleInputChange}>
              <option value="_self">Self</option>
              <option value="_blank">Blank (New Tab)</option>
            </select>
          </div>
          <div>
            <label htmlFor="parentId">Parent Item:</label>
            <select name="parentId" id="parentId" value={formData.parentId || ''} onChange={handleInputChange}>
              <option value="">None (Root Item)</option>
              {getParentOptions(isEditing || undefined).map(item => (
                <option key={item.id} value={item.id}>{item.label} (ID: {item.id.substring(0, 8)})</option>
              ))}
            </select>
          </div>
          <button type="submit">{isEditing ? 'Update Item' : 'Add Item'}</button>
          {isEditing && <button type="button" onClick={resetForm} style={{ marginLeft: '10px' }}>Cancel Edit</button>}
        </form>

        <h2>Existing Menu Items</h2>
        {menuItems.length === 0 && !isLoading && <p>No menu items found for this location.</p>}
        {renderMenuItems(menuItems)}
      </div>
    </>
  );
};

export default ManageMenuLocationPage;
