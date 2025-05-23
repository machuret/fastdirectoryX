import { GetServerSideProps } from 'next';
import type { NextPageWithLayout, MyAppPageProps } from '@/pages/_app';
import AdminLayout from '@/components/admin/AdminLayout';
import { useEffect, useState } from 'react';
import { PartnerLogo } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image'; 
import { ImageIcon } from 'lucide-react'; 
import prisma from '@/lib/prisma'; 

interface AdminPartnerLogosPageProps {
  initialLogos: PartnerLogo[];
}

const AdminPartnerLogosPage: NextPageWithLayout<AdminPartnerLogosPageProps> = ({ initialLogos }) => {
  const [logos, setLogos] = useState<PartnerLogo[]>(initialLogos);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [newLogoData, setNewLogoData] = useState<{
    name: string;
    imageUrl: string;
    linkUrl?: string;
    order: number;
    isVisible: boolean;
  }>({ name: '', imageUrl: '', order: 0, isVisible: true });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [editingLogo, setEditingLogo] = useState<PartnerLogo | null>(null);
  const [editLogoData, setEditLogoData] = useState<Partial<PartnerLogo>>({});

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [logoToDelete, setLogoToDelete] = useState<PartnerLogo | null>(null);

  const { toast } = useToast();

  const fetchLogos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/partner-logos');
      if (!response.ok) {
        throw new Error('Failed to fetch logos');
      }
      const data: PartnerLogo[] = await response.json();
      setLogos(data);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error fetching logos',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handleAddNewLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/partner-logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLogoData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add logo');
      }
      toast({
        title: 'Success!',
        description: 'New partner logo added successfully.',
      });
      setIsAddDialogOpen(false);
      fetchLogos(); 
      setNewLogoData({ name: '', imageUrl: '', order: 0, isVisible: true }); 
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error adding logo',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleOpenEditDialog = (logo: PartnerLogo) => {
    setEditingLogo(logo);
    setEditLogoData({
      name: logo.name,
      imageUrl: logo.imageUrl,
      linkUrl: logo.linkUrl,
      order: logo.order,
      isVisible: logo.isVisible,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLogo) return;

    try {
      const response = await fetch(`/api/admin/partner-logos/${editingLogo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editLogoData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update logo');
      }
      toast({
        title: 'Success!',
        description: 'Partner logo updated successfully.',
      });
      setIsEditDialogOpen(false);
      fetchLogos(); 
      setEditingLogo(null);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error updating logo',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleOpenDeleteDialog = (logo: PartnerLogo) => {
    setLogoToDelete(logo);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteLogo = async () => {
    if (!logoToDelete) return;

    try {
      const response = await fetch(`/api/admin/partner-logos/${logoToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok && response.status !== 204) { 
        const errorData = await response.json().catch(() => ({})); 
        throw new Error(errorData.message || 'Failed to delete logo');
      }
      toast({
        title: 'Success!',
        description: 'Partner logo deleted successfully.',
      });
      setIsDeleteDialogOpen(false);
      fetchLogos(); 
      setLogoToDelete(null);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error deleting logo',
        description: (error as Error).message,
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false); 
      setLogoToDelete(null);
    }
  };

  return (
    <>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add New Logo</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Partner Logo</DialogTitle>
                <DialogDescription>
                  Fill in the details for the new partner logo.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddNewLogo}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newLogoData.name}
                      onChange={(e) => setNewLogoData({ ...newLogoData, name: e.target.value })}
                      className="col-span-3 bg-white text-black"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="imageUrl" className="text-right">
                      Image URL
                    </Label>
                    <Input
                      id="imageUrl"
                      value={newLogoData.imageUrl}
                      onChange={(e) => setNewLogoData({ ...newLogoData, imageUrl: e.target.value })}
                      className="col-span-3 bg-white text-black"
                      required
                      type="url"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="linkUrl" className="text-right">
                      Link URL (Optional)
                    </Label>
                    <Input
                      id="linkUrl"
                      value={newLogoData.linkUrl || ''}
                      onChange={(e) => setNewLogoData({ ...newLogoData, linkUrl: e.target.value })}
                      className="col-span-3 bg-white text-black"
                      type="url"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="order" className="text-right">
                      Order
                    </Label>
                    <Input
                      id="order"
                      type="number"
                      value={newLogoData.order}
                      onChange={(e) => setNewLogoData({ ...newLogoData, order: parseInt(e.target.value, 10) || 0 })}
                      className="col-span-3 bg-white text-black"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="isVisible" className="text-right">
                      Visible
                    </Label>
                    <Switch
                      id="isVisible"
                      checked={newLogoData.isVisible}
                      onCheckedChange={(checked) => setNewLogoData({ ...newLogoData, isVisible: checked })}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Add Logo</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {editingLogo && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Partner Logo</DialogTitle>
                <DialogDescription>
                  Update the details for the partner logo.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditLogo}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="edit-name"
                      value={editLogoData.name || ''}
                      onChange={(e) => setEditLogoData({ ...editLogoData, name: e.target.value })}
                      className="col-span-3 bg-white text-black"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-imageUrl" className="text-right">
                      Image URL
                    </Label>
                    <Input
                      id="edit-imageUrl"
                      value={editLogoData.imageUrl || ''}
                      onChange={(e) => setEditLogoData({ ...editLogoData, imageUrl: e.target.value })}
                      className="col-span-3 bg-white text-black"
                      required
                      type="url"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-linkUrl" className="text-right">
                      Link URL
                    </Label>
                    <Input
                      id="edit-linkUrl"
                      value={editLogoData.linkUrl || ''}
                      onChange={(e) => setEditLogoData({ ...editLogoData, linkUrl: e.target.value })}
                      className="col-span-3 bg-white text-black"
                      type="url"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-order" className="text-right">
                      Order
                    </Label>
                    <Input
                      id="edit-order"
                      type="number"
                      value={editLogoData.order === undefined ? '' : editLogoData.order}
                      onChange={(e) => setEditLogoData({ ...editLogoData, order: parseInt(e.target.value, 10) || 0 })}
                      className="col-span-3 bg-white text-black"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-isVisible" className="text-right">
                      Visible
                    </Label>
                    <Switch
                      id="edit-isVisible"
                      checked={editLogoData.isVisible}
                      onCheckedChange={(checked) => setEditLogoData({ ...editLogoData, isVisible: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                   <DialogClose asChild>
                      <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {logoToDelete && (
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the logo
                    <span className="font-semibold"> {logoToDelete.name}</span>.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setLogoToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteLogo}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
        )}

        {isLoading ? (
          <p>Loading logos...</p>
        ) : logos.length === 0 ? (
          <p>No partner logos found. Add one to get started!</p>
        ) : (
          <Table>
            <TableCaption>A list of your current partner logos.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Link URL</TableHead>
                <TableHead className="text-center">Order</TableHead>
                <TableHead className="text-center">Visible</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logos.map((logo) => (
                <TableRow key={logo.id}>
                  <TableCell>
                    {logo.imageUrl && (
                      <Image 
                        src={logo.imageUrl} 
                        alt={logo.name} 
                        width={80} 
                        height={40} 
                        objectFit="contain" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{logo.name}</TableCell>
                  <TableCell>
                    {logo.linkUrl ? (
                        <a href={logo.linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {logo.linkUrl}
                        </a>
                    ) : 'N/A'}
                    </TableCell>
                  <TableCell className="text-center">{logo.order}</TableCell>
                  <TableCell className="text-center">{logo.isVisible ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => handleOpenEditDialog(logo)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleOpenDeleteDialog(logo)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<AdminPartnerLogosPageProps> = async (context) => {
  try {
    const logos = await prisma.partnerLogo.findMany({
      orderBy: { order: 'asc' }, 
    });
    return {
      props: { 
        initialLogos: logos.map(logo => ({ 
          ...logo,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching logos in getServerSideProps: ", error);
    return {
      props: { initialLogos: [], error: 'Failed to load logos.' },
    };
  }
};

AdminPartnerLogosPage.getLayout = function getLayout(page: React.ReactElement, pageProps: MyAppPageProps) {
  return (
    <AdminLayout pageTitle="Logo Management" headerMenuItems={pageProps.headerMenuItems} footerMenuItems={pageProps.footerMenuItems}>
      {page}
    </AdminLayout>
  );
};

export default AdminPartnerLogosPage;
