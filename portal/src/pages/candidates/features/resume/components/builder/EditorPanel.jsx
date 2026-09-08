import React, { useState, useRef } from "react";
import {
  FiUser,
  FiBriefcase,
  FiBook,
  FiCode,
  FiAward,
  FiStar,
  FiGlobe,
  FiPlus,
  FiX,
} from "react-icons/fi";
import { FaMagic } from "react-icons/fa";
import {
  RBInput,
  RBTextarea,
  RBAccordion,
  RBCard,
  RBAddBtn,
  RemoveBtn,
} from "./BuilderPrimitives";
import { SkillsModal } from "./SkillsModal";

export function EditorPanel({ resume, setResume }) {
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const set = (key, val) => setResume((r) => ({ ...r, [key]: val }));

  const updateArr = (key, id, field, val) =>
    setResume((r) => ({
      ...r,
      [key]: r[key].map((i) => (i.id === id ? { ...i, [field]: val } : i)),
    }));
  const addItem = (key, blank) =>
    setResume((r) => ({
      ...r,
      [key]: [...r[key], { id: Date.now(), ...blank }],
    }));
  const removeItem = (key, id) =>
    setResume((r) => ({ ...r, [key]: r[key].filter((i) => i.id !== id) }));

  const photoRef = useRef(null);
  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set("photo", ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="rb-scroll" style={{ flex: 1, overflowY: "auto" }}>
      {/* Personal details — always open */}
      <RBAccordion title="Personal details" Icon={FiUser} defaultOpen>
        {/* Photo upload */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 4,
          }}
        >
          <div
            onClick={() => photoRef.current?.click()}
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              overflow: "hidden",
              border: "2px dashed #dde6f8",
              cursor: "pointer",
              flexShrink: 0,
              background: "#f7f9ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {resume.photo ? (
              <img
                src={resume.photo}
                alt="photo"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <FiUser style={{ color: "#c8d8ea", fontSize: 22 }} />
            )}
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              onChange={handlePhoto}
              style={{ display: "none" }}
            />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#0a244d" }}>
              Profile photo
            </p>
            <p style={{ fontSize: 11, color: "#8ca2c0", marginTop: 2 }}>
              Click to upload · PNG, JPG
            </p>
          </div>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <RBInput
            label="Full name"
            value={resume.name}
            onChange={(v) => set("name", v)}
            placeholder="Your full name"
          />
          <RBInput
            label="Job title"
            value={resume.title}
            onChange={(v) => set("title", v)}
            placeholder="e.g. Fullstack Developer"
          />
          <RBInput
            label="Phone"
            value={resume.phone}
            onChange={(v) => set("phone", v)}
            placeholder="+91 XXXXX XXXXX"
          />
          <RBInput
            label="Email"
            type="email"
            value={resume.email}
            onChange={(v) => set("email", v)}
            placeholder="you@email.com"
          />
          <RBInput
            label="Location"
            value={resume.location}
            onChange={(v) => set("location", v)}
            placeholder="City, Country"
          />
          <RBInput
            label="Experience"
            value={resume.experience_label}
            onChange={(v) => set("experience_label", v)}
            placeholder="e.g. 2 years"
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#4c6488",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 8,
            }}
          >
            Links (optional)
          </p>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <RBInput
              label="Website / Portfolio"
              value={resume.website}
              onChange={(v) => set("website", v)}
              placeholder="https://yourwebsite.com"
            />
            <RBInput
              label="GitHub"
              value={resume.github}
              onChange={(v) => set("github", v)}
              placeholder="https://github.com/username"
            />
            <RBInput
              label="LinkedIn"
              value={resume.linkedin}
              onChange={(v) => set("linkedin", v)}
              placeholder="https://linkedin.com/in/username"
            />
            <RBInput
              label="MavenJobs"
              value={resume.mavenjobs}
              onChange={(v) => set("mavenjobs", v)}
              placeholder="https://mavenjobs.com/profile"
            />
          </div>
        </div>
      </RBAccordion>

      {/* Profile summary */}
      <RBAccordion title="Profile summary" Icon={FiUser} ai>
        <RBTextarea
          label="Summary"
          value={resume.summary}
          onChange={(v) => set("summary", v)}
          placeholder="Write a compelling professional summary..."
          rows={4}
        />
        <button
          onClick={() =>
            set(
              "summary",
              "Passionate MERN stack developer with hands-on experience building scalable, production-grade applications. Skilled in React.js, Node.js, Express and MongoDB, with a strong eye for UI/UX and clean code architecture.",
            )
          }
          style={{
            width: "100%",
            padding: "9px",
            border: "1.5px dashed rgba(124,58,237,0.3)",
            borderRadius: 10,
            background: "#fdf9ff",
            color: "#7c3aed",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <FaMagic style={{ fontSize: 10 }} /> Generate with AI
        </button>
      </RBAccordion>

      {/* Education */}
      <RBAccordion title="Education" Icon={FiBook}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {resume.education.map((edu) => (
            <RBCard key={edu.id}>
              <RemoveBtn onClick={() => removeItem("education", edu.id)} />
              <RBInput
                label="Degree / Course"
                value={edu.degree}
                onChange={(v) => updateArr("education", edu.id, "degree", v)}
                placeholder="e.g. B.Tech Computers"
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <RBInput
                  label="Institution"
                  value={edu.institution}
                  onChange={(v) =>
                    updateArr("education", edu.id, "institution", v)
                  }
                  placeholder="University name"
                />
                <RBInput
                  label="Year"
                  value={edu.year}
                  onChange={(v) => updateArr("education", edu.id, "year", v)}
                  placeholder="2025"
                />
              </div>
              <RBInput
                label="Grade / CGPA"
                value={edu.grade}
                onChange={(v) => updateArr("education", edu.id, "grade", v)}
                placeholder="e.g. 8.5/10"
              />
            </RBCard>
          ))}
          <RBAddBtn
            label="Add education"
            onClick={() =>
              addItem("education", {
                degree: "",
                institution: "",
                year: "",
                grade: "",
              })
            }
          />
        </div>
      </RBAccordion>

      {/* Work experience */}
      <RBAccordion title="Work experience" Icon={FiBriefcase} ai>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {resume.workExperience.map((exp) => (
            <RBCard key={exp.id}>
              <RemoveBtn onClick={() => removeItem("workExperience", exp.id)} />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <RBInput
                  label="Job title"
                  value={exp.role}
                  onChange={(v) =>
                    updateArr("workExperience", exp.id, "role", v)
                  }
                  placeholder="e.g. Frontend Developer"
                />
                <RBInput
                  label="Company"
                  value={exp.company}
                  onChange={(v) =>
                    updateArr("workExperience", exp.id, "company", v)
                  }
                  placeholder="Company name"
                />
                <RBInput
                  label="Start date"
                  value={exp.start}
                  onChange={(v) =>
                    updateArr("workExperience", exp.id, "start", v)
                  }
                  placeholder="Jan 2024"
                />
                <RBInput
                  label="End date"
                  value={exp.end}
                  onChange={(v) =>
                    updateArr("workExperience", exp.id, "end", v)
                  }
                  placeholder="Present"
                />
              </div>
              <RBTextarea
                label="Description"
                value={exp.desc}
                onChange={(v) => updateArr("workExperience", exp.id, "desc", v)}
                placeholder="Describe your role and achievements..."
              />
            </RBCard>
          ))}
          <RBAddBtn
            label="Add work experience"
            onClick={() =>
              addItem("workExperience", {
                role: "",
                company: "",
                start: "",
                end: "",
                desc: "",
              })
            }
          />
        </div>
      </RBAccordion>

      {/* Key skills */}
      <RBAccordion title="Key skills" Icon={FiCode}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {resume.skills.map((skill) => (
            <span
              key={skill}
              className="rb-skill-tag"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#eef2ff",
                border: "1px solid #dde6f8",
                color: "#143f86",
                fontSize: 12,
                fontWeight: 700,
                padding: "5px 12px",
                borderRadius: 999,
              }}
            >
              {skill}
              <button
                onClick={() =>
                  set(
                    "skills",
                    resume.skills.filter((s) => s !== skill),
                  )
                }
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  color: "#8ca2c0",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#8ca2c0";
                }}
              >
                <FiX style={{ fontSize: 11 }} />
              </button>
            </span>
          ))}
          <button
            onClick={() => setShowSkillsModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              border: "1.5px dashed #c8d8ea",
              borderRadius: 999,
              background: "none",
              color: "#8ca2c0",
              fontSize: 12,
              fontWeight: 700,
              padding: "5px 12px",
              cursor: "pointer",
            }}
          >
            <FiPlus style={{ fontSize: 11 }} /> Add skill
          </button>
        </div>
        <SkillsModal
          open={showSkillsModal}
          existing={resume.skills}
          onSave={(list) => set("skills", list)}
          onClose={() => setShowSkillsModal(false)}
        />
      </RBAccordion>

      {/* Projects */}
      <RBAccordion title="Projects" Icon={FiStar} ai>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {resume.projects.map((proj) => (
            <RBCard key={proj.id}>
              <RemoveBtn onClick={() => removeItem("projects", proj.id)} />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <RBInput
                  label="Project name"
                  value={proj.name}
                  onChange={(v) => updateArr("projects", proj.id, "name", v)}
                  placeholder="Project title"
                />
                <RBInput
                  label="Link (optional)"
                  value={proj.link}
                  onChange={(v) => updateArr("projects", proj.id, "link", v)}
                  placeholder="https://github.com/..."
                />
                <RBInput
                  label="Duration"
                  value={proj.duration}
                  onChange={(v) =>
                    updateArr("projects", proj.id, "duration", v)
                  }
                  placeholder="e.g. 40 Days"
                />
                <RBInput
                  label="Year"
                  value={proj.year}
                  onChange={(v) => updateArr("projects", proj.id, "year", v)}
                  placeholder="e.g. 2026"
                />
              </div>
              <RBTextarea
                label="Description (one bullet per line, **bold** with **)"
                value={proj.desc}
                onChange={(v) => updateArr("projects", proj.id, "desc", v)}
                placeholder={
                  "• Built the core React component library\n• Integrated REST APIs with Express\n• Deployed on AWS with CI/CD pipeline"
                }
                rows={4}
              />
            </RBCard>
          ))}
          <RBAddBtn
            label="Add project"
            onClick={() =>
              addItem("projects", {
                name: "",
                duration: "",
                year: "",
                link: "",
                desc: "",
              })
            }
          />
        </div>
      </RBAccordion>

      {/* Internships */}
      <RBAccordion title="Internships" Icon={FiBriefcase} ai>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {resume.internships.map((i) => (
            <RBCard key={i.id}>
              <RemoveBtn onClick={() => removeItem("internships", i.id)} />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <RBInput
                  label="Company"
                  value={i.company}
                  onChange={(v) => updateArr("internships", i.id, "company", v)}
                  placeholder="Company name"
                />
                <RBInput
                  label="Duration"
                  value={i.duration}
                  onChange={(v) =>
                    updateArr("internships", i.id, "duration", v)
                  }
                  placeholder="e.g. 3 months"
                />
              </div>
              <RBInput
                label="Role"
                value={i.role}
                onChange={(v) => updateArr("internships", i.id, "role", v)}
                placeholder="e.g. Frontend Intern"
              />
            </RBCard>
          ))}
          <RBAddBtn
            label="Add internship"
            onClick={() =>
              addItem("internships", { company: "", duration: "", role: "" })
            }
          />
        </div>
      </RBAccordion>

      {/* Certifications */}
      <RBAccordion title="Certifications" Icon={FiAward}>
        {resume.certifications.length === 0 && (
          <p
            style={{
              fontSize: 12,
              color: "#8ca2c0",
              textAlign: "center",
              padding: "6px 0",
            }}
          >
            No certifications added yet.
          </p>
        )}
        <RBAddBtn
          label="Add certification"
          onClick={() =>
            addItem("certifications", { name: "", issuer: "", year: "" })
          }
        />
      </RBAccordion>

      {/* Languages */}
      <RBAccordion title="Languages" Icon={FiGlobe}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {resume.languages.map((lang) => (
            <span
              key={lang}
              className="rb-skill-tag"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#f7f9ff",
                border: "1px solid #dde6f8",
                color: "#3e587a",
                fontSize: 12,
                fontWeight: 600,
                padding: "5px 12px",
                borderRadius: 999,
              }}
            >
              {lang}
              <button
                onClick={() =>
                  set(
                    "languages",
                    resume.languages.filter((l) => l !== lang),
                  )
                }
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  color: "#c8d8ea",
                  display: "flex",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#c8d8ea";
                }}
              >
                <FiX style={{ fontSize: 11 }} />
              </button>
            </span>
          ))}
          <button
            onClick={() => {
              const l = window.prompt("Add a language:");
              if (l?.trim()) set("languages", [...resume.languages, l.trim()]);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              border: "1.5px dashed #c8d8ea",
              borderRadius: 999,
              background: "none",
              color: "#8ca2c0",
              fontSize: 12,
              fontWeight: 700,
              padding: "5px 12px",
              cursor: "pointer",
            }}
          >
            <FiPlus style={{ fontSize: 11 }} /> Add language
          </button>
        </div>
      </RBAccordion>

      {/* Add sections — buttons first, then dynamic sections appear below */}
      <div style={{ padding: "16px 20px 20px" }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#4c6488",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}
        >
          Add sections
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button
            onClick={() => {
              setResume((r) => ({
                ...r,
                customSections: [
                  ...r.customSections,
                  { title: "New Section", items: [] },
                ],
              }));
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              border: "1px solid #dde6f8",
              borderRadius: 999,
              background: "white",
              color: "#4c6488",
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 14px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#143f86";
              e.currentTarget.style.color = "#143f86";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#dde6f8";
              e.currentTarget.style.color = "#4c6488";
            }}
          >
            <FiPlus style={{ fontSize: 10 }} /> Custom section
          </button>
          <button
            onClick={() => {
              const h = window.prompt("Add a hobby:");
              if (h?.trim()) set("hobbies", [...resume.hobbies, h.trim()]);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              border: "1px solid #dde6f8",
              borderRadius: 999,
              background: "white",
              color: "#4c6488",
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 14px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#143f86";
              e.currentTarget.style.color = "#143f86";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#dde6f8";
              e.currentTarget.style.color = "#4c6488";
            }}
          >
            <FiPlus style={{ fontSize: 10 }} /> Hobbies
          </button>
          <button
            onClick={() => {
              setResume((r) => ({
                ...r,
                extraCurricular: [
                  ...r.extraCurricular,
                  { id: Date.now(), title: "", desc: "" },
                ],
              }));
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              border: "1px solid #dde6f8",
              borderRadius: 999,
              background: "white",
              color: "#4c6488",
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 14px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#143f86";
              e.currentTarget.style.color = "#143f86";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#dde6f8";
              e.currentTarget.style.color = "#4c6488";
            }}
          >
            <FiPlus style={{ fontSize: 10 }} /> Extra-curricular activities
          </button>
        </div>
      </div>

      {/* Hobbies — dynamic, appears below the Add sections buttons */}
      {resume.hobbies.length > 0 && (
        <RBAccordion title="Hobbies" Icon={FiStar}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {resume.hobbies.map((h) => (
              <span
                key={h}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#eef2ff",
                  border: "1px solid #dde6f8",
                  color: "#143f86",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "5px 12px",
                  borderRadius: 999,
                }}
              >
                {h}
                <button
                  onClick={() =>
                    set(
                      "hobbies",
                      resume.hobbies.filter((x) => x !== h),
                    )
                  }
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "#8ca2c0",
                    display: "flex",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#8ca2c0";
                  }}
                >
                  <FiX style={{ fontSize: 11 }} />
                </button>
              </span>
            ))}
            <button
              onClick={() => {
                const h = window.prompt("Add a hobby:");
                if (h?.trim()) set("hobbies", [...resume.hobbies, h.trim()]);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                border: "1.5px dashed #c8d8ea",
                borderRadius: 999,
                background: "none",
                color: "#8ca2c0",
                fontSize: 12,
                fontWeight: 700,
                padding: "5px 12px",
                cursor: "pointer",
              }}
            >
              <FiPlus style={{ fontSize: 11 }} /> Add hobby
            </button>
          </div>
        </RBAccordion>
      )}

      {/* Extra-curricular — dynamic, appears below the Add sections buttons */}
      {resume.extraCurricular.length > 0 && (
        <RBAccordion title="Extra-curricular" Icon={FiAward}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {resume.extraCurricular.map((act) => (
              <RBCard key={act.id}>
                <RemoveBtn
                  onClick={() =>
                    setResume((r) => ({
                      ...r,
                      extraCurricular: r.extraCurricular.filter(
                        (x) => x.id !== act.id,
                      ),
                    }))
                  }
                />
                <RBInput
                  label="Activity"
                  value={act.title}
                  onChange={(v) =>
                    setResume((r) => ({
                      ...r,
                      extraCurricular: r.extraCurricular.map((x) =>
                        x.id === act.id ? { ...x, title: v } : x,
                      ),
                    }))
                  }
                  placeholder="e.g. Debate Club Captain"
                />
                <RBInput
                  label="Description (optional)"
                  value={act.desc || ""}
                  onChange={(v) =>
                    setResume((r) => ({
                      ...r,
                      extraCurricular: r.extraCurricular.map((x) =>
                        x.id === act.id ? { ...x, desc: v } : x,
                      ),
                    }))
                  }
                  placeholder="Brief description of the activity"
                />
              </RBCard>
            ))}
            <RBAddBtn
              label="Add activity"
              onClick={() =>
                setResume((r) => ({
                  ...r,
                  extraCurricular: [
                    ...r.extraCurricular,
                    { id: Date.now(), title: "", desc: "" },
                  ],
                }))
              }
            />
          </div>
        </RBAccordion>
      )}

      {/* Custom sections — dynamic, appears below the Add sections buttons */}
      {resume.customSections.length > 0 && (
        <RBAccordion title="Custom sections" Icon={FiBook}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {resume.customSections.map((cs, ci) => (
              <RBCard key={ci}>
                <RemoveBtn
                  onClick={() =>
                    setResume((r) => ({
                      ...r,
                      customSections: r.customSections.filter(
                        (_, i) => i !== ci,
                      ),
                    }))
                  }
                />
                <RBInput
                  label="Section title"
                  value={cs.title}
                  onChange={(v) =>
                    setResume((r) => ({
                      ...r,
                      customSections: r.customSections.map((x, i) =>
                        i === ci ? { ...x, title: v } : x,
                      ),
                    }))
                  }
                  placeholder="e.g. Certifications"
                />
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#4c6488",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      margin: 0,
                    }}
                  >
                    Items
                  </p>
                  {cs.items?.map((item, ii) => (
                    <div
                      key={ii}
                      style={{
                        border: "1px solid #e8eef8",
                        borderRadius: 10,
                        padding: "10px 12px",
                        background: "#f7f9ff",
                        position: "relative",
                      }}
                    >
                      <button
                        onClick={() =>
                          setResume((r) => ({
                            ...r,
                            customSections: r.customSections.map((x, i) =>
                              i === ci
                                ? {
                                    ...x,
                                    items: x.items.filter((_, j) => j !== ii),
                                  }
                                : x,
                            ),
                          }))
                        }
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#c8d8ea",
                          padding: 2,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#ef4444";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#c8d8ea";
                        }}
                      >
                        <FiX style={{ fontSize: 12 }} />
                      </button>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <input
                          value={item.title || ""}
                          onChange={(e) =>
                            setResume((r) => ({
                              ...r,
                              customSections: r.customSections.map((x, i) =>
                                i === ci
                                  ? {
                                      ...x,
                                      items: x.items.map((y, j) =>
                                        j === ii
                                          ? { ...y, title: e.target.value }
                                          : y,
                                      ),
                                    }
                                  : x,
                              ),
                            }))
                          }
                          placeholder="Item title"
                          style={{
                            padding: "8px 10px",
                            fontSize: 12,
                            border: "1px solid #dde6f8",
                            borderRadius: 8,
                            background: "white",
                          }}
                        />
                        <input
                          value={item.desc || ""}
                          onChange={(e) =>
                            setResume((r) => ({
                              ...r,
                              customSections: r.customSections.map((x, i) =>
                                i === ci
                                  ? {
                                      ...x,
                                      items: x.items.map((y, j) =>
                                        j === ii
                                          ? { ...y, desc: e.target.value }
                                          : y,
                                      ),
                                    }
                                  : x,
                              ),
                            }))
                          }
                          placeholder="Description"
                          style={{
                            padding: "8px 10px",
                            fontSize: 12,
                            border: "1px solid #dde6f8",
                            borderRadius: 8,
                            background: "white",
                          }}
                        />
                      </div>
                      <RBTextarea
                        label="Bullet points (one per line)"
                        value={(item.bullets || []).join("\n")}
                        onChange={(v) =>
                          setResume((r) => ({
                            ...r,
                            customSections: r.customSections.map((x, i) =>
                              i === ci
                                ? {
                                    ...x,
                                    items: x.items.map((y, j) =>
                                      j === ii
                                        ? { ...y, bullets: v.split("\n") }
                                        : y,
                                    ),
                                  }
                                : x,
                            ),
                          }))
                        }
                        placeholder={
                          "• Achievement or detail\n• Another bullet point"
                        }
                        rows={2}
                      />
                    </div>
                  ))}
                  <RBAddBtn
                    label="Add item"
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        customSections: r.customSections.map((x, i) =>
                          i === ci
                            ? {
                                ...x,
                                items: [
                                  ...(x.items || []),
                                  { title: "", desc: "", bullets: [] },
                                ],
                              }
                            : x,
                        ),
                      }))
                    }
                  />
                </div>
              </RBCard>
            ))}
            <RBAddBtn
              label="Add custom section"
              onClick={() =>
                setResume((r) => ({
                  ...r,
                  customSections: [
                    ...r.customSections,
                    { title: "New Section", items: [] },
                  ],
                }))
              }
            />
          </div>
        </RBAccordion>
      )}
    </div>
  );
}
