import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import RichTextEditor from '../../../../components/RichTextEditor'; // Adjust path as needed

interface PageData {
  title: string;
  slug: string; // The original slug for fetching, might change if user edits it
  content: string;
  isPublished: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

const EditPageCMS = () => {
  const router = useRouter();
  const { slug: currentSlug } = router.query; // Get the slug from the URL query

  const [pageData, setPageData] = useState<PageData | null>(null);
  const [title, setTitle] = useState('');
  const [newSlug, setNewSlug] = useState(''); // To handle potential slug changes
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentSlug && typeof currentSlug === 'string') {
      const fetchPage = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/admin/pages/${currentSlug}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to fetch page: ${response.statusText}`);
          }
          const data: PageData = await response.json();
          setPageData(data);
          setTitle(data.title);
          setNewSlug(data.slug); // Initialize newSlug with the current slug
          setContent(data.content);
          setIsPublished(data.isPublished);
          setMetaTitle(data.metaTitle || '');
          setMetaDescription(data.metaDescription || '');
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchPage();
    }
  }, [currentSlug]);

  const handleSlugGeneration = (value: string) => {
    const generated = value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    setNewSlug(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!title || !newSlug || !content) {
      setError('Title, slug, and content are required.');
      setSubmitting(false);
      return;
    }

    if (!currentSlug || typeof currentSlug !== 'string') {
        setError('Original page slug is missing or invalid.');
        setSubmitting(false);
        return;
    }

    try {
      const response = await fetch(`/api/admin/pages/${currentSlug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          newSlug, // Send the potentially modified slug as newSlug
          content,
          isPublished,
          metaTitle,
          metaDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update page: ${response.statusText}`);
      }
      // If slug was changed, redirect to the new slug's edit page or list page
      // For simplicity, always redirect to list page for now.
      router.push('/admin/pages-cms');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Basic form styling (can be improved with CSS classes/framework)
  const inputStyle = { display: 'block', width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px' };
  const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };
  const buttonStyle = { padding: '10px 15px', backgroundColor: 'blue', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };

  if (loading) return <p>Loading page data...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!pageData) return <p>Page not found.</p>; // Should be covered by error state generally

  return (
    <div>
      <Link href="/admin/pages-cms" legacyBehavior>
        <a>&larr; Back to Pages</a>
      </Link>
      <h1>Edit Page: {pageData.title}</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title" style={labelStyle}>Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (newSlug === pageData.slug) { // Only auto-update slug if it hasn't been manually changed from original
                handleSlugGeneration(e.target.value);
              }
            }}
            style={inputStyle}
            required
          />
        </div>
        <div>
          <label htmlFor="slug" style={labelStyle}>Slug</label>
          <input
            type="text"
            id="slug"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
            style={inputStyle}
            required
          />
        </div>
        <div>
          <label htmlFor="content" style={labelStyle}>Content:</label>
          <RichTextEditor
            initialContent={content}
            onChange={(html) => setContent(html)}
          />
        </div>
         <div>
          <label htmlFor="metaTitle" style={labelStyle}>Meta Title (Optional)</label>
          <input
            type="text"
            id="metaTitle"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="metaDescription" style={labelStyle}>Meta Description (Optional)</label>
          <textarea
            id="metaDescription"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            rows={3}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="checkbox"
            id="isPublished"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            style={{ marginRight: '5px' }}
          />
          <label htmlFor="isPublished">Publish Page</label>
        </div>
        <button type="submit" disabled={submitting} style={buttonStyle}>
          {submitting ? 'Updating...' : 'Update Page'}
        </button>
      </form>
    </div>
  );
};

export default EditPageCMS;
