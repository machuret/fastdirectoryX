import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { PrismaClient, Page as PrismaPage } from '@prisma/client';
import Head from 'next/head';
import { ParsedUrlQuery } from 'querystring';

const prisma = new PrismaClient();

interface SerializablePage extends Omit<PrismaPage, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

interface PageProps {
  page: SerializablePage | null;
}

interface Params extends ParsedUrlQuery {
  slug: string;
}

const PublicPage: NextPage<PageProps> = ({ page }) => {
  if (!page) {
    // This case should ideally be handled by notFound: true in getStaticProps
    // or by redirecting if fallback: 'blocking' and page is not found.
    // For fallback: true, you might show a loading state here.
    return (
      <>
        <Head>
          <title>Page Not Found</title>
        </Head>
        <div>
          <h1>404 - Page Not Found</h1>
          <p>The page you are looking for does not exist or is not published.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{page.metaTitle || page.title}</title>
        {page.metaDescription && (
          <meta name="description" content={page.metaDescription} />
        )}
      </Head>
      <article style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>{page.title}</h1>
        <div 
          style={{ marginTop: '20px', lineHeight: '1.6' }}
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </article>
    </>
  );
};

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const pages = await prisma.page.findMany({
    where: { isPublished: true },
    select: { slug: true },
  });

  const paths = pages.map((page) => ({
    params: { slug: page.slug },
  }));

  return {
    paths,
    fallback: 'blocking', // or true if you want to show a loading state, or false if all paths are known
  };
};

export const getStaticProps: GetStaticProps<PageProps, Params> = async (context) => {
  const { slug } = context.params!;

  const page = await prisma.page.findUnique({
    where: { slug, isPublished: true }, // Ensure we only fetch published pages
  });

  if (!page) {
    return {
      notFound: true,
    };
  }

  const serializablePage: SerializablePage = {
    ...page,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };

  return {
    props: {
      page: serializablePage,
    },
    revalidate: 60, // Optional: Re-generate the page periodically (e.g., every 60 seconds)
  };
};

export default PublicPage;
