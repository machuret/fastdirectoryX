// c:\alpha\pages\_document.tsx
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="en"> {/* You can set a default language here */}
        <Head>
          {/* Link to the dynamic CSS variables stylesheet */}
          <link id="dynamic-css-variables" rel="stylesheet" href="/api/css-variables" />
          {/* Add any other global meta tags, font links, etc. here */}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
