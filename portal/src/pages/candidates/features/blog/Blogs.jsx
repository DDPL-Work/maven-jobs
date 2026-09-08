import { useEffect, useMemo, useState } from "react";
import { LuArrowRight, LuBookOpen, LuClock, LuChevronRight } from "react-icons/lu";
import { Link, useLocation } from "react-router-dom";
import { usePublishedBlogs, useBlogCategories } from "../../../../hooks/useCandidateQueries";
import SkeletonPage from "../../../../components/Skeleton";
import LandingFooter from "../../../../components/LandingFooter";
import CandidateHeader from "../../../../components/common/CandidateHeader";

const ALL_CATEGORIES = "All Posts";

const BACK_LINKS = {
  "/": { label: "Home", path: "/" },
  "/profile-dashboard": { label: "Profile", path: "/profile-dashboard" },
  "/jobs": { label: "Jobs", path: "/jobs" },
  "/companies": { label: "Companies", path: "/companies" },
};

const parseReferrer = () => {
  try {
    const ref = document.referrer;
    if (!ref) return null;
    const url = new URL(ref);
    const known = Object.keys(BACK_LINKS).find(k => url.pathname === k || url.pathname.startsWith(k + "/"));
    if (known) return known;
    if (url.pathname.startsWith("/profile")) return "/profile-dashboard";
    if (url.pathname.startsWith("/jobs") || url.pathname.startsWith("/job")) return "/jobs";
    return null;
  } catch { return null; }
};

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function Blogs() {
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const [page, setPage] = useState(1);
  const [referrerPath, setReferrerPath] = useState(null);

  const blogParams = useMemo(() => {
    const params = { page, limit: 12 };
    if (activeCategory !== ALL_CATEGORIES) params.category = activeCategory;
    return params;
  }, [page, activeCategory]);

  const { data: blogsData, isLoading, error: fetchError } = usePublishedBlogs(blogParams);
  const blogs = blogsData?.blogs || [];
  const pagination = blogsData?.pagination || null;
  const { data: rawCategories = [] } = useBlogCategories();
  const categories = [ALL_CATEGORIES, ...(Array.isArray(rawCategories) ? rawCategories : [])];

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
    if (referrerPath && referrerPath !== "/") {
      crumbs.push(BACK_LINKS[referrerPath] || { label: "Previous", path: referrerPath });
    }
    crumbs.push({ label: "Blogs", path: null });
    return crumbs;
  }, [referrerPath]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory]);

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <CandidateHeader />
      {/* <div
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #eef2f6",
          padding: "12px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
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
                <span style={{ color: "#0f172a", fontWeight: 700 }}>{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      </div> */}
      <div
        style={{
          background: "linear-gradient(135deg, #163060 0%, #1a3a7a 100%)",
          padding: "48px 24px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: 800,
            color: "#ffffff",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Maven Knowledge Hub
        </h1>
        <p
          style={{
            marginTop: 12,
            fontSize: 16,
            color: "#a0b4d6",
            maxWidth: 560,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.6,
          }}
        >
          Insights, guides, and updates to accelerate your career journey.
        </p>
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 8,
            marginBottom: 32,
            WebkitOverflowScrolling: "touch",
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "8px 20px",
                borderRadius: 100,
                border: "none",
                fontSize: 13,
                fontWeight: activeCategory === cat ? 700 : 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
                backgroundColor:
                  activeCategory === cat ? "#163060" : "#ffffff",
                color: activeCategory === cat ? "#ffffff" : "#475569",
                boxShadow:
                  activeCategory === cat
                    ? "0 4px 12px rgba(22,48,96,0.3)"
                    : "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <SkeletonPage variant="blogs" />
        ) : fetchError ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "#dc2626",
            }}
          >
            <p style={{ fontSize: 16, fontWeight: 600 }}>{String(fetchError?.message || fetchError || "")}</p>
          </div>
        ) : blogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <LuBookOpen size={48} color="#94a3b8" />
            <p
              style={{
                marginTop: 16,
                fontSize: 18,
                fontWeight: 600,
                color: "#475569",
              }}
            >
              No articles yet
            </p>
            <p style={{ marginTop: 8, fontSize: 14, color: "#94a3b8" }}>
              Check back soon for new content.
            </p>
          </div>
        ) : (
          <>
            {blogs.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 20,
                }}
              >
                {blogs.map((blog) => (
                  <Link
                    key={blog.id}
                    to={`/blogs/${blog.slug}`}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      borderRadius: 12,
                      overflow: "hidden",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 1px 6px rgba(15,23,42,0.06)",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(15,23,42,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "0 1px 6px rgba(15,23,42,0.06)";
                    }}
                  >
                    <div
                      style={{
                        height: 148,
                        overflow: "hidden",
                        backgroundColor: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {blog.coverImage?.url ? (
                        <img
                          src={blog.coverImage.url}
                          alt={blog.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.3s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                        />
                      ) : (
                        <LuBookOpen size={24} color="#cbd5e1" />
                      )}
                    </div>
                    <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            color: "#163060",
                            backgroundColor: "#eef2ff",
                            padding: "2px 8px",
                            borderRadius: 100,
                          }}
                        >
                          {blog.category}
                        </span>
                        {blog.metadata?.readTimeMinutes ? (
                          <span
                            style={{
                              fontSize: 10,
                              color: "#94a3b8",
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <LuClock size={10} />
                            {blog.metadata.readTimeMinutes} min
                          </span>
                        ) : null}
                      </div>
                      <h3
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0f172a",
                          margin: "0 0 4px 0",
                          lineHeight: 1.35,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {blog.title}
                      </h3>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          lineHeight: 1.5,
                          margin: 0,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {blog.excerpt || blog.content?.replace(/<[^>]*>/g, "").slice(0, 120)}
                      </p>
                      <div
                        style={{
                          marginTop: "auto",
                          paddingTop: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: 10,
                          color: "#94a3b8",
                        }}
                      >
                        <span>{formatDate(blog.publishedAt)}</span>
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#163060",
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: 11,
                          }}
                        >
                          Read <LuArrowRight size={11} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}

            {pagination && pagination.totalPages > 1 ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 12,
                  marginTop: 40,
                }}
              >
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#ffffff",
                    fontSize: 14,
                    fontWeight: 600,
                    color: page <= 1 ? "#cbd5e1" : "#475569",
                    cursor: page <= 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Previous
                </button>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: 14,
                    color: "#94a3b8",
                  }}
                >
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#ffffff",
                    fontSize: 14,
                    fontWeight: 600,
                    color:
                      page >= pagination.totalPages ? "#cbd5e1" : "#475569",
                    cursor:
                      page >= pagination.totalPages
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        )}

      </div>
        <LandingFooter />
    </div>
  );
}
