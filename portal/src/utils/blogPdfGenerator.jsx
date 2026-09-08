async function preloadImage(src) {
  if (!src) return null;
  try {
    const resp = await fetch(src, { mode: 'cors', credentials: 'omit' });
    if (!resp.ok) return src;
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return src;
  }
}

async function preloadImagesInBlog(blog) {
  const urls = [];
  if (blog.coverImage?.url) urls.push(blog.coverImage.url);
  if (blog.content) {
    const div = document.createElement('div');
    div.innerHTML = blog.content;
    div.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (src) urls.push(src);
    });
  }
  const uniqueUrls = [...new Set(urls)];
  const results = await Promise.allSettled(uniqueUrls.map(preloadImage));
  const map = {};
  uniqueUrls.forEach((url, i) => {
    if (results[i].status === 'fulfilled' && results[i].value) {
      map[url] = results[i].value;
    }
  });
  return map;
}

function replaceImageUrls(blog, imageMap) {
  if (!blog) return blog;
  const clone = { ...blog, coverImage: blog.coverImage ? { ...blog.coverImage } : null, metadata: { ...(blog.metadata || {}) } };
  if (clone.coverImage?.url && imageMap[clone.coverImage.url]) {
    clone.coverImage.url = imageMap[clone.coverImage.url];
  }
  if (clone.content && imageMap) {
    const div = document.createElement('div');
    div.innerHTML = clone.content;
    div.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (src && imageMap[src]) {
        img.setAttribute('src', imageMap[src]);
      }
    });
    clone.content = div.innerHTML;
  }
  return clone;
}

async function getPdfLib() {
  return import('@react-pdf/renderer');
}

async function getDocumentComponent() {
  return import('../components/blog/BlogPdfDocument.jsx');
}

export async function generateBlogPdf(blog, onProgress) {
  if (!blog) throw new Error('No blog data provided');

  onProgress?.('Preparing content...');

  let pdfLib;
  try {
    pdfLib = await getPdfLib();
  } catch {
    throw new Error('PDF library failed to load');
  }

  onProgress?.('Loading images...');
  const imageMap = await preloadImagesInBlog(blog);

  onProgress?.('Building document...');
  const blogWithImages = replaceImageUrls(blog, imageMap);

  try {
    const PdfModule = await getDocumentComponent();
    const PdfDocument = PdfModule.default;
    const blob = await pdfLib.pdf(<PdfDocument blog={blogWithImages} />).toBlob();
    return blob;
  } catch (err) {
    throw new Error(`PDF generation failed: ${err.message}`);
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function getPdfFilename(blog) {
  const slug = blog?.slug || 'article';
  return `${slug}.pdf`;
}