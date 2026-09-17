import React from 'react';
import EmployerLayout from './EmployerLayout';
import notAllowedImg from '../../../assets/notAllowed.png';

export default function AccessDenied({ superUserEmail, requiredPermission }) {
  const featureMap = {
    resdex: 'Resdex',
    jobPosting: 'Job Posting',
    jobBooster: 'Job Booster'
  };
  const featureName = featureMap[requiredPermission] || 'this feature';

  return (
    <EmployerLayout activeTab="">
      <div className="flex flex-col items-center justify-center min-h-[65vh] text-center font-sans p-5">
        <div className="mb-8 relative w-[280px] h-[180px]">
          <img src={notAllowedImg} alt="Access Denied" className="w-full h-full object-contain" />
        </div>

        <h2 className="text-[#0f172a] text-[18px] sm:text-[20px] font-bold mb-2">
          It seems your Superuser has not given you access to <br /> {featureName}
        </h2>
        <p className="text-[#475569] text-[14px] font-medium mt-1">
          In case you need {featureName} access, contact your Superuser (<a href={`mailto:${superUserEmail}`} className="text-[#2563eb] hover:underline font-medium">{superUserEmail || 'Administrator'}</a>).
        </p>
      </div>
    </EmployerLayout>
  );
}
