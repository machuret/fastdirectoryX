import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import RichTextEditor from '../../../components/RichTextEditor'; // Import the new editor

const NewPageCMS = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Basic slugification: replace spaces with hyphens, lowercase, remove special chars
    const rawSlug = e.target.value;
    const generatedSlug = rawSlug
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, ''); // Remove non-alphanumeric characters except hyphens
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!title || !slug || !content) {
      setError('Title, slug, and content are required.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          slug,
          content,
          isPublished,
          metaTitle,
          metaDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create page: ${response.statusText}`);
      }

      router.push('/admin/pages-cms'); // Redirect to page list on success
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

  return (
    <div>
      <Link href="/admin/pages-cms" legacyBehavior>
        <a>&larr; Back to Pages</a>
      </Link>
      <h1>Create New Page</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title" style={labelStyle}>Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
            required
          />
        </div>
        <div>
          <label htmlFor="slug" style={labelStyle}>Slug (auto-generated from title, can be edited)</label>
          <input
            type="text"
            id="slug-input-for-user" // Temporary for user to type, slug state is used for submission
            onChange={handleSlugChange} // User types here, it calls handleSlugChange
            placeholder="Enter title above to auto-generate slug, or type here"
            style={inputStyle}
          />
           <input
            type="hidden" // Actual slug used for submission, updated by handleSlugChange
            id="slug"
            value={slug}
            required
          />
          <p style={{ fontSize: '0.9em', color: '#555' }}>Current slug: {slug}</p>
        </div>
        <div>
          <label htmlFor="content" style={labelStyle}>Content</label>
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
          {submitting ? 'Creating...' : 'Create Page'}
        </button>
      </form>
    </div>
  );
};

export default NewPageCMS;
