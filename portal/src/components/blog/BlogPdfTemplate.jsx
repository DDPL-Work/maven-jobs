import { forwardRef } from 'react';
import mavenLogo from '../../../assets/maven-logo-BdiSsfJk.svg';

const C = {
  navy: '#002366',
  navyD: '#001540',
  s50: '#f8fafc',
  s100: '#f1f5f9',
  s200: '#e2e8f0',
  s300: '#cbd5e1',
  s400: '#94a3b8',
  s500: '#64748b',
  s600: '#475569',
  s700: '#334155',
  s800: '#1e293b',
  s900: '#0f172a',
};

const styles = {
  page: {
    width: '595px',
    padding: '0',
    background: '#ffffff',
    color: C.s700,
    fontFamily: "'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: '11pt',
    lineHeight: 1.65,
    position: 'relative',
  },
  header: {
    textAlign: 'center',
    padding: '48px 56px 0',
    marginBottom: 0,
  },
  headerLogo: {
    height: '28px',
    marginBottom: '16px',
  },
  headerLabel: {
    fontSize: '8pt',
    fontWeight: 700,
    color: C.navy,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    marginBottom: '4px',
  },
  headerDivider: {
    height: '2px',
    background: `linear-gradient(90deg, ${C.navy}, ${C.s300})`,
    margin: '16px 56px 0',
    border: 'none',
  },
  hero: {
    padding: '32px 56px 0',
  },
  heroCategory: {
    display: 'inline-block',
    fontSize: '8pt',
    fontWeight: 700,
    color: C.navy,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    background: '#eef2ff',
    padding: '4px 12px',
    borderRadius: '100px',
    marginBottom: '16px',
  },
  heroTitle: {
    fontSize: '26pt',
    fontWeight: 800,
    color: C.s900,
    lineHeight: 1.15,
    letterSpacing: '-0.03em',
    margin: '0 0 16px',
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    fontSize: '9pt',
    color: C.s500,
    marginBottom: '4px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  metaLabel: {
    fontWeight: 600,
    color: C.s600,
  },
  metaValue: {
    fontWeight: 400,
    color: C.s500,
  },
  heroImageWrap: {
    margin: '24px 0 20px',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: C.s100,
  },
  heroImage: {
    width: '100%',
    display: 'block',
  },
  excerpt: {
    fontSize: '10.5pt',
    color: C.s600,
    lineHeight: 1.7,
    fontStyle: 'italic',
    borderLeft: `3px solid ${C.navy}`,
    paddingLeft: '18px',
    margin: '0 56px 20px',
  },
  body: {
    padding: '0 56px 40px',
  },
  paragraph: {
    margin: '0 0 14px',
    fontSize: '11pt',
    lineHeight: 1.65,
    color: C.s700,
  },
  heading2: {
    fontSize: '18pt',
    fontWeight: 800,
    color: C.s900,
    letterSpacing: '-0.02em',
    margin: '36px 0 14px',
    lineHeight: 1.25,
  },
  heading3: {
    fontSize: '14pt',
    fontWeight: 700,
    color: C.s800,
    margin: '28px 0 10px',
    lineHeight: 1.3,
  },
  heading4: {
    fontSize: '12pt',
    fontWeight: 700,
    color: C.s800,
    margin: '22px 0 8px',
    lineHeight: 1.35,
  },
  list: {
    margin: '0 0 14px',
    paddingLeft: '24px',
  },
  listItem: {
    marginBottom: '6px',
    fontSize: '11pt',
    lineHeight: 1.6,
    color: C.s700,
  },
  imageWrap: {
    margin: '24px 0',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: C.s100,
    textAlign: 'center',
  },
  image: {
    maxWidth: '100%',
    display: 'block',
    margin: '0 auto',
  },
  imageCaption: {
    fontSize: '8.5pt',
    color: C.s400,
    textAlign: 'center',
    padding: '8px 0 0',
    fontStyle: 'italic',
  },
  codeBlock: {
    background: '#0f172a',
    color: '#e2e8f0',
    padding: '16px 20px',
    borderRadius: '10px',
    fontSize: '9.5pt',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
    lineHeight: 1.55,
    margin: '20px 0',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  inlineCode: {
    background: C.s100,
    color: C.navy,
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10pt',
    fontFamily: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
  },
  blockquote: {
    borderLeft: `4px solid ${C.navy}`,
    padding: '14px 20px',
    margin: '20px 0',
    background: C.s50,
    borderRadius: '0 10px 10px 0',
    fontStyle: 'italic',
    color: C.s600,
    fontSize: '10.5pt',
    lineHeight: 1.65,
  },
  link: {
    color: C.navy,
    fontWeight: 600,
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    margin: '20px 0',
    fontSize: '10pt',
  },
  tableHeader: {
    background: C.s100,
    fontWeight: 700,
    color: C.s800,
    padding: '10px 14px',
    borderBottom: `2px solid ${C.s300}`,
    textAlign: 'left',
  },
  tableCell: {
    padding: '8px 14px',
    borderBottom: `1px solid ${C.s200}`,
    color: C.s700,
  },
  hr: {
    border: 'none',
    borderTop: `1px solid ${C.s200}`,
    margin: '28px 0',
  },
  footer: {
    textAlign: 'center',
    padding: '20px 56px',
    borderTop: `1px solid ${C.s200}`,
    fontSize: '7.5pt',
    color: C.s400,
    marginTop: '20px',
  },
  footerLogo: {
    height: '18px',
    marginBottom: '8px',
    opacity: 0.4,
  },
  footerText: {
    margin: '2px 0',
  },
};

function parseHtmlToBlocks(html) {
  const div = document.createElement('div');
  div.innerHTML = html;

  const blocks = [];
  const walker = document.createTreeWalker(div, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null, false);

  let current = walker.currentNode;
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      const text = current.textContent.trim();
      if (text && current.parentElement && !['SCRIPT', 'STYLE', 'PRE', 'CODE'].includes(current.parentElement.tagName)) {
        const parent = current.parentElement;
        if (['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'TD', 'TH'].includes(parent.tagName)) {
          current = walker.nextNode();
          continue;
        }
      }
      current = walker.nextNode();
      continue;
    }

    const el = current;
    const tag = el.tagName?.toLowerCase();

    switch (tag) {
      case 'p': {
        const inner = el.innerHTML.trim();
        if (!inner) break;
        if (el.querySelector('img')) {
          const imgs = el.querySelectorAll('img');
          imgs.forEach(img => blocks.push({ type: 'image', src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' }));
        } else {
          blocks.push({ type: 'paragraph', html: inner });
        }
        break;
      }
      case 'h1':
      case 'h2':
        blocks.push({ type: 'heading2', html: el.innerHTML.trim() });
        break;
      case 'h3':
        blocks.push({ type: 'heading3', html: el.innerHTML.trim() });
        break;
      case 'h4':
        blocks.push({ type: 'heading4', html: el.innerHTML.trim() });
        break;
      case 'img':
        blocks.push({ type: 'image', src: el.getAttribute('src'), alt: el.getAttribute('alt') || '' });
        break;
      case 'pre':
        blocks.push({ type: 'code', html: el.innerHTML.trim() });
        break;
      case 'ul':
      case 'ol': {
        const items = [];
        el.querySelectorAll('li').forEach(li => {
          const nestedUl = li.querySelector('ul, ol');
          const text = nestedUl ? li.innerHTML.replace(/<[uo]l>.*<\/[uo]l>/g, '').trim() : li.innerHTML.trim();
          const nested = nestedUl ? parseHtmlToBlocks(nestedUl.outerHTML) : [];
          items.push({ text, nested: nested.filter(b => b.type === 'list' || b.type === 'paragraph') });
        });
        blocks.push({ type: 'list', ordered: tag === 'ol', items, html: el.innerHTML.trim() });
        break;
      }
      case 'blockquote': {
        const inner = el.innerHTML.trim();
        if (inner) blocks.push({ type: 'blockquote', html: inner });
        break;
      }
      case 'table': {
        const rows = [];
        el.querySelectorAll('tr').forEach(tr => {
          const cells = [];
          tr.querySelectorAll('th, td').forEach(cell => cells.push(cell.innerHTML.trim()));
          if (cells.length) rows.push(cells);
        });
        if (rows.length) blocks.push({ type: 'table', rows });
        break;
      }
      case 'hr':
        blocks.push({ type: 'hr' });
        break;
      case 'figure': {
        const img = el.querySelector('img');
        if (img) {
          const figcaption = el.querySelector('figcaption');
          blocks.push({ type: 'image', src: img.getAttribute('src'), alt: img.getAttribute('alt') || '', caption: figcaption?.innerHTML?.trim() || '' });
        }
        break;
      }
    }

    current = walker.nextNode();
  }

  return blocks;
}

const BlogPdfTemplate = forwardRef(({ blog, onReady }, ref) => {
  if (!blog) return null;

  const blocks = parseHtmlToBlocks(blog.content || '');
  const category = blog.category || 'Article';
  const title = blog.title || 'Untitled';
  const author = blog.author?.name || 'Maven Jobs';
  const publishedAt = blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const readTime = blog.metadata?.readTimeMinutes ? `${blog.metadata.readTimeMinutes} min read` : '';
  const coverUrl = blog.coverImage?.url || '';
  const excerpt = blog.excerpt || '';
  const slug = blog.slug || 'article';

  return (
    <div ref={ref} data-pdf-template="true" data-slug={slug} style={styles.page}>
      <div style={styles.header}>
        <img src={mavenLogo} alt="Maven Jobs" style={styles.headerLogo} />
        <div style={styles.headerLabel}>MavenJobs Blog</div>
      </div>
      <div style={styles.headerDivider} />

      <div style={styles.hero}>
        <div style={styles.heroCategory}>{category}</div>
        <h1 style={styles.heroTitle}>{title}</h1>
        <div style={styles.metaRow}>
          <span style={styles.metaItem}>
            <span style={styles.metaLabel}>By </span>
            <span style={styles.metaValue}>{author}</span>
          </span>
          {publishedAt && (
            <span style={styles.metaItem}>
              <span style={styles.metaLabel}>Published </span>
              <span style={styles.metaValue}>{publishedAt}</span>
            </span>
          )}
          {readTime && (
            <span style={styles.metaItem}>
              <span style={styles.metaValue}>{readTime}</span>
            </span>
          )}
          {blog.updatedAt && blog.updatedAt !== blog.publishedAt && (
            <span style={styles.metaItem}>
              <span style={styles.metaLabel}>Updated </span>
              <span style={styles.metaValue}>{new Date(blog.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </span>
          )}
        </div>

        {coverUrl && (
          <div style={styles.heroImageWrap}>
            <img src={coverUrl} alt={title} style={styles.heroImage} />
          </div>
        )}
      </div>

      {excerpt && <div style={styles.excerpt}>{excerpt}</div>}

      <div style={styles.body}>
        {blocks.map((block, i) => <BlockRenderer key={i} block={block} />)}
      </div>

      <div style={styles.footer}>
        <img src={mavenLogo} alt="Maven Jobs" style={styles.footerLogo} />
        <div style={styles.footerText}>MavenJobs — Career Insights & Guides</div>
        <div style={styles.footerText}>{window.location.origin}/blogs/{slug}</div>
        <div style={{ ...styles.footerText, marginTop: 4 }}>
          Generated on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
});

BlogPdfTemplate.displayName = 'BlogPdfTemplate';

function BlockRenderer({ block }) {
  switch (block.type) {
    case 'paragraph':
      return <p style={styles.paragraph} dangerouslySetInnerHTML={{ __html: block.html }} />;
    case 'heading2':
      return <h2 style={styles.heading2} dangerouslySetInnerHTML={{ __html: block.html }} />;
    case 'heading3':
      return <h3 style={styles.heading3} dangerouslySetInnerHTML={{ __html: block.html }} />;
    case 'heading4':
      return <h4 style={styles.heading4} dangerouslySetInnerHTML={{ __html: block.html }} />;
    case 'image':
      return (
        <div style={styles.imageWrap}>
          <img src={block.src} alt={block.alt} style={styles.image} />
          {block.caption && <div style={styles.imageCaption}>{block.caption}</div>}
        </div>
      );
    case 'code':
      return <pre style={styles.codeBlock}><code dangerouslySetInnerHTML={{ __html: block.html }} /></pre>;
    case 'list':
      return (
        <div style={styles.list} as={block.ordered ? 'ol' : 'ul'}>
          {block.items.map((item, j) => (
            <div key={j} style={styles.listItem}>
              <span style={{ marginRight: 8 }}>{block.ordered ? `${j + 1}.` : '\u2022'}</span>
              <span dangerouslySetInnerHTML={{ __html: item.text }} />
              {item.nested.length > 0 && (
                <div style={{ paddingLeft: 20, marginTop: 4 }}>
                  {item.nested.map((nb, k) => <BlockRenderer key={k} block={nb} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    case 'blockquote':
      return <div style={styles.blockquote} dangerouslySetInnerHTML={{ __html: block.html }} />;
    case 'table':
      return (
        <table style={styles.table}>
          {block.rows.map((row, j) => (
            <tr key={j}>
              {row.map((cell, k) => (
                j === 0
                  ? <th key={k} style={styles.tableHeader} dangerouslySetInnerHTML={{ __html: cell }} />
                  : <td key={k} style={styles.tableCell} dangerouslySetInnerHTML={{ __html: cell }} />
              ))}
            </tr>
          ))}
        </table>
      );
    case 'hr':
      return <div style={styles.hr} />;
    default:
      return null;
  }
}

export { parseHtmlToBlocks };
export default BlogPdfTemplate;