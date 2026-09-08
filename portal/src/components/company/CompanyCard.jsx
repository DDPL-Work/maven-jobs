import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBriefcase, FiCheckCircle, FiArrowRight,
  FiStar, FiUsers, FiPlus, FiCheck
} from 'react-icons/fi';
import { useAuth } from '../../AuthContext';
import { useFollowCompany } from '../../hooks/useCandidateMutations';

const formatCount = (val) => {
  if (val == null || val === '') return '0';
  if (typeof val === 'string' && /[a-zA-Z]/.test(val)) return val;
  const n = Number(val);
  if (Number.isNaN(n)) return '0';
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
};

const formatRating = (val) => {
  if (val == null || val === '') return '0.0';
  const n = Number(val);
  return Number.isNaN(n) ? '0.0' : n.toFixed(1);
};

function CompanyCard({ company, userId }) {
  const navigate = useNavigate();
  const { user, openLogin } = useAuth();
  const followMutation = useFollowCompany(userId);

  const hasRating = company.rating != null;
  const rating = hasRating ? company.rating : 0;
  const reviewCount = company.reviewCount ?? 0;
  const hasReviews = reviewCount > 0;
  const employees = company.employees ?? null;
  const founded = company.founded ?? null;
  const location = company.location || 'Remote';
  const jobCount = company.activeJobCount ?? 0;
  const followersCount = company.followers ?? 0;
  const industry = company.industry || null;
  const isFollowing = Boolean(company.isFollowing);

  const handleFollowClick = useCallback((e) => {
    e.stopPropagation();
    if (!user) {
      openLogin();
      return;
    }
    followMutation.mutate({ companyId: company.id, follow: !isFollowing });
  }, [user, openLogin, followMutation, company.id, isFollowing]);

  return (
    <article
      className="cp-card"
      onClick={() => navigate(`/company/${company.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/company/${company.id}`); }}
      aria-label={`${company.name} — ${industry || 'company'} in ${location}`}
    >
      <div className="cp-card__accent" />
      {company.coverImageUrl && (
        <div className="cp-card__cover">
          <img src={company.coverImageUrl} alt="" className="cp-card__cover-img" aria-hidden="true" loading="lazy" />
          <div className="cp-card__cover-fade" />
        </div>
      )}

      {/* Row 1: Logo + Header */}
      <div className="cp-card__top">
        <div
          className={`cp-card__logo ${company.logoUrl ? 'cp-card__logo--image' : ''}`}
          style={!company.logoUrl ? { background: company.color || '#002366', color: '#fff' } : undefined}
        >
          {company.logoUrl
            ? <img src={company.logoUrl} alt={`${company.name} logo`} loading="lazy" />
            : (company.logo || company.name?.[0]?.toUpperCase() || 'C')}
        </div>
        <div className="cp-card__header">
          <div className="cp-card__title-row">
            <h3 className="cp-card__name">{company.name}</h3>
            <span className="cp-card__verified" aria-label="Verified company">
              <FiCheckCircle size={9} />
              Verified
            </span>
          </div>
          <div className="cp-card__subtitle">
            {[industry, location].filter(Boolean).join(' • ')}
          </div>
          {(employees || founded) && (
            <div className="cp-card__chips">
              {employees && (
                <span className="cp-card__chip">{employees}</span>
              )}
              {founded && (
                <span className="cp-card__chip">Est. {founded}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Metrics */}
      <div className="cp-card__metrics">
        {hasReviews ? (
          <div className="cp-card__metric" aria-label={`${rating} out of 5 stars`}>
            <div className="cp-card__metric-stars">
              {[1, 2, 3, 4, 5].map((s) => (
                <FiStar
                  key={s}
                  size={12}
                  className={`cp-card__metric-star ${s <= Math.round(rating) ? 'cp-card__metric-star--filled' : ''}`}
                />
              ))}
            </div>
            <span className="cp-card__metric-value">{formatRating(rating)}</span>
            <span className="cp-card__metric-label">({formatCount(reviewCount)})</span>
          </div>
        ) : (
          <div className="cp-card__metric cp-card__metric--empty">
            <FiStar size={12} className="cp-card__metric-star--muted" />
            <span className="cp-card__metric-label">No reviews yet</span>
          </div>
        )}
        <div className="cp-card__metric">
          <FiUsers size={13} className="cp-card__metric-icon" />
          <span className="cp-card__metric-value">{formatCount(followersCount)}</span>
          <span className="cp-card__metric-label">Followers</span>
        </div>
        <div className="cp-card__metric">
          <FiBriefcase size={13} className="cp-card__metric-icon" />
          <span className="cp-card__metric-value">{formatCount(jobCount)}</span>
          <span className="cp-card__metric-label">Active Jobs</span>
        </div>
      </div>

      {/* Row 3: Tags */}
      <div className="cp-card__tags">
        {industry && <span className="cp-card__tag">{industry}</span>}
        {company.packageType && <span className="cp-card__tag cp-card__tag--accent">{company.packageType}</span>}
        <span className={`cp-card__tag ${company.activelyHiring ? 'cp-card__tag--hiring' : 'cp-card__tag--muted'}`}>
          {company.activelyHiring ? 'Actively Hiring' : 'Remote Friendly'}
        </span>
      </div>

      {/* Row 4: Actions — pushed to bottom */}
      <div className="cp-card__actions">
        <button
          className={`cp-card__btn ${isFollowing ? 'cp-card__btn--following' : 'cp-card__btn--outline'}`}
          onClick={handleFollowClick}
          disabled={followMutation.isPending}
          aria-label={isFollowing ? `Unfollow ${company.name}` : `Follow ${company.name}`}
        >
          {isFollowing ? <FiCheck size={14} /> : <FiPlus size={14} />}
          {isFollowing ? 'Following' : 'Follow'}
        </button>
        <button
          className="cp-card__btn cp-card__btn--solid"
          onClick={(e) => { e.stopPropagation(); navigate(`/company/${company.id}`); }}
          aria-label={`View jobs at ${company.name}`}
        >
          View Jobs
          <FiArrowRight size={14} />
        </button>
      </div>
    </article>
  );
}

export default memo(CompanyCard);
