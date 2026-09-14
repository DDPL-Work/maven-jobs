export const COMMON_ROLES = [
  'Software Engineer', 'Senior Software Engineer', 'Staff Software Engineer', 'Principal Software Engineer',
  'Lead Engineer', 'Tech Lead', 'Engineering Manager', 'Director of Engineering', 'VP of Engineering', 'CTO',
  'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Mobile App Developer', 'iOS Developer', 'Android Developer',
  'DevOps Engineer', 'Site Reliability Engineer (SRE)', 'Cloud Architect', 'Systems Administrator',
  'Product Manager', 'Senior Product Manager', 'Product Owner', 'Scrum Master', 'Agile Coach',
  'Data Scientist', 'Data Analyst', 'Data Engineer', 'Machine Learning Engineer', 'AI Researcher',
  'UI/UX Designer', 'Product Designer', 'Graphic Designer', 'Web Designer', 'UX Researcher',
  'QA Engineer', 'Automation Test Engineer', 'Manual Tester', 'SDET (Software Development Engineer in Test)',
  'Security Engineer', 'Penetration Tester', 'Cybersecurity Analyst', 'Information Security Manager',
  'Network Engineer', 'Database Administrator (DBA)', 'IT Support Specialist', 'Help Desk Technician',
  'Business Analyst', 'Systems Analyst', 'Solutions Architect', 'Enterprise Architect',
  'Marketing Manager', 'Digital Marketing Specialist', 'SEO Specialist', 'Content Writer', 'Copywriter',
  'Sales Manager', 'Account Executive', 'Business Development Representative (BDR)', 'Customer Success Manager',
  'HR Manager', 'Technical Recruiter', 'Talent Acquisition Specialist', 'Operations Manager', 'Project Manager'
];

export const INDUSTRIES = [
  { label: 'Software Product', value: 'Software Product' },
  { label: 'IT Services & Consulting', value: 'IT Services & Consulting' },
  { label: 'Financial Services & Fintech', value: 'Financial Services & Fintech' },
  { label: 'Banking & Insurance', value: 'Banking & Insurance' },
  { label: 'E-Learning / EdTech', value: 'E-Learning / EdTech' },
  { label: 'Healthcare & HealthTech', value: 'Healthcare & HealthTech' },
  { label: 'E-commerce & Retail', value: 'E-commerce & Retail' },
  { label: 'Manufacturing & Industrial', value: 'Manufacturing & Industrial' },
  { label: 'Telecommunications', value: 'Telecommunications' },
  { label: 'Media & Entertainment', value: 'Media & Entertainment' },
  { label: 'Real Estate & PropTech', value: 'Real Estate & PropTech' },
  { label: 'Travel & Hospitality', value: 'Travel & Hospitality' },
  { label: 'Logistics & Supply Chain', value: 'Logistics & Supply Chain' },
  { label: 'Automotive & Mobility', value: 'Automotive & Mobility' },
  { label: 'Energy & Utilities', value: 'Energy & Utilities' },
  { label: 'Aerospace & Defense', value: 'Aerospace & Defense' },
  { label: 'Agriculture & AgriTech', value: 'Agriculture & AgriTech' },
  { label: 'Government & Public Administration', value: 'Government & Public Administration' },
  { label: 'Non-Profit & NGO', value: 'Non-Profit & NGO' },
  { label: 'Legal & Compliance', value: 'Legal & Compliance' }
].sort((a, b) => a.label.localeCompare(b.label));

export const DEPARTMENTS = [
  { label: 'Engineering - Software & QA', value: 'Engineering - Software & QA' },
  { label: 'Engineering - Hardware & Systems', value: 'Engineering - Hardware & Systems' },
  { label: 'Product Management', value: 'Product Management' },
  { label: 'Data Science & Analytics', value: 'Data Science & Analytics' },
  { label: 'Design & UX', value: 'Design & UX' },
  { label: 'Information Technology (IT) & Security', value: 'Information Technology (IT) & Security' },
  { label: 'Sales & Business Development', value: 'Sales & Business Development' },
  { label: 'Marketing & Communications', value: 'Marketing & Communications' },
  { label: 'Customer Success & Support', value: 'Customer Success & Support' },
  { label: 'Human Resources (HR) & Talent', value: 'Human Resources (HR) & Talent' },
  { label: 'Finance & Accounting', value: 'Finance & Accounting' },
  { label: 'Operations & Logistics', value: 'Operations & Logistics' },
  { label: 'Legal & Compliance', value: 'Legal & Compliance' },
  { label: 'Research & Development (R&D)', value: 'Research & Development (R&D)' },
  { label: 'Executive Management / Leadership', value: 'Executive Management / Leadership' }
].sort((a, b) => a.label.localeCompare(b.label));

export const ROLE_CATEGORIES = [
  { label: 'Software Development', value: 'Software Development' },
  { label: 'Quality Assurance & Testing', value: 'Quality Assurance & Testing' },
  { label: 'System Design & Architecture', value: 'System Design & Architecture' },
  { label: 'Product Management', value: 'Product Management' },
  { label: 'Data Engineering & Analytics', value: 'Data Engineering & Analytics' },
  { label: 'Artificial Intelligence & Machine Learning', value: 'Artificial Intelligence & Machine Learning' },
  { label: 'DevOps & Cloud Infrastructure', value: 'DevOps & Cloud Infrastructure' },
  { label: 'Cybersecurity & Risk', value: 'Cybersecurity & Risk' },
  { label: 'UI/UX & Graphic Design', value: 'UI/UX & Graphic Design' },
  { label: 'Project & Program Management', value: 'Project & Program Management' },
  { label: 'Sales & Account Management', value: 'Sales & Account Management' },
  { label: 'Digital Marketing & SEO', value: 'Digital Marketing & SEO' },
  { label: 'Customer Support & Success', value: 'Customer Support & Success' },
  { label: 'Human Resources & Recruitment', value: 'Human Resources & Recruitment' },
  { label: 'Finance, Audit & Taxation', value: 'Finance, Audit & Taxation' },
  { label: 'Operations & Administration', value: 'Operations & Administration' },
  { label: 'Legal Counsel & Compliance', value: 'Legal Counsel & Compliance' },
  { label: 'Content Creation & Writing', value: 'Content Creation & Writing' }
].sort((a, b) => a.label.localeCompare(b.label));

export const JOB_ROLES = COMMON_ROLES.map(role => ({ label: role, value: role })).sort((a, b) => a.label.localeCompare(b.label));
