import { NextPage, GetServerSideProps } from 'next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, FormEvent } from 'react';
import { Sparkles, Lightbulb, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner'; // Assuming you use sonner for toasts, adjust if not

interface Idea {
  id: string; // or number, depending on how you want to manage it client-side
  text: string;
}

const AdminGuidesPage: NextPage = () => {
  const [niche, setNiche] = useState<string>('');
  const [ideas, setIdeas] = useState<string[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [slug, setSlug] = useState<string>('');

  const [isLoadingIdeas, setIsLoadingIdeas] = useState<boolean>(false);
  const [isLoadingArticle, setIsLoadingArticle] = useState<boolean>(false);
  const [isSavingGuide, setIsSavingGuide] = useState<boolean>(false);

  const handleGenerateIdeas = async (e: FormEvent) => {
    e.preventDefault();
    if (!niche.trim()) {
      toast.error('Please enter a niche to generate ideas.');
      return;
    }
    setIsLoadingIdeas(true);
    setIdeas([]);
    setSelectedIdea(null);
    setGeneratedArticle('');
    try {
      const response = await fetch('/api/admin/guides/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate ideas.');
      }
      setIdeas(data.ideas || []);
      if (data.ideas && data.ideas.length > 0) {
        toast.success('Article ideas generated successfully!');
      } else {
        toast.info('No ideas were generated for this niche, or the response was empty.');
      }
    } catch (error: any) {
      console.error('Error generating ideas:', error);
      toast.error(error.message || 'An unexpected error occurred while generating ideas.');
      setIdeas([]);
    } finally {
      setIsLoadingIdeas(false);
    }
  };

  // Placeholder for generating slug (you might want a more robust utility function)
  const generateSlug = (str: string) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-') // Replace spaces, non-word chars and hyphens with a single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  const handleSelectIdea = (idea: string) => {
    setSelectedIdea(idea);
    setTitle(idea); // Pre-fill title with the idea
    setSlug(generateSlug(idea)); // Pre-fill slug
    setGeneratedArticle(''); // Clear previous article if any
  };

  const handleGenerateArticle = async () => {
    if (!selectedIdea) {
      toast.error('Please select an idea first.');
      return;
    }
    setIsLoadingArticle(true);
    setGeneratedArticle('');
    try {
      const response = await fetch('/api/admin/guides/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicIdea: selectedIdea, niche }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate article.');
      }
      setGeneratedArticle(data.article || '');
      toast.success('Article generated successfully!');
    } catch (error: any) {
      console.error('Error generating article:', error);
      toast.error(error.message || 'An unexpected error occurred while generating article.');
    } finally {
      setIsLoadingArticle(false);
    }
  };

  const handleSaveGuide = async () => {
    if (!title || !slug || !generatedArticle || !selectedIdea || !niche) {
        toast.error('Missing required fields: Title, Slug, Article content, original idea, and niche are needed.');
        return;
    }
    setIsSavingGuide(true);
    try {
        const response = await fetch('/api/admin/guides/save-guide', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                niche,
                topicIdea: selectedIdea,
                title,
                slug,
                content: generatedArticle,
                openAIModel: 'gpt-3.5-turbo', // Or make this dynamic if you change models
                status: 'DRAFT' // Explicitly set to DRAFT, or make it selectable
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to save guide.');
        }
        toast.success(data.message || 'Guide saved successfully!');
        // Optionally clear form or redirect
        // setNiche(''); setIdeas([]); setSelectedIdea(null); setGeneratedArticle(''); setTitle(''); setSlug('');
    } catch (error: any) {
        console.error('Error saving guide:', error);
        toast.error(error.message || 'An unexpected error occurred while saving the guide.');
    } finally {
        setIsSavingGuide(false);
    }
  };


  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Generate Article Ideas</CardTitle>
          <CardDescription>Enter a niche to get AI-powered article ideas.</CardDescription>
        </CardHeader>
        <form onSubmit={handleGenerateIdeas}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="niche">Niche</Label>
              <Input
                id="niche"
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g., Sustainable Gardening, SaaS Marketing, Home Automation"
                disabled={isLoadingIdeas}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoadingIdeas || !niche.trim()}>
              {isLoadingIdeas ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><Lightbulb className="mr-2 h-4 w-4" /> Generate Ideas</>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {ideas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>2. Select an Idea</CardTitle>
            <CardDescription>Click on an idea to proceed with article generation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {ideas.map((idea, index) => (
              <Button
                key={index} // Consider more stable keys if ideas can change order
                variant={selectedIdea === idea ? 'default' : 'outline'}
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => handleSelectIdea(idea)}
                disabled={isLoadingArticle || isSavingGuide}
              >
                {idea}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {selectedIdea && (
        <Card>
          <CardHeader>
            <CardTitle>3. Generate Full Article</CardTitle>
            <CardDescription>Generate a full article for the topic: <strong>{selectedIdea}</strong></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Article Title</Label>
              <Input 
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSlug(generateSlug(e.target.value));
                }}
                placeholder="Enter article title"
                disabled={isLoadingArticle || isSavingGuide}
              />
            </div>
            <div>
              <Label htmlFor="slug">Article Slug</Label>
              <Input 
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)} 
                placeholder="Enter article slug (e.g., my-awesome-article)"
                disabled={isLoadingArticle || isSavingGuide}
              />
            </div>
            {generatedArticle && (
              <div>
                <Label htmlFor="articleContent">Generated Article Content</Label>
                <textarea
                  id="articleContent"
                  value={generatedArticle}
                  onChange={(e) => setGeneratedArticle(e.target.value)}
                  rows={15}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                  placeholder="Article content will appear here..."
                  disabled={isSavingGuide}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
            <Button 
              onClick={handleGenerateArticle} 
              disabled={isLoadingArticle || isSavingGuide || !selectedIdea}
              className='w-full sm:w-auto'
            >
              {isLoadingArticle ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Article...</>
              ) : (
                <><FileText className="mr-2 h-4 w-4" /> Generate Article</>
              )}
            </Button>
            {generatedArticle && (
              <Button 
                onClick={handleSaveGuide} 
                disabled={isSavingGuide || !generatedArticle || !title.trim() || !slug.trim()}
                className='w-full sm:w-auto'
              >
                {isSavingGuide ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle className="mr-2 h-4 w-4" /> Save Guide</>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      pageTitle: "AI Content Generator",
      pageDescription: "Generate article ideas, full articles, and save them as guides.",
      pageIconName: "Sparkles", // This name should match a key in iconMap in _app.tsx
    },
  };
};

export default AdminGuidesPage;
