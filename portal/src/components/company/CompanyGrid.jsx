import React, { memo } from 'react';
import CompanyCard from './CompanyCard';

function CompanyGrid({ companies, userId }) {
  if (!companies || companies.length === 0) return null;

  return (
    <div className="cp-grid" role="list" aria-label="Companies listing">
      {companies.map((company) => (
        <div key={company.id} role="listitem">
          <CompanyCard company={company} userId={userId} />
        </div>
      ))}
    </div>
  );
}

export default memo(CompanyGrid);
