import { useCallback, useEffect, useMemo, useState } from "react";
import { LuArrowLeft, LuCalendar, LuChevronRight, LuClock, LuDownload, LuLoader } from "react-icons/lu";
import { Link, useLocation, useParams } from "react-router-dom";
import authService from "../../../../services/authService";
import SkeletonPage from "../../../../components/Skeleton";
import LandingFooter from "../../../../components/LandingFooter";
import CandidateHeader from "../../../../components/common/CandidateHeader.jsx";


const BACK_LINKS = {
  "/": { label: "Home", path: "/" },
  "/profile-dashboard": { label: "Profile", path: "/profile-dashboard" },
  "/blogs": { label: "Blogs", path: "/blogs" },
};

const parseReferrer = () => {
  try {
    const ref = document.referrer;
    if (!ref) return null;
    const url = new URL(ref);
    const known = Object.keys(BACK_LINKS).find(k => url.pathname === k || url.pathname.startsWith(k + "/"));
    if (known) return known;
    if (url.pathname.startsWith("/profile")) return "/profile-dashboard";
    return null;
  } catch { return null; }
};

export default function BlogArticle() {
  const { slug } = useParams();
  const location = useLocation();
  const [blog, setBlog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [referrerPath, setReferrerPath] = useState(null);

  const loadBlog = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await authService.getBlogBySlug(slug);
      if (response.success) {
        setBlog(response.data);
      } else {
        setError("Blog not found");
      }
    } catch (err) {
      setError(err.message || "Failed to load blog article");
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadBlog();
  }, [loadBlog]);

  useEffect(() => {
    const fromState = location.state?.from || null;
    if (fromState && BACK_LINKS[fromState]) {
      setReferrerPath(fromState);
    } else {
      const ref = parseReferrer();
      if (ref) setReferrerPath(ref);
    }
  }, []);

  const breadcrumbs = useMemo(() => {
    const crumbs = [{ label: "Home", path: "/" }];
    if (referrerPath && referrerPath !== "/" && referrerPath !== "/blogs") {
      crumbs.push(BACK_LINKS[referrerPath] || { label: "Previous", path: referrerPath });
    }
    crumbs.push({ label: "Blogs", path: "/blogs" });
    if (blog) crumbs.push({ label: blog.title, path: null });
    return crumbs;
  }, [referrerPath, blog]);

  const handleDownloadPdf = useCallback(async () => {
    if (!blog || pdfLoading) return;
    setPdfLoading(true);
    setPdfError("");
    setPdfProgress("Preparing...");
    try {
      const { generateBlogPdf, downloadBlob, getPdfFilename } = await import("../../../../utils/blogPdfGenerator.jsx");
      setPdfProgress("Loading images...");
      const blob = await generateBlogPdf(blog, (msg) => setPdfProgress(msg));
      const filename = getPdfFilename(blog);
      downloadBlob(blob, filename);
      setPdfProgress("");
    } catch (err) {
      setPdfError(err.message || "PDF generation failed");
      console.error("PDF generation failed", err);
    } finally {
      setPdfLoading(false);
      setPdfProgress("");
    }
  }, [blog, pdfLoading]);

  const stripHtml = (html) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  if (isLoading) {
    return <SkeletonPage variant="detail" />;
  }

  if (error || !blog) {
    return (
      <div
        className="error-container"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <p
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: "#e2e8f0",
              margin: 0,
            }}
          >
            404
          </p>
          <p
            style={{
              marginTop: 8,
              fontSize: 18,
              fontWeight: 600,
              color: "#475569",
            }}
          >
            {error || "Article not found"}
          </p>
          <Link
            to="/blogs"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginTop: 20,
              padding: "10px 24px",
              borderRadius: 12,
              backgroundColor: "#163060",
              color: "#ffffff",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <LuArrowLeft size={16} />
            Back to Blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <CandidateHeader />
      {/* ── Breadcrumbs ── */}
      <div
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #eef2f6",
        }}
      >
        <div
          className="breadcrumbs-wrapper"
          style={{
            maxWidth: 1300,
            margin: "0 auto",
            padding: "14px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
        <div
          className="breadcrumbs-list"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
          }}
        >
          {breadcrumbs.map((crumb, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {i > 0 && <LuChevronRight size={12} color="#94a3b8" />}
              {crumb.path ? (
                <Link
                  to={crumb.path}
                  style={{
                    color: "#64748b",
                    textDecoration: "none",
                    fontWeight: i === breadcrumbs.length - 1 ? 700 : 500,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => { if (crumb.path) e.currentTarget.style.color = "#163060"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; }}
                >
                  {crumb.label}
                </Link>
              ) : (
              <span
                className="breadcrumb-current"
                style={{
                  color: "#0f172a",
                  fontWeight: 700,
                  maxWidth: 480,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "inline-block",
                  verticalAlign: "bottom",
                }}
              >
                {crumb.label}
              </span>
              )}
            </span>
          ))}
        </div>
        <button
          type="button"
          className="download-pdf-btn"
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            backgroundColor: pdfLoading ? "#f1f5f9" : "#ffffff",
            fontSize: 12,
            fontWeight: 600,
            color: pdfLoading ? "#94a3b8" : "#163060",
            cursor: pdfLoading ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!pdfLoading) {
              e.currentTarget.style.borderColor = "#163060";
              e.currentTarget.style.backgroundColor = "#eef2ff";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.backgroundColor = "#ffffff";
          }}
        >
          {pdfLoading ? <LuLoader size={14} className="pdf-spinner" /> : <LuDownload size={14} />}
          {pdfLoading ? (pdfProgress || "Generating PDF…") : "Download PDF"}
        </button>
        </div>
      </div>

      <article
        className="article-container"
        style={{
          maxWidth: 1300,
          margin: "0 auto",
          padding: "0 32px 80px",
        }}
      >
        <div
          className="article-header"
          style={{
            marginBottom: 40,
            paddingTop: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#163060",
                backgroundColor: "#eef2ff",
                padding: "4px 12px",
                borderRadius: 100,
              }}
            >
              {blog.category}
            </span>
          </div>

          <h1
            className="article-title"
            style={{
              fontSize: "clamp(24px, 4vw, 40px)",
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.2,
              margin: "0 0 16px 0",
              letterSpacing: "-0.02em",
            }}
          >
            {blog.title}
          </h1>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              fontSize: 13,
              color: "#94a3b8",
              alignItems: "center",
            }}
          >
            {blog.author?.name ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: "#475569",
                  fontWeight: 600,
                }}
              >
                By {blog.author.name}
              </span>
            ) : null}
            {blog.publishedAt ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <LuCalendar size={14} />
                {new Date(blog.publishedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            ) : null}
            {blog.metadata?.readTimeMinutes ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <LuClock size={14} />
                {blog.metadata.readTimeMinutes} min read
              </span>
            ) : null}
          </div>

          {blog.tags && blog.tags.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 16,
              }}
            >
              {blog.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    backgroundColor: "#f1f5f9",
                    padding: "3px 10px",
                    borderRadius: 100,
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {blog.coverImage?.url ? (
          <div
            className="article-cover"
            style={{
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 32,
              aspectRatio: "16/9",
              backgroundColor: "#f1f5f9",
            }}
          >
            <img
              src={blog.coverImage.url}
              alt={blog.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        ) : null}

        {blog.excerpt ? (
          <p
            className="article-excerpt"
            style={{
              fontSize: 16,
              color: "#475569",
              lineHeight: 1.7,
              margin: "0 0 24px 0",
              fontStyle: "italic",
              borderLeft: "3px solid #163060",
              paddingLeft: 16,
            }}
          >
            {blog.excerpt}
          </p>
        ) : null}

        <div
          className="blog-article-content"
          style={{
            fontSize: 17,
            color: "#334155",
            lineHeight: 1.85,
          }}
          dangerouslySetInnerHTML={{ __html: blog.content || "" }}
        />

        <style>{`
          .blog-article-content img {
            max-width: 100%;
            height: auto;
            border-radius: 14px;
            margin: 28px 0;
          }
          .blog-article-content p {
            margin-bottom: 20px;
          }
          .blog-article-content h2 {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            margin: 40px 0 16px;
            letter-spacing: -0.02em;
          }
          .blog-article-content h3 {
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
            margin: 32px 0 12px;
          }
          .blog-article-content ul {
            list-style-type: disc;
            padding-left: 32px;
            margin-bottom: 24px;
          }
          .blog-article-content ol {
            list-style-type: decimal;
            padding-left: 32px;
            margin-bottom: 24px;
          }
          .blog-article-content li {
            margin-bottom: 12px;
            padding-left: 8px;
            list-style-position: outside;
          }
          /* Remove default margins from paragraphs inside list items so they don't break alignment */
          .blog-article-content li > p {
            margin: 0;
            display: inline;
          }
          .blog-article-content blockquote {
            border-left: 4px solid #163060;
            padding: 16px 20px;
            margin: 24px 0;
            background: #f8fafc;
            border-radius: 0 12px 12px 0;
            font-style: italic;
            color: #475569;
          }
          .blog-article-content pre {
            background: #0f172a;
            color: #e2e8f0;
            padding: 20px 24px;
            border-radius: 14px;
            overflow-x: auto;
            font-size: 14px;
            line-height: 1.6;
            margin: 24px 0;
          }
          .blog-article-content code {
            font-size: 14px;
          }
          .blog-article-content a {
            color: #163060;
            font-weight: 600;
            text-decoration: underline;
            text-underline-offset: 2px;
          }
        `}</style>
      </article>

      {/* ── PDF error toast ── */}
      {pdfError && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#7f1d1d", color: "#fff", padding: "12px 24px", borderRadius: 12,
          fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span>{pdfError}</span>
          <button onClick={() => setPdfError("")} style={{
            background: "none", border: "none", color: "#fca5a5", cursor: "pointer",
            fontSize: 16, fontWeight: 700, padding: "0 4px", lineHeight: 1,
          }}>&times;</button>
        </div>
      )}

      {/* ── Spinner animation & Responsive CSS ── */}
      <style>{`
        @keyframes pdfSpin { to { transform: rotate(360deg); } }
        .pdf-spinner { animation: pdfSpin 0.8s linear infinite; }

        @media (max-width: 768px) {
          .breadcrumbs-wrapper {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            padding: 14px 16px !important;
          }
          .breadcrumbs-list {
            flex-wrap: nowrap !important;
            width: 100%;
          }
          .breadcrumb-current {
            max-width: calc(100vw - 120px) !important;
          }
          .download-pdf-btn {
            align-self: flex-end !important;
          }
          .article-container {
            padding: 0 16px 40px !important;
          }
          .article-header {
            padding-top: 24px !important;
            margin-bottom: 24px !important;
          }
          .article-cover {
            border-radius: 8px !important;
            margin-bottom: 24px !important;
          }
          .article-excerpt {
            font-size: 15px !important;
            margin-bottom: 16px !important;
          }
          .blog-article-content {
            font-size: 15px !important;
            line-height: 1.7 !important;
          }
        }
      `}</style>

      <LandingFooter />
    </div>
  );
}
