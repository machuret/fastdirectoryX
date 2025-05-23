import React, { useEffect, useState } from 'react';
import Link from 'next/link'; 
import type { GetServerSideProps } from 'next';

interface Page {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  updatedAt: string;
}

const AdminPagesCMS = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/pages');
        if (!response.ok) {
          throw new Error(`Failed to fetch pages: ${response.statusText}`);
        }
        const data = await response.json();
        setPages(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  const handleDelete = async (slug: string) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      try {
        const response = await fetch(`/api/admin/pages/${slug}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Failed to delete page: ${response.statusText}`);
        }
        setPages(pages.filter(page => page.slug !== slug)); 
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  if (loading) return <p>Loading pages...</p>; 
  if (error) return <p>Error loading pages: {error}</p>;

  return (
    <>
      <h1>Manage Pages</h1>
      <Link href="/admin/pages-cms/new" legacyBehavior>
        <a style={{ marginBottom: '20px', display: 'inline-block', padding: '10px 15px', backgroundColor: 'blue', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          Add New Page
        </a>
      </Link>
      
      {pages.length === 0 ? (
        <p>No pages found. Create your first page!</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Title</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Slug</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Last Updated</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{page.title}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{page.slug}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{page.isPublished ? 'Published' : 'Draft'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(page.updatedAt).toLocaleDateString()}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <Link href={`/${page.slug}`} legacyBehavior>
                    <a style={{ marginRight: '10px' }} target="_blank" rel="noopener noreferrer">View</a>
                  </Link>
                  <Link href={`/admin/pages-cms/edit/${page.slug}`} legacyBehavior>
                    <a style={{ marginRight: '10px' }}>Edit</a>
                  </Link>
                  <button onClick={() => handleDelete(page.slug)} style={{ color: 'red', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      pageTitle: 'Manage Pages',
      pageIconName: 'FileText', 
    },
  };
};

export default AdminPagesCMS;
