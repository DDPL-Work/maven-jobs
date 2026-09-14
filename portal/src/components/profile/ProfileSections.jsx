import React from 'react';
import ResumeSection from './ResumeSection';
import ResumeHeadlineSection from './ResumeHeadlineSection';
import ProfileSummarySection from './ProfileSummarySection';
import ExperienceSection from './ExperienceSection';
import EducationSection from './EducationSection';
import SkillsSection from './SkillsSection';
import ITSkillsSection from './ITSkillsSection';
import ProjectsSection from './ProjectsSection';
import AccomplishmentsSection from './AccomplishmentsSection';
import CareerProfileSection from './CareerProfileSection';
import PersonalDetailsSection from './PersonalDetailsSection';
import DiversitySection from './DiversitySection';

const ProfileSections = React.memo(({ user, onSave }) => {
  return (
    <div className="ps-sections">
      <div id="resume"><ResumeSection user={user} onSave={onSave} /></div>
      <div id="resume-headline"><ResumeHeadlineSection user={user} onSave={onSave} /></div>
      <div id="profile-summary"><ProfileSummarySection user={user} onSave={onSave} /></div>
      <div id="key-skills"><SkillsSection user={user} onSave={onSave} /></div>
      <div id="employment"><ExperienceSection user={user} onSave={onSave} /></div>
      <div id="education"><EducationSection user={user} onSave={onSave} /></div>
      <div id="it-skills"><ITSkillsSection user={user} onSave={onSave} /></div>
      <div id="projects"><ProjectsSection user={user} onSave={onSave} /></div>
      <div id="accomplishments"><AccomplishmentsSection user={user} onSave={onSave} /></div>
      <div id="career-profile"><CareerProfileSection user={user} onSave={onSave} /></div>
      <div id="personal-details"><PersonalDetailsSection user={user} onSave={onSave} /></div>
      <div id="diversity"><DiversitySection user={user} onSave={onSave} /></div>
    </div>
  );
});

export default ProfileSections;
