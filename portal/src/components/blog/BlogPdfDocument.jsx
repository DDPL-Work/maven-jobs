import { useMemo } from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const COLORS = {
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

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 64,
    paddingHorizontal: 56,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.65,
    color: COLORS.s700,
  },
  header: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.navy,
    paddingBottom: 16,
  },
  headerLogo: { width: 24, height: 24 },
  headerTitle: { fontSize: 14, fontWeight: 700, color: COLORS.navy, letterSpacing: -0.3 },
  headerSub: { fontSize: 8, color: COLORS.s400 },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    fontSize: 9,
    color: COLORS.s500,
    marginBottom: 4,
  },
  metaItem: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  category: {
    fontSize: 8,
    fontWeight: 700,
    color: COLORS.navy,
    textTransform: 'uppercase',
    letterSpacing: 1,
    backgroundColor: '#eef2ff',
    padding: '3 10',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    color: COLORS.s900,
    lineHeight: 1.15,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  excerpt: {
    fontSize: 10.5,
    color: COLORS.s600,
    lineHeight: 1.7,
    fontStyle: 'italic',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.navy,
    paddingLeft: 14,
    marginBottom: 16,
  },
  hero: {
    marginBottom: 20,
    borderRadius: 4,
    overflow: 'hidden',
  },
  paragraph: {
    marginBottom: 10,
    fontSize: 11,
    lineHeight: 1.65,
    color: COLORS.s700,
  },
  heading2: {
    fontSize: 18,
    fontWeight: 800,
    color: COLORS.s900,
    letterSpacing: -0.3,
    marginTop: 28,
    marginBottom: 10,
    lineHeight: 1.25,
  },
  heading3: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.s800,
    marginTop: 22,
    marginBottom: 8,
    lineHeight: 1.3,
  },
  heading4: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.s800,
    marginTop: 16,
    marginBottom: 6,
    lineHeight: 1.35,
  },
  list: {
    marginBottom: 10,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    fontSize: 11,
    lineHeight: 1.6,
    color: COLORS.s700,
  },
  bullet: { width: 12, fontSize: 11 },
  listItemText: { flex: 1, fontSize: 11, lineHeight: 1.6 },
  codeBlock: {
    backgroundColor: COLORS.s900,
    color: COLORS.s200,
    padding: '14 18',
    borderRadius: 4,
    fontSize: 9.5,
    fontFamily: 'Courier',
    lineHeight: 1.55,
    marginBottom: 14,
  },
  inlineCode: {
    backgroundColor: COLORS.s100,
    color: COLORS.navy,
    padding: '1 5',
    fontSize: 10,
    fontFamily: 'Courier',
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.navy,
    padding: '10 16',
    marginBottom: 14,
    backgroundColor: COLORS.s50,
    fontStyle: 'italic',
    color: COLORS.s600,
    fontSize: 10.5,
    lineHeight: 1.65,
  },
  link: {
    color: COLORS.navy,
    fontWeight: 700,
    textDecoration: 'underline',
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.s200,
    marginVertical: 20,
  },
  imageWrap: {
    marginBottom: 14,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: COLORS.s100,
  },
  imageCaption: {
    fontSize: 8.5,
    color: COLORS.s400,
    textAlign: 'center',
    paddingTop: 6,
    fontStyle: 'italic',
  },
  table: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.s200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.s200,
  },
  tableHeader: {
    backgroundColor: COLORS.s100,
    padding: '8 10',
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.s800,
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: COLORS.s200,
  },
  tableCell: {
    padding: '6 10',
    fontSize: 9,
    color: COLORS.s700,
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: COLORS.s200,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 56,
    right: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.s200,
    paddingTop: 10,
    fontSize: 7.5,
    color: COLORS.s400,
  },
  footerLeft: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  footerLogoSmall: { width: 14, height: 14, opacity: 0.5 },
});

function parseTextRuns(html) {
  if (!html || !html.trim()) return [''];
  const div = document.createElement('div');
  div.innerHTML = html.trim();
  const runs = [];
  walkNodes(div, runs);
  return runs.length ? runs : [div.textContent || ''];
}

function walkNodes(node, runs) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent.replace(/\s+/g, ' ');
    if (text) runs.push({ text });
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const tag = node.tagName.toLowerCase();
  const bold = ['b', 'strong'].includes(tag);
  const italic = ['i', 'em'].includes(tag);
  const code = tag === 'code';
  const isLink = tag === 'a';
  const linkHref = isLink ? (node.getAttribute('href') || '') : null;

  if (tag === 'br') {
    runs.push({ text: '\n' });
    return;
  }

  const children = [];
  for (const child of node.childNodes) {
    const childRuns = [];
    walkNodes(child, childRuns);
    children.push(...childRuns);
  }

  if (children.length === 0) {
    const text = node.textContent?.replace(/\s+/g, ' ');
    if (text) runs.push({ text, bold, italic, code, link: linkHref });
    return;
  }

  for (const child of children) {
    runs.push({
      text: child.text,
      bold: bold || child.bold,
      italic: italic || child.italic,
      code: code || child.code,
      link: child.link || linkHref,
    });
  }
}

function parseHtmlToBlocks(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  const blocks = [];

  for (const el of div.children) {
    const tag = el.tagName?.toLowerCase();
    switch (tag) {
      case 'p': {
        if (!el.innerHTML.trim()) break;
        if (el.querySelector('img')) {
          el.querySelectorAll('img').forEach(img => {
            blocks.push({ type: 'image', src: img.getAttribute('src') || '', alt: img.getAttribute('alt') || '' });
          });
        } else {
          blocks.push({ type: 'paragraph', html: el.innerHTML.trim() });
        }
        break;
      }
      case 'h1': case 'h2':
        blocks.push({ type: 'heading2', html: el.innerHTML.trim() });
        break;
      case 'h3':
        blocks.push({ type: 'heading3', html: el.innerHTML.trim() });
        break;
      case 'h4':
        blocks.push({ type: 'heading4', html: el.innerHTML.trim() });
        break;
      case 'pre':
        blocks.push({ type: 'code', html: el.innerHTML.trim() });
        break;
      case 'ul': case 'ol': {
        const items = [];
        for (const li of el.querySelectorAll(':scope > li')) {
          const liText = li.innerHTML.replace(/<[uo]l>.*<\/[uo]l>/g, '').trim();
          const nestedUl = li.querySelector(':scope > ul, :scope > ol');
          const nested = nestedUl ? parseHtmlToBlocks(nestedUl.outerHTML) : [];
          items.push({ text: liText, nested: nested.filter(b => b.type === 'list' || b.type === 'paragraph') });
        }
        blocks.push({ type: 'list', items, ordered: tag === 'ol' });
        break;
      }
      case 'blockquote':
        blocks.push({ type: 'blockquote', html: el.innerHTML.trim() });
        break;
      case 'figure': {
        const img = el.querySelector('img');
        if (img) {
          const cap = el.querySelector('figcaption');
          blocks.push({ type: 'image', src: img.getAttribute('src') || '', alt: img.getAttribute('alt') || '', caption: cap?.innerHTML?.trim() || '' });
        }
        break;
      }
      case 'img':
        blocks.push({ type: 'image', src: el.getAttribute('src') || '', alt: el.getAttribute('alt') || '' });
        break;
      case 'hr':
        blocks.push({ type: 'hr' });
        break;
      default: {
        if (['table', 'div', 'section'].includes(tag)) {
          const inner = parseHtmlToBlocks(el.innerHTML);
          blocks.push(...inner);
        }
      }
    }
  }
  return blocks;
}

function TextRun({ run }) {
  let style = {};
  if (run.bold) style.fontWeight = 700;
  if (run.italic) style.fontStyle = 'italic';
  if (run.code) {
    style.fontFamily = 'Courier';
    style.fontSize = 10;
    style.backgroundColor = COLORS.s100;
    style.color = COLORS.navy;
    style.padding = '1 4';
  }
  if (run.link) {
    style.color = COLORS.navy;
    style.fontWeight = 700;
    style.textDecoration = 'underline';
  }
  return <Text style={style}>{run.link && run.text ? run.text : run.text}</Text>;
}

function BlockRenderer({ block }) {
  switch (block.type) {
    case 'paragraph':
      return <Text style={styles.paragraph}>{parseTextRuns(block.html).map((run, i) => <TextRun key={i} run={run} />)}</Text>;

    case 'heading2':
      return <Text style={styles.heading2}>{parseTextRuns(block.html).map((run, i) => <TextRun key={i} run={run} />)}</Text>;

    case 'heading3':
      return <Text style={styles.heading3}>{parseTextRuns(block.html).map((run, i) => <TextRun key={i} run={run} />)}</Text>;

    case 'heading4':
      return <Text style={styles.heading4}>{parseTextRuns(block.html).map((run, i) => <TextRun key={i} run={run} />)}</Text>;

    case 'image':
      return (
        <View style={styles.imageWrap}>
          <Image src={block.src} />
          {block.caption ? <Text style={styles.imageCaption}>{block.caption}</Text> : null}
        </View>
      );

    case 'code':
      return <Text style={styles.codeBlock}>{block.html.replace(/<\/?[^>]+(>|$)/g, '')}</Text>;

    case 'list':
      return (
        <View style={styles.list}>
          {block.items.map((item, j) => (
            <View key={j} style={styles.listItem} wrap={false}>
              <Text style={styles.bullet}>{block.ordered ? `${j + 1}.` : '\u2022'}</Text>
              <View style={styles.listItemText}>
                <Text>{parseTextRuns(item.text).map((run, k) => <TextRun key={k} run={run} />)}</Text>
                {item.nested.map((nb, k) => <BlockRenderer key={`n${k}`} block={nb} />)}
              </View>
            </View>
          ))}
        </View>
      );

    case 'blockquote':
      return (
        <View style={styles.blockquote}>
          <Text>{parseTextRuns(block.html).map((run, i) => <TextRun key={i} run={run} />)}</Text>
        </View>
      );

    case 'hr':
      return <View style={styles.hr} />;

    default:
      return null;
  }
}

function PdfHeader({ blog, category, title, author, publishedAt, readTime, coverUrl, excerpt }) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Maven Jobs</Text>
        <Text style={styles.headerSub}>Career Insights & Guides</Text>
      </View>

      <Text style={styles.category}>{category}</Text>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text>By </Text>
          <Text style={{ fontWeight: 700, color: COLORS.s600 }}>{author}</Text>
        </View>
        {publishedAt ? (
          <View style={styles.metaItem}>
            <Text>Published </Text>
            <Text>{publishedAt}</Text>
          </View>
        ) : null}
        {readTime ? (
          <View style={styles.metaItem}>
            <Text>{readTime}</Text>
          </View>
        ) : null}
      </View>

      {coverUrl ? (
        <View style={styles.hero}>
          <Image src={coverUrl} />
        </View>
      ) : null}

      {excerpt ? <Text style={styles.excerpt}>{excerpt}</Text> : null}
    </View>
  );
}

function PdfFooter({ slug, pageNumber, totalPages }) {
  return (
    <View style={styles.footer} fixed>
      <View style={styles.footerLeft}>
        <Text>{'MavenJobs'}</Text>
        <Text>|</Text>
        <Text style={{ color: COLORS.s500 }}>{window.location.origin}/blogs/{slug}</Text>
      </View>
      <Text>{pageNumber} / {totalPages}</Text>
    </View>
  );
}

export default function BlogPdfDocument({ blog }) {
  const blocks = useMemo(() => blog?.content ? parseHtmlToBlocks(blog.content) : [], [blog]);

  if (!blog) return null;

  const category = blog.category || 'Article';
  const title = blog.title || 'Untitled';
  const author = blog.author?.name || 'Maven Jobs';
  const publishedAt = blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const readTime = blog.metadata?.readTimeMinutes ? `${blog.metadata.readTimeMinutes} min read` : '';
  const coverUrl = blog.coverImage?.url || '';
  const excerpt = blog.excerpt || '';
  const slug = blog.slug || 'article';

  return (
    <Document title={title} author={author} subject={category} keywords={category}>
      <Page size="A4" style={styles.page} wrap>
        <PdfHeader
          blog={blog}
          category={category}
          title={title}
          author={author}
          publishedAt={publishedAt}
          readTime={readTime}
          coverUrl={coverUrl}
          excerpt={excerpt}
        />

        {blocks.map((block, i) => <BlockRenderer key={i} block={block} />)}

        <PdfFooter slug={slug} pageNumber={1} totalPages={1} />
      </Page>
    </Document>
  );
}