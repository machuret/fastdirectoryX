import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, ListOrdered, AlertCircle, Loader2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot
} from 'react-beautiful-dnd';

interface MenuItem {
  id: string;
  label: string;
  url: string;
  order: number;
  target: string | null;
  parentId: string | null;
  location: 'header' | 'footer';
}

interface MenuItemFormData {
  id?: string;
  label: string;
  url: string;
  target: string;
  parentId: string | null;
}

const AdminMenuManagementPage = () => {
  const [headerMenuItems, setHeaderMenuItems] = useState<MenuItem[]>([]);
  const [footerMenuItems, setFooterMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingHeader, setIsLoadingHeader] = useState(true);
  const [isLoadingFooter, setIsLoadingFooter] = useState(true);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [errorFooter, setErrorFooter] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'header' | 'footer'>('header');

  const [showFormDialog, setShowFormDialog] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<MenuItemFormData>({
    label: '',
    url: '',
    target: '_self',
    parentId: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reorder = (list: MenuItem[], startIndex: number, endIndex: number): MenuItem[] => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result.map((item, index) => ({ ...item, order: index })); // Update order based on new position
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    const location = source.droppableId as 'header' | 'footer';

    if (location === 'header') {
      const reorderedItems = reorder(
        headerMenuItems,
        source.index,
        destination.index
      );
      setHeaderMenuItems(reorderedItems);
      handleReorder('header', reorderedItems); // Call API to save order
    } else if (location === 'footer') {
      const reorderedItems = reorder(
        footerMenuItems,
        source.index,
        destination.index
      );
      setFooterMenuItems(reorderedItems);
      handleReorder('footer', reorderedItems); // Call API to save order
    }
  };

  const fetchMenuItemsForLocation = async (location: 'header' | 'footer') => {
    if (location === 'header') setIsLoadingHeader(true);
    if (location === 'footer') setIsLoadingFooter(true);

    try {
      const response = await fetch(`/api/admin/menus/${location}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch ${location} menu items`);
      }
      const data: MenuItem[] = (await response.json()).map((item: any) => ({ ...item, location }));
      data.sort((a, b) => a.order - b.order);

      if (location === 'header') {
        setHeaderMenuItems(data);
        setErrorHeader(null);
      } else {
        setFooterMenuItems(data);
        setErrorFooter(null);
      }
    } catch (err: any) {
      toast.error(`Error loading ${location} items`, { description: err.message });
      if (location === 'header') setErrorHeader(err.message);
      if (location === 'footer') setErrorFooter(err.message);
    } finally {
      if (location === 'header') setIsLoadingHeader(false);
      if (location === 'footer') setIsLoadingFooter(false);
    }
  };

  useEffect(() => {
    fetchMenuItemsForLocation('header');
    fetchMenuItemsForLocation('footer');
  }, []);

  const resetForm = () => {
    setFormData({ label: '', url: '', target: '_self', parentId: null });
    setIsEditing(null);
    setShowFormDialog(false);
    setIsSubmitting(false);
  };

  const handleEdit = (item: MenuItem) => {
    setIsEditing(item.id);
    setFormData({
      id: item.id,
      label: item.label,
      url: item.url,
      target: item.target || '_self',
      parentId: item.parentId || null,
    });
    setShowFormDialog(true);
  };

  const handleDelete = async (itemId: string, itemLocation: 'header' | 'footer') => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const response = await fetch(`/api/admin/menus/items/${itemId}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete menu item');
      }
      toast.success('Menu item deleted successfully!');
      fetchMenuItemsForLocation(itemLocation);
      window.location.reload(); // Force reload
    } catch (err: any) {
      toast.error('Error deleting menu item', { description: err.message });
      console.error('Delete error:', err);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const currentOrder = activeTab === 'header' ? headerMenuItems.length : footerMenuItems.length;
    const dataToSubmit = {
      ...formData,
      location: activeTab,
      order: isEditing ? headerMenuItems.find(item => item.id === isEditing)?.order ?? footerMenuItems.find(item => item.id === isEditing)?.order ?? currentOrder : currentOrder,
    };

    const apiUrl = isEditing ? `/api/admin/menus/items/${isEditing}` : `/api/admin/menus/${activeTab}`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(apiUrl, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSubmit) });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} menu item`);
      }
      toast.success(`Menu item ${isEditing ? 'updated' : 'created'} successfully!`);
      fetchMenuItemsForLocation(activeTab);
      resetForm();
      window.location.reload(); // Force reload
    } catch (err: any) {
      toast.error(`Error ${isEditing ? 'updating' : 'creating'} menu item`, { description: err.message });
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReorder = async (location: 'header' | 'footer', orderedItems: MenuItem[]) => {
    const itemsToUpdate = orderedItems.map(item => ({ id: item.id, order: item.order }));
    try {
      const response = await fetch(`/api/admin/menus/${location}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToUpdate }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reorder items');
      }
      toast.success(`${location.charAt(0).toUpperCase() + location.slice(1)} menu items reordered successfully!`);
      // No local fetchMenuItemsForLocation here, but the server cache is cleared.
      // Reload to get fresh data everywhere.
      window.location.reload(); // Force reload
    } catch (err: any) {
      toast.error(`Error reordering ${location} items`, { description: err.message });
      // Optionally, refetch to revert optimistic update on error
      fetchMenuItemsForLocation(location);
    }
  };

  const renderMenuItems = (items: MenuItem[], location: 'header' | 'footer', isLoading: boolean, error: string | null) => {
    if (isLoading) return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading items...</span></div>;
    if (error) return <div className="text-red-500 p-4 bg-red-50 rounded-md flex items-center"><AlertCircle className="h-5 w-5 mr-2" /> Error: {error}</div>;
    if (items.length === 0) return <p className="text-center text-gray-500 py-4">No menu items found for {location}. Add one below!</p>;

    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId={location}>
          {(provided: DroppableProvided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(providedDraggable: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                    <Card
                      ref={providedDraggable.innerRef}
                      {...providedDraggable.draggableProps}
                      className={`flex items-center justify-between p-3 hover:shadow-md transition-shadow ${snapshot.isDragging ? 'bg-primary/10 shadow-lg' : 'bg-card'}`}
                    >
                      <div className="flex items-center">
                        <div {...providedDraggable.dragHandleProps} className="p-2 cursor-grab mr-3 text-gray-400 hover:text-gray-600">
                          <GripVertical className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-primary-foreground">{item.label}</h4>
                          <p className="text-xs text-muted-foreground">{item.url} {item.target === '_blank' && '(New Tab)'}</p>
                        </div>
                      </div>
                      <div className="space-x-2 flex-shrink-0">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id, location)} className="h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  };

  return (
    <>
      <Head>
        <title>Manage Menu Items - Admin</title>
      </Head>
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Menu Item Management</h1>
          <Button onClick={() => { setIsEditing(null); setFormData({ label: '', url: '', target: '_self', parentId: null }); setShowFormDialog(true); }} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Item
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'header' | 'footer')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="header" className="py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              <ListOrdered className="mr-2 h-4 w-4" /> Header Menu Items
            </TabsTrigger>
            <TabsTrigger value="footer" className="py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              <ListOrdered className="mr-2 h-4 w-4" /> Footer Menu Items
            </TabsTrigger>
          </TabsList>
          <TabsContent value="header">
            <Card>
              <CardHeader>
                <CardTitle>Header Menu Items</CardTitle>
                <CardDescription>Drag and drop to reorder items. Click 'Add New Item' to create or select an item to edit/delete.</CardDescription>
              </CardHeader>
              <CardContent>
                {renderMenuItems(headerMenuItems, 'header', isLoadingHeader, errorHeader)}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="footer">
            <Card>
              <CardHeader>
                <CardTitle>Footer Menu Items</CardTitle>
                <CardDescription>Drag and drop to reorder items. Click 'Add New Item' to create or select an item to edit/delete.</CardDescription>
              </CardHeader>
              <CardContent>
                {renderMenuItems(footerMenuItems, 'footer', isLoadingFooter, errorFooter)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit' : 'Add New'} Menu Item</DialogTitle>
              <DialogDescription>
                Fill in the details for the menu item. This item will be added to the '{activeTab}' menu.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
              <div>
                <Label htmlFor="label" className="text-right">Label</Label>
                <Input id="label" value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} placeholder="e.g., Home" className="col-span-3" required />
              </div>
              <div>
                <Label htmlFor="url" className="text-right">URL</Label>
                <Input id="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="e.g., / or https://example.com" className="col-span-3" required />
              </div>
              <div>
                <Label htmlFor="target">Target</Label>
                <Select value={formData.target} onValueChange={(value) => setFormData({ ...formData, target: value })} >
                  <SelectTrigger id="target">
                    <SelectValue placeholder="Select target" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_self">Same Tab (_self)</SelectItem>
                    <SelectItem value="_blank">New Tab (_blank)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* TODO: Add Parent Item selector for submenus - requires fetching existing items for the current location */}
              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isEditing ? 'Save Changes' : 'Add Item'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default AdminMenuManagementPage;
