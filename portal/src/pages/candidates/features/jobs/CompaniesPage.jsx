import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { gsap } from 'gsap';
import {
  FiSearch, FiMapPin, FiBriefcase, FiChevronDown, FiChevronRight, FiChevronLeft,
  FiFilter, FiCheckCircle, FiX, FiAward,
  FiZap, FiGlobe, FiLayers, FiBox
} from 'react-icons/fi';
import { useAuth } from '../../../../AuthContext';
import { useCandidateCompanies, useCompanyStats, useCompanyFilterOptions } from '../../../../hooks/useCandidateQueries';
import useCompanyFilters from '../../../../hooks/useCompanyFilters';
import LandingHeader from '../../../../layout/candidate/LandingHeader';
import LandingFooter from '../../../../layout/candidate/LandingFooter';
import SkeletonPage from '../../../../components/Skeleton';
import CompanyGrid from '../../../../components/company/CompanyGrid';
import './CompaniesPage.css';

const COMPANIES_PER_PAGE = 6;


const COMPANY_FILTER_CATEGORIES = [
  { id: 'industry', label: 'Industry' },
  { id: 'location', label: 'Location' },
  { id: 'companyType', label: 'Company Type' },
];

const CATEGORY_URL_MAP = {
  industry: 'industry',
  location: 'location',
  companyType: 'companyType',
};

const sortOptions = [
  { label: 'Most Popular', value: 'popular' },
  { label: 'Name (A-Z)', value: 'name' },
  { label: 'Recently Added', value: 'newest' },
];

export default function CompaniesPage() {
  const navigate = useNavigate();
  const { filter: routeFilter = '' } = useParams();
  const { user } = useAuth();

  const [showSort, setShowSort] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [locSearch, setLocSearch] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(null);
  const [draftFilters, setDraftFilters] = useState({});
  const [modalSearch, setModalSearch] = useState('');

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const { filters, mergeParams, toggleFilter, clearAll, hasActiveFilters } = useCompanyFilters();

  const currentPage = Number(filters.page) || 1;
  const sortBy = filters.sort || 'popular';

  const statsParams = useMemo(() => {
    const params = {};
    if (filters.q) params.q = filters.q;
    if (filters.location?.length) params.location = filters.location.join(',');
    return params;
  }, [filters.q, filters.location]);

  const { data: stats = {} } = useCompanyStats(statsParams, true);
  const { data: rawFilterOptions = {} } = useCompanyFilterOptions(true);

  const filterOptions = useMemo(() => ({
    industries: rawFilterOptions.industries || [],
    cities: rawFilterOptions.cities || [],
    companyTypes: rawFilterOptions.companyTypes || [],
  }), [rawFilterOptions]);

  const categories = useMemo(() => {
    if (Array.isArray(stats?.categories) && stats.categories.length > 0) {
      return stats.categories;
    }
    if (Array.isArray(rawFilterOptions?.industries) && rawFilterOptions.industries.length > 0) {
      return rawFilterOptions.industries.map(ind => ({
        id: ind,
        label: ind,
        count: stats?.[ind.toLowerCase()] ?? 0,
        industryMatch: ind,
      }));
    }
    const fallback = [];
    if (stats?.manufacturing > 0) fallback.push({ id: 'Manufacturing', label: 'Manufacturing', count: stats.manufacturing, industryMatch: 'Manufacturing' });
    if (stats?.internet > 0) fallback.push({ id: 'Internet', label: 'Internet', count: stats.internet, industryMatch: 'Internet|IT|Software' });
    if (stats?.mncs > 0) fallback.push({ id: 'MNCs', label: 'MNCs', count: stats.mncs, industryMatch: 'MNC' });
    if (stats?.product > 0) fallback.push({ id: 'Product', label: 'Product', count: stats.product, industryMatch: 'Product' });
    if (stats?.fortune500 > 0) fallback.push({ id: 'Fortune 500', label: 'Fortune 500', count: stats.fortune500, packageMatch: 'ELITE' });
    return fallback;
  }, [stats, rawFilterOptions]);

  const apiParams = useMemo(() => {
    const params = { page: currentPage, limit: COMPANIES_PER_PAGE };
    if (filters.q) params.q = filters.q;

    // Combine any sidebar industry filters with active category tab
    const indList = [...(filters.industry || [])];
    if (activeCategory && activeCategory !== 'All') {
      const selectedCat = categories.find(c => c.id === activeCategory);
      if (selectedCat) {
        if (selectedCat.industryMatch && !indList.includes(selectedCat.industryMatch)) {
          indList.push(selectedCat.industryMatch);
        }
        if (selectedCat.packageMatch) {
          params.packageType = selectedCat.packageMatch;
        }
      } else if (!indList.includes(activeCategory)) {
        indList.push(activeCategory);
      }
    }
    if (indList.length > 0) {
      params.industry = indList.join(',');
    }

    if (filters.location?.length) params.location = filters.location.join(',');
    if (filters.companyType?.length) params.companyType = filters.companyType.join(',');
    if (sortBy !== 'popular') params.sort = sortBy;
    return params;
  }, [filters, currentPage, sortBy, activeCategory, categories]);

  const { data: companiesData, isLoading: loading, isFetching } = useCandidateCompanies(apiParams, true);

  const companies = companiesData?.companies || [];
  const totalCompanies = companiesData?.total || 0;
  const totalPages = companiesData?.totalPages || 1;

  const allCategoryTabs = useMemo(() => {
    const totalCount = stats?.total ?? totalCompanies;
    const seen = new Set(['all']);
    const sanitizedCategories = (categories || []).filter(c => {
      if (!c || !c.id) return false;
      const key = String(c.id).trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return [
      {
        id: 'All',
        label: 'All Companies',
        count: totalCount,
        isAll: true,
      },
      ...sanitizedCategories,
    ];
  }, [categories, stats?.total, totalCompanies]);

  const handleCategoryTabClick = useCallback((catId) => {
    setActiveCategory(prev => (prev === catId ? 'All' : catId));
    if (currentPage > 1) {
      mergeParams({ page: null });
    }
  }, [currentPage, mergeParams]);

  useEffect(() => {
    if (routeFilter) {
      mergeParams({ q: routeFilter });
    }
  }, []);

  const handleSortChange = useCallback((value) => {
    mergeParams({ sort: value, page: null });
    setShowSort(false);
  }, [mergeParams]);

  const handlePageChange = useCallback((page) => {
    const pageNum = Number(page);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages || pageNum === currentPage) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    mergeParams({ page: pageNum <= 1 ? null : String(pageNum) });
  }, [totalPages, currentPage, mergeParams]);

  const handleCategoryClick = useCallback((catId) => {
    setActiveCategory(prev => prev === catId ? 'All' : catId);
  }, []);

  const handleClearAll = useCallback(() => {
    setActiveCategory('All');
    clearAll();
  }, [clearAll]);

  const openFilterModal = useCallback((cat) => {
    setShowFilterModal(cat);
    setDraftFilters({ [CATEGORY_URL_MAP[cat.id]]: [...(filters[CATEGORY_URL_MAP[cat.id]] || [])] });
    setModalSearch('');
  }, [filters]);

  const toggleDraftFilter = useCallback((key, value) => {
    setDraftFilters(prev => {
      const current = prev[key] || [];
      return {
        ...prev,
        [key]: current.includes(value) ? current.filter(v => v !== value) : [...current, value],
      };
    });
  }, []);

  const applyModalFilters = useCallback(() => {
    for (const [key, values] of Object.entries(draftFilters)) {
      if (values.length > 0) mergeParams({ [key]: values });
      else mergeParams({ [key]: null });
    }
    setShowFilterModal(null);
    setIsMobileFiltersOpen(false);
  }, [draftFilters, mergeParams]);

  const getFilterOptions = (catId) => {
    if (catId === 'industry') return filterOptions.industries;
    if (catId === 'location') return filterOptions.cities;
    if (catId === 'companyType') return filterOptions.companyTypes;
    return [];
  };

  const filteredModalOptions = useMemo(() => {
    if (!showFilterModal) return [];
    const opts = getFilterOptions(CATEGORY_URL_MAP[showFilterModal.id]);
    if (!modalSearch) return opts;
    return opts.filter(o => o.toLowerCase().includes(modalSearch.toLowerCase()));
  }, [showFilterModal, modalSearch, filterOptions]);

  const buildPagination = useCallback(() => {
    const pages = [];
    const cur = Number(currentPage) || 1;
    const total = Number(totalPages) || 1;
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (cur > 3) pages.push('...');
      const start = Math.max(2, cur - 1);
      const end = Math.min(total - 1, cur + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (cur < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  }, [totalPages, currentPage]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    COMPANY_FILTER_CATEGORIES.forEach(cat => {
      count += (filters[CATEGORY_URL_MAP[cat.id]] || []).length;
    });
    return count;
  }, [filters]);

  const openMobileFilters = () => {
    setIsMobileFiltersOpen(true);
    setTimeout(() => {
      const drawer = document.querySelector('.cp-sidebar.open');
      const card = drawer?.querySelector('.cp-filter-card');
      if (drawer) drawer.scrollTop = 0;
      if (card) card.scrollTop = 0;
    }, 200);
  };

  const closeMobileFilters = () => setIsMobileFiltersOpen(false);

  useEffect(() => {
    if (isMobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileFiltersOpen]);

  return (
    <div className="cp-root">
      <LandingHeader />

      <main className="cp-main">
        <div className="cp-hero">
          <div className="cp-hero-left">
            <div className="cp-eyebrow">
              <span className="cp-eyebrow-dot"></span>
              Discover Excellence
            </div>
            <h1 className="cp-title">Top Companies: <span className="cp-title-accent">{totalCompanies.toLocaleString()}+ companies hiring</span></h1>
            <p className="cp-subtitle">Explore companies across industries and find your next career move.</p>
          </div>
        </div>

        <div className="cp-top-categories-wrapper">
          <div className="cp-top-categories-inner">
            <button
              className="cp-cat-nav cp-cat-nav--prev"
              onClick={() => {
                const el = document.getElementById("cp-cat-track");
                if (el) el.scrollBy({ left: -220, behavior: "smooth" });
              }}
              aria-label="Scroll left"
            >
              &#8249;
            </button>

            <div className="cp-cat-track" id="cp-cat-track">
              {allCategoryTabs.map((cat) => {
                const isActive = activeCategory === cat.id;
                const countLabel = `${cat.count} ${cat.count === 1 ? 'Company' : 'Companies'}`;
                return (
                  <button
                    key={cat.id}
                    className={`cp-top-category-chip${isActive ? ' active' : ''}`}
                    onClick={() => handleCategoryTabClick(cat.id)}
                  >
                    {cat.label} ({countLabel})
                  </button>
                );
              })}
            </div>

            <button
              className="cp-cat-nav cp-cat-nav--next"
              onClick={() => {
                const el = document.getElementById("cp-cat-track");
                if (el) el.scrollBy({ left: 220, behavior: "smooth" });
              }}
              aria-label="Scroll right"
            >
              &#8250;
            </button>
          </div>
        </div>

        <div className="cp-mobile-filter-bar">
          <button
            className={`cp-mobile-filter-btn cp-mobile-filter-btn--primary${activeFilterCount > 0 ? " active" : ""}`}
            onClick={() => openMobileFilters()}
          >
            <FiFilter size={14} style={{ flexShrink: 0 }} /> All Filters
            {activeFilterCount > 0 && (
              <span className="cp-mobile-filter-count">{activeFilterCount}</span>
            )}
          </button>
          {COMPANY_FILTER_CATEGORIES.map(cat => {
            const urlKey = CATEGORY_URL_MAP[cat.id];
            const count = (filters[urlKey] || []).length;
            return (
              <button
                key={cat.id}
                className={`cp-mobile-filter-btn${count > 0 ? " active" : ""}`}
                onClick={() => openMobileFilters()}
              >
                {cat.label}
                {count > 0 && <span className="cp-mobile-filter-count">{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="cp-layout">
          <aside className={`cp-sidebar${isMobileFiltersOpen ? ' open' : ''}`}>
            <div className="cp-filter-card">
              <div className="cp-filter-header">
                <div className="cp-filter-title-row">
                  <FiFilter size={15} className="cp-filter-icon" />
                  <h2 className="cp-filter-heading">Filters</h2>
                  {activeFilterCount > 0 && (
                    <span className="cp-filter-badge">{activeFilterCount}</span>
                  )}
                </div>
                <div className="cp-filter-header-actions">
                  {activeFilterCount > 0 && (
                    <button className="cp-clear-btn" onClick={handleClearAll}>Clear all</button>
                  )}
                  <button className="cp-sidebar-close" onClick={closeMobileFilters} aria-label="Close filters">
                    <FiX size={16} />
                  </button>
                </div>
              </div>

              {COMPANY_FILTER_CATEGORIES.map(cat => {
                const urlKey = CATEGORY_URL_MAP[cat.id];
                const options = getFilterOptions(urlKey);
                const selected = filters[urlKey] || [];
                const visibleCount = 5;
                const hasMore = options.length > visibleCount;
                const displayOptions = hasMore ? options.slice(0, visibleCount) : options;

                if (options.length === 0) return null;

                return (
                  <div key={cat.id} className="cp-filter-group">
                    <h4 className="cp-filter-group-label">{cat.label}</h4>
                    {cat.id === 'location' && (
                      <div className="cp-filter-search-wrap">
                        <FiSearch size={13} className="cp-filter-search-icon" />
                        <input
                          type="text"
                          placeholder="Search city..."
                          className="cp-filter-search-input"
                          value={locSearch}
                          onChange={(e) => setLocSearch(e.target.value)}
                        />
                      </div>
                    )}
                    {(cat.id === 'location' && locSearch
                      ? options.filter(o => o.toLowerCase().includes(locSearch.toLowerCase())).slice(0, 8)
                      : displayOptions
                    ).map(item => {
                      const isChecked = selected.includes(item);
                      return (
                        <label
                          key={item}
                          className={`cp-checkbox-item ${isChecked ? 'checked' : ''}`}
                          onClick={() => toggleFilter(urlKey, item)}
                        >
                          <div className={`cp-checkbox ${isChecked ? 'checked' : ''}`}>
                            {isChecked && <FiCheckCircle size={11} />}
                          </div>
                          <span className="cp-checkbox-label">{item}</span>
                        </label>
                      );
                    })}
                    {hasMore && (
                      <div className="cp-filter-more" onClick={() => openFilterModal(cat)}>
                        +{options.length - visibleCount} more {cat.label.toLowerCase()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          <div
            className={`cp-sidebar-overlay${isMobileFiltersOpen ? ' open' : ''}`}
            onClick={closeMobileFilters}
          />

          <section className="cp-center">
            <div className="cp-results-bar">
              <div>
                <div className="cp-results-title">
                  {loading ? 'Loading Companies...' : totalCompanies > 0 ? `${totalCompanies.toLocaleString()} Companies Found` : 'No Companies Found'}
                </div>
                <div className="cp-results-sub">Explore top hiring companies</div>
              </div>
              <div className="cp-sort-row">
                <span className="cp-sort-label">Sort by:</span>
                <div className="cp-sort-wrapper">
                  <button className="cp-sort-btn" onClick={() => setShowSort(!showSort)}>
                    {sortOptions.find(o => o.value === sortBy)?.label || 'Most Popular'} <FiChevronDown size={14} />
                  </button>
                  {showSort && (
                    <div className="cp-sort-dropdown">
                      {sortOptions.map(opt => (
                        <div key={opt.value} onClick={() => handleSortChange(opt.value)}>{opt.label}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>


            {loading ? (
              <SkeletonPage variant="grid" />
            ) : companies.length === 0 ? (
              <div className="cp-empty-state">
                <FiBriefcase size={40} className="cp-empty-icon" />
                <div className="cp-empty-title">No companies found</div>
                <p className="cp-empty-desc">Try adjusting your search or filters</p>
                {activeFilterCount > 0 && (
                  <button className="cp-empty-clear" onClick={handleClearAll}>Clear all filters</button>
                )}
              </div>
            ) : (
              <div style={{ opacity: isFetching ? 0.65 : 1, transition: 'opacity 0.15s ease' }}>
                <CompanyGrid companies={companies} userId={user?.id} />
              </div>
            )}

            {totalPages > 1 && !loading && (
              <div className="cp-pagination">
                <button
                  className="cp-page-btn cp-page-nav"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <FiChevronLeft size={16} />
                </button>
                {buildPagination().map((p, i) => (
                  <button
                    key={i}
                    className={`cp-page-btn ${currentPage === p ? 'active' : ''} ${p === '...' ? 'dots' : ''}`}
                    onClick={() => handlePageChange(p)}
                    disabled={p === '...'}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="cp-page-btn cp-page-nav"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <LandingFooter />

      {showFilterModal && (
        <div className="cp-modal-overlay" onClick={() => setShowFilterModal(null)}>
          <div className="cp-modal cp-filter-modal" onClick={e => e.stopPropagation()}>
            <div className="cp-modal-header">
              <div className="cp-filter-modal-search-wrap">
                <FiSearch size={14} />
                <input
                  type="text"
                  placeholder={`Search ${showFilterModal.label.toLowerCase()}...`}
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  autoFocus
                />
                {modalSearch && (
                  <FiX size={14} className="cp-filter-modal-clear" onClick={() => setModalSearch('')} />
                )}
              </div>
              <button className="cp-modal-close" onClick={() => setShowFilterModal(null)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="cp-filter-modal-body">
              {filteredModalOptions.length === 0 ? (
                <div className="cp-filter-modal-empty">No matches found</div>
              ) : (
                filteredModalOptions.map(item => {
                  const urlKey = CATEGORY_URL_MAP[showFilterModal.id];
                  const isChecked = (draftFilters[urlKey] || []).includes(item);
                  return (
                    <label
                      key={item}
                      className={`cp-checkbox-item ${isChecked ? 'checked' : ''}`}
                      onClick={() => toggleDraftFilter(urlKey, item)}
                    >
                      <div className={`cp-checkbox ${isChecked ? 'checked' : ''}`}>
                        {isChecked && <FiCheckCircle size={11} />}
                      </div>
                      <span className="cp-checkbox-label">{item}</span>
                    </label>
                  );
                })
              )}
            </div>
            <div className="cp-filter-modal-footer">
              <button className="cp-btn cp-btn--outline" onClick={() => setShowFilterModal(null)}>Cancel</button>
              <button className="cp-btn cp-btn--fill" onClick={applyModalFilters}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

