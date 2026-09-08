import React from 'react';
import ResumeSection from './ResumeSection';
import AboutSection from './AboutSection';
import ExperienceSection from './ExperienceSection';
import EducationSection from './EducationSection';
import SkillsSection from './SkillsSection';
import ProjectsSection from './ProjectsSection';
import CareerProfileSection from './CareerProfileSection';

const ProfileSections = React.memo(({ user, onEdit, onSave }) => {
  return (
    <div className="ps-sections">
      <ResumeSection user={user} />
      <AboutSection user={user} onEdit={onEdit} onSave={onSave} />
      <ExperienceSection user={user} onEdit={onEdit} onSave={onSave} />
      <EducationSection user={user} onEdit={onEdit} onSave={onSave} />
      <SkillsSection user={user} onEdit={onEdit} onSave={onSave} />
      <ProjectsSection user={user} onEdit={onEdit} onSave={onSave} />
      <CareerProfileSection user={user} onEdit={onEdit} onSave={onSave} />
    </div>
  );
});

export default ProfileSections;
