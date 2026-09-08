import React from "react";

/* ─────────────────────────────────────────────────────────────
   Shared font resolution — single source of truth so that
   /resume-builder preview, /resume-view, and PDF export all
   honor the selected font family.
───────────────────────────────────────────────────────────── */
export const FONT_STACK_MAP = {
  "DM Sans": "'DM Sans', sans-serif",
  "Georgia": "Georgia, serif",
  "Roboto": "'Roboto', sans-serif",
  "Playfair Display": "'Playfair Display', 'Georgia', serif",
  "Courier New": "'Courier New', monospace",
};
export function getFontFamily(formatting = {}, fallback = "'DM Sans', sans-serif") {
  return FONT_STACK_MAP[formatting.font] || formatting._font || fallback;
}

/* ─────────────────────────────────────────────────────────────
   Utility helpers
───────────────────────────────────────────────────────────── */
function nameParts(name) {
  const p = (name || "Your Name").split(" ");
  return { first: p[0], last: p.slice(1).join(" ") };
}

const SectionHead = ({ title, style }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, ...style }}>
    <div style={{ width: 3, height: 14, background: style?.accent || "#143f86", borderRadius: 2, flexShrink: 0 }} />
    <span style={{ fontSize: 8, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.1em" }}>{title}</span>
  </div>
);

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 1 — Classic Blue (matches existing ResumeTemplate)
   Free
═════════════════════════════════════════════════════════════ */


/* ------------------------------------------------------------
   Default extra sections renderer
------------------------------------------------------------ */
function ContactLinks({ resume, isDark, direction }) {
  const items = [];
  if (resume.github) items.push({ badge: "GH", label: "GitHub", val: resume.github, bg: "#333" });
  if (resume.linkedin) items.push({ badge: "LI", label: "LinkedIn", val: resume.linkedin, bg: "#0077b5" });
  if (resume.mavenjobs) items.push({ badge: "MJ", label: "MavenJobs", val: resume.mavenjobs, bg: "#6366f1" });
  if (!items.length) return null;
  const col = isDark ? "#94a3b8" : "#475569";
  return (
    <div style={{ display: "flex", flexDirection: direction || "row", flexWrap: "wrap", gap: direction === "column" ? 4 : 12 }}>
      {items.map(item => (
        <span key={item.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9, color: col, wordBreak: "break-word" }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: 3, fontSize: 7, fontWeight: 800, color: "#fff", background: item.bg, flexShrink: 0 }}>{item.badge}</span>
          {item.val}
        </span>
      ))}
    </div>
  );
}

function BulletPoints({ text, style }) {
  if (!text) return null;
  return <p style={{ fontSize: 10, color: "#475569", lineHeight: 1.6, margin: 0, ...style }}>{text}</p>;
}


function formatText(text) {
  if (!text) return '';
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>');
  return html;
}

function ProjectBullets({ text, style, formatting }) {
  if (!text) return null;
  const lines = text.split('\n').filter(Boolean);
  if (lines.length === 0) return null;
  const { margin: _m, ...restStyle } = style || {};
  const scale = FONT_SIZE_SCALE_MAP[formatting?.fontSize] || 1;
  const lh = LINE_HEIGHT_MAP[formatting?.spacing] || 1.55;
  const fs = (restStyle?.fontSize || 9.5) * scale;
  const col = restStyle?.color || "#475569";
  return (
    <ul style={{ margin: "4px 0 0", padding: 0, listStyle: "none", ...restStyle }}>
      {lines.map((line, i) => {
        const clean = line.replace(/^[\s\u2022\-\*]+/, '').trim();
        if (!clean) return null;
        return (
          <li key={i} style={{ fontSize: fs, color: col, lineHeight: lh, marginBottom: 2, paddingLeft: 18, position: "relative" }}>
            <span style={{ position: "absolute", left: 0, top: 0, width: 16, textAlign: "center", fontSize: fs }}>{"\u2022"}</span>
            <span dangerouslySetInnerHTML={{ __html: formatText(clean) }} />
          </li>
        );
      })}
    </ul>
  );
}



const FONT_SIZE_SCALE_MAP = { Small: 0.85, Medium: 1, Large: 1.15 };
const LINE_HEIGHT_MAP = { Compact: 1.3, Medium: 1.55, Comfortable: 1.8 };

function FormattedParagraph({ text, style, formatting }) {
  if (!text) return null;
  const scale = FONT_SIZE_SCALE_MAP[formatting?.fontSize] || 1;
  const lh = LINE_HEIGHT_MAP[formatting?.spacing] || 1.55;
  const baseSize = 10 * scale;
  return <p style={{ fontSize: baseSize, lineHeight: lh, color: "#475569", margin: 0, ...style }} dangerouslySetInnerHTML={{ __html: formatText(text) }} />;
}

function DefaultExtraSections({ resume, isDark, skipProjects, formatting }) {
  const col = isDark ? "#cbd5e1" : "#475569";
  const headCol = isDark ? "#e2e8f0" : "#1e293b";
  const secStyle = { marginBottom: 14 };
  return (
    <>
      {!skipProjects && resume.projects?.filter(p => p.name).length > 0 && (
        <div style={secStyle}>
          <SectionHead title="Projects" style={{ marginBottom: 6 }} />
          {resume.projects.map(p => (
            <div key={p.id} style={{ marginBottom: 6 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: headCol, margin: "0 0 2px" }}>{p.link ? <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>{p.name}</a> : p.name}{p.duration ? ` · ${p.duration}` : ""}{p.year ? ` · ${p.year}` : ""}</p>
              {p.desc && <ProjectBullets text={p.desc} formatting={formatting} style={{ fontSize: 9, color: col, lineHeight: 1.5, margin: 0 }} />}
            </div>
          ))}
        </div>
      )}
      {resume.internships?.length > 0 && (
        <div style={secStyle}>
          <SectionHead title="Internships" style={{ marginBottom: 6 }} />
          {resume.internships.map(intern => (
            <div key={intern.id} style={{ marginBottom: 6 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: headCol, margin: "0 0 1px" }}>{intern.role ? `${intern.role} at ` : ""}{intern.company}</p>
              {intern.duration && <p style={{ fontSize: 9, color: col, margin: 0 }}>{intern.duration}</p>}
            </div>
          ))}
        </div>
      )}
      {resume.certifications?.length > 0 && (
        <div style={secStyle}>
          <SectionHead title="Certifications" style={{ marginBottom: 6 }} />
          {resume.certifications.map((cert, i) => {
            const name = cert.name || cert;
            const issuer = cert.issuer || "";
            const year = cert.year || "";
            return (
              <p key={i} style={{ fontSize: 9, color: col, lineHeight: 1.5, margin: "0 0 3px" }}>{name}{issuer ? ` – ${issuer}` : ""}{year ? ` (${year})` : ""}</p>
            );
          })}
        </div>
      )}
      {resume.languages?.length > 0 && (
        <div style={secStyle}>
          <SectionHead title="Languages" style={{ marginBottom: 6 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {resume.languages.map(l => (
              <span key={l} style={{ fontSize: 9, color: col, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", padding: "2px 8px", borderRadius: 4 }}>{l}</span>
            ))}
          </div>
        </div>
      )}
      {resume.hobbies?.length > 0 && (
        <div style={secStyle}>
          <SectionHead title="Hobbies" style={{ marginBottom: 6 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {resume.hobbies.map(h => (
              <span key={h} style={{ fontSize: 9, color: col, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", padding: "2px 8px", borderRadius: 4 }}>{h}</span>
            ))}
          </div>
        </div>
      )}
      {resume.extraCurricular?.length > 0 && (
        <div style={secStyle}>
          <SectionHead title="Extra-Curricular" style={{ marginBottom: 6 }} />
          {resume.extraCurricular.map(act => (
            <div key={act.id || act.title} style={{ marginBottom: 6 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: headCol, margin: "0 0 2px" }}>{act.title}</p>
              {act.desc && <p style={{ fontSize: 9, color: col, lineHeight: 1.5, margin: 0 }}>{act.desc}</p>}
            </div>
          ))}
        </div>
      )}
      {resume.customSections?.length > 0 && resume.customSections.map((cs, i) => (
        <div key={i} style={secStyle}>
          <SectionHead title={cs.title} style={{ marginBottom: 6 }} />
          {cs.items?.map((item, j) => (
            <div key={j} style={{ marginBottom: 6 }}>
              {item.title && <p style={{ fontSize: 10, fontWeight: 600, color: headCol, margin: "0 0 2px" }}>{item.title}</p>}
              {item.desc && <p style={{ fontSize: 9, color: col, lineHeight: 1.5, margin: 0 }}>{item.desc}</p>}
              {item.bullets?.length > 0 && (
                <div style={{ margin: "2px 0 0", paddingLeft: 12 }}>
                  {item.bullets.map((b, k) => (
                    <BulletPoints key={k} text={b} style={{ fontSize: 8.5, color: col, marginBottom: 1 }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

export function TemplateClassicBlue({ resume, formatting = {} }) {
  const { first, last } = nameParts(resume.name);
  const ac = formatting.accentColor || "#002366";
  const photo = resume.photo;
  const contact = [
    { label: "Phone", val: resume.phone },
    { label: "Email", val: resume.email },
    { label: "Location", val: resume.location },
  ];

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", fontFamily: getFontFamily(formatting), position: "relative", overflow: "hidden", background: "#fff" }}>
      {/* Sidebar background */}
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 220, background: ac, zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flex: 1 }}>
        {/* LEFT SIDEBAR */}
        <div style={{ width: 220, flexShrink: 0, padding: "26px 16px 24px 18px", display: "flex", flexDirection: "column" }}>
          {/* Photo */}
          {photo && <div style={{ width: 80, height: 80, borderRadius: "50%", border: "3px solid rgba(16,185,129,0.82)", boxShadow: "0 0 0 5px rgba(16,185,129,0.15)", overflow: "hidden", alignSelf: "center", marginBottom: 10, background: "#f1f5f9" }}>
            <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>}
          <p style={{ textAlign: "center", fontSize: 16, fontWeight: 800, color: "#fff", lineHeight: 1.2, margin: "0 0 3px" }}>{first}<br />{last}</p>
          <p style={{ textAlign: "center", fontSize: 8, fontWeight: 800, color: "#10b981", letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 12px" }}>{resume.title || "Professional"}</p>
          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: 12 }} />

          {/* Contact */}
          <p style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: "0.24em", textTransform: "uppercase", color: "#10b981", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
            Contact <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
          </p>
          {contact.filter(c => c.val).map(c => (
            <div key={c.label} style={{ display: "flex", flexDirection: "column", marginBottom: 6 }}>
              <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>{c.label}</span>
              <span style={{ fontSize: 9.5, fontWeight: 500, color: "rgba(255,255,255,0.76)", wordBreak: "break-word" }}>{c.val}</span>
            </div>
          ))}
          <ContactLinks resume={resume} isDark={true} direction="column" />

          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "8px 0" }} />

          {/* Skills */}
          <p style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: "0.24em", textTransform: "uppercase", color: "#10b981", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
            Skills <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
            {resume.skills.map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9.5, fontWeight: 600, color: "rgba(255,255,255,0.9)", padding: "2px 0" }}>
                <span style={{ color: "#10b981", fontSize: 12, lineHeight: 1 }}>•</span> {s}
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "8px 0" }} />

          {/* Education */}
          <p style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: "0.24em", textTransform: "uppercase", color: "#10b981", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
            Education <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
          </p>
          {resume.education.filter(e => e.degree).map((e, i) => (
            <div key={i} style={{ paddingLeft: 8, borderLeft: "2px solid rgba(16,185,129,0.38)", marginBottom: 7 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.88)", margin: "0 0 1px", lineHeight: 1.3 }}>{e.degree}</p>
              {e.institution && <p style={{ fontSize: 9, color: "rgba(255,255,255,0.44)", margin: "0 0 1px" }}>{e.institution}</p>}
              <p style={{ fontSize: 9, fontWeight: 800, color: "#10b981", margin: 0 }}>{e.year}{e.grade ? ` · ${e.grade}` : ""}</p>
            </div>
          ))}
        </div>

        {/* RIGHT CONTENT */}
        <div style={{ flex: 1, padding: "28px 24px 22px 26px", display: "flex", flexDirection: "column", background: "#fff" }}>
          {/* Name header */}
          <p style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1, margin: "0 0 3px" }}>
            <span style={{ color: ac }}>{first}</span> {last}
          </p>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.04em", margin: "0 0 10px" }}>{resume.title || "Professional"}</p>

          {/* Summary */}
          {resume.summary && (
            <div style={{ fontSize: 10.5, color: "#475569", lineHeight: 1.7, fontStyle: "italic", padding: "8px 12px", background: "#f8fafc", borderLeft: "3px solid #10b981", borderRadius: "0 7px 7px 0", marginBottom: 10 }}>
              {resume.summary}
            </div>
          )}

          {/* Work Experience */}
          {resume.workExperience.filter(e => e.role || e.company).length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0 8px" }}>
                <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: ac }}>Work Experience</span>
                <span style={{ flex: 1, height: 2, background: "#10b981", borderRadius: 2 }} />
              </div>
              {resume.workExperience.map((exp, i, arr) => (
                <div key={exp.id} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 12, flexShrink: 0, paddingTop: 3 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 0 3px rgba(16,185,129,0.18)" }} />
                    {i < arr.length - 1 && <div style={{ flex: 1, width: 1.5, background: "rgba(16,185,129,0.2)" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11.5, fontWeight: 800, color: "#0f172a", margin: "0 0 1px" }}>{exp.role}</p>
                    <p style={{ fontSize: 10, fontWeight: 700, color: ac, margin: "0 0 3px" }}>{exp.company}</p>
                    <p style={{ fontSize: 8.5, fontWeight: 800, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>{exp.start}{exp.end ? ` – ${exp.end}` : ""}</p>
                    {exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 10, color: "#475569", lineHeight: 1.6, margin: 0 }} />}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Projects */}
          {resume.projects.filter(p => p.name).length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}>
                <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: ac }}>Projects</span>
                <span style={{ flex: 1, height: 2, background: "#10b981", borderRadius: 2 }} />
              </div>
              {resume.projects.map(p => (
                <div key={p.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, padding: "9px 11px", marginBottom: 6, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: "#10b981" }} />
                  <p style={{ fontSize: 11, fontWeight: 800, color: "#0f172a", margin: "0 0 2px" }}>{p.link ? <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>{p.name}</a> : p.name}{p.duration ? ` · ${p.duration}` : ""}{p.year ? ` · ${p.year}` : ""}</p>
                  {p.desc && <ProjectBullets text={p.desc} formatting={formatting} style={{ fontSize: 10, color: "#475569", lineHeight: 1.55, margin: 0 }} />}
                </div>
              ))}
            </>
          )}
          <DefaultExtraSections resume={resume} formatting={formatting} isDark={true} skipProjects />
          <div style={{ flex: 1 }} />
        </div>
      </div>

    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 2 — Corporate (Free)
   Clean single-column with blue accent header
═════════════════════════════════════════════════════════════ */
export function TemplateCorporate({ resume, formatting }) {
  const ac = formatting.accentColor || "#143f86";
  return (
    <div style={{ width: "100%", height: "100%", fontFamily: getFontFamily(formatting), background: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Header bar */}
      <div style={{ background: ac, padding: "20px 28px 14px" }}>
        <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2 }}>{resume.name || "Your Name"}</p>
        <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", margin: "3px 0 0", letterSpacing: "0.05em" }}>{resume.title || "Professional"}</p>
      </div>

      {/* Contact row */}
      <div style={{ display: "flex", gap: 16, padding: "10px 28px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap" }}>
        {[
          { icon: "📞", val: resume.phone },
          { icon: "✉️", val: resume.email },
          { icon: "📍", val: resume.location },
        ].filter(c => c.val).map(c => (
          <span key={c.icon} style={{ fontSize: 9.5, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>{c.icon} {c.val}</span>
        ))}
        <ContactLinks resume={resume} formatting={formatting} />
      </div>

      <div style={{ flex: 1, padding: "16px 28px 20px", display: "flex", flexDirection: "column" }}>
        {/* Summary */}
        {resume.summary && (
          <div style={{ marginBottom: 12 }}>
            <SectionHead title="Professional Summary" style={{ accent: ac }} />
            <p style={{ fontSize: 10, color: "#475569", lineHeight: 1.65, margin: 0 }}>{resume.summary}</p>
          </div>
        )}

        {/* Work Experience */}
        {resume.workExperience.filter(e => e.role).length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <SectionHead title="Experience" style={{ accent: ac }} />
            {resume.workExperience.map(exp => (
              <div key={exp.id} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#1e293b", margin: 0 }}>{exp.role}</p>
                  <p style={{ fontSize: 9, color: ac, fontWeight: 600, margin: 0, whiteSpace: "nowrap", marginLeft: 8 }}>{exp.start}{exp.end ? ` – ${exp.end}` : ""}</p>
                </div>
                <p style={{ fontSize: 9.5, fontWeight: 600, color: "#64748b", margin: "1px 0 3px" }}>{exp.company}</p>
                {exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.55, margin: 0 }} />}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {resume.education.filter(e => e.degree).length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <SectionHead title="Education" style={{ accent: ac }} />
            {resume.education.map((e, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#1e293b", margin: 0 }}>{e.degree}</p>
                  {e.institution && <p style={{ fontSize: 9.5, color: "#64748b", margin: 0 }}>{e.institution}</p>}
                </div>
                <p style={{ fontSize: 9, color: "#94a3b8", margin: 0, whiteSpace: "nowrap", marginLeft: 8 }}>{e.year}{e.grade ? ` · ${e.grade}` : ""}</p>
              </div>
            ))}
          </div>
        )}

      <DefaultExtraSections resume={resume} formatting={formatting} />

      {/* Skills */}
      {resume.skills.length > 0 && (
          <div>
            <SectionHead title="Skills" style={{ accent: ac }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {resume.skills.map(s => (
                <span key={s} style={{ fontSize: 9, fontWeight: 600, color: "#1e293b", background: "#f1f5f9", padding: "3px 9px", borderRadius: 4, border: "1px solid #e2e8f0" }}>{s}</span>
              ))}
            </div>
          </div>
        )}
        <DefaultExtraSections resume={resume} formatting={formatting} />
        <div style={{ flex: 1 }} />
      </div>

      <DefaultExtraSections resume={resume} formatting={formatting} />
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 3 — Minimal Clean (Free)
   Ultra-minimal, lots of whitespace, thin borders
═════════════════════════════════════════════════════════════ */
export function TemplateMinimalClean({ resume, formatting = {} }) {
  const { first, last } = nameParts(resume.name);
  const ac = formatting.accentColor || "#94a3b8";
  return (
    <div style={{ width: "100%", height: "100%", fontFamily: getFontFamily(formatting), background: "#fff", display: "flex", flexDirection: "column", padding: "32px 36px" }}>
      {/* Name */}
      <p style={{ fontSize: 24, fontWeight: 300, color: "#0f172a", letterSpacing: "-0.03em", margin: "0 0 2px" }}>{first} <span style={{ fontWeight: 700 }}>{last}</span></p>
      <p style={{ fontSize: 11, fontWeight: 500, color: ac, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 6px" }}>{resume.title || "Professional"}</p>
      <div style={{ height: 1, background: "#e2e8f0", marginBottom: 14 }} />

      {/* Contact inline */}
      <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
        {[resume.phone, resume.email, resume.location].filter(Boolean).map((v, i) => (
          <span key={i} style={{ fontSize: 9.5, color: "#64748b" }}>{v}</span>
        ))}
        <ContactLinks resume={resume} formatting={formatting} />
      </div>

      {/* Summary */}
      {resume.summary && (
        <p style={{ fontSize: 10, color: "#475569", lineHeight: 1.7, margin: "0 0 14px" }}>{resume.summary}</p>
      )}

      {/* Experience */}
      {resume.workExperience.filter(e => e.role).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 8, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 8px" }}>Experience</p>
          {resume.workExperience.map(exp => (
            <div key={exp.id} style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#0f172a", margin: "0 0 1px" }}>{exp.role}</p>
              <p style={{ fontSize: 9.5, color: "#64748b", margin: "0 0 1px" }}>{exp.company}<span style={{ color: ac }}> · {exp.start}{exp.end ? ` – ${exp.end}` : ""}</span></p>
              {exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.55, margin: "2px 0 0" }} />}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {resume.education.filter(e => e.degree).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 8, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 8px" }}>Education</p>
          {resume.education.map((e, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <p style={{ fontSize: 10.5, fontWeight: 600, color: "#0f172a", margin: "0 0 1px" }}>{e.degree}</p>
              <p style={{ fontSize: 9.5, color: "#64748b", margin: 0 }}>{e.institution}{e.year ? ` · ${e.year}` : ""}{e.grade ? ` · ${e.grade}` : ""}</p>
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {resume.projects.filter(p => p.name).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 8, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 8px" }}>Projects</p>
          {resume.projects.map(p => (
            <div key={p.id} style={{ marginBottom: 6 }}>
              <p style={{ fontSize: 10.5, fontWeight: 600, color: "#0f172a", margin: "0 0 1px" }}>{p.link ? <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>{p.name}</a> : p.name}{p.duration ? <span style={{ color: ac, fontWeight: 400 }}> · {p.duration}</span> : ""}{p.year ? <span style={{ color: ac, fontWeight: 400 }}> · {p.year}</span> : ""}</p>
              {p.desc && <ProjectBullets text={p.desc} formatting={formatting} style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.55, margin: 0 }} />}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {resume.skills.length > 0 && (
        <div style={{ marginTop: "auto" }}>
          <div style={{ height: 1, background: "#e2e8f0", marginBottom: 8 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {resume.skills.map(s => (
              <span key={s} style={{ fontSize: 8.5, color: "#64748b", padding: "2px 8px", border: "1px solid #e2e8f0", borderRadius: 2 }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      <DefaultExtraSections resume={resume} formatting={formatting} skipProjects />
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 4 — Elegant (Free)
   Serif fonts, refined gold accents
═════════════════════════════════════════════════════════════ */
export function TemplateElegant({ resume, formatting = {} }) {
  return (
    <div style={{ width: "100%", height: "100%", fontFamily: getFontFamily(formatting, "'Playfair Display', 'Georgia', serif"), background: "#fcf9f5", display: "flex", flexDirection: "column", padding: "34px 32px" }}>
      <p style={{ fontSize: 26, fontWeight: 700, color: "#1a1a2e", letterSpacing: "0.02em", margin: "0 0 2px", fontFamily: getFontFamily(formatting, "'Playfair Display', 'Georgia', serif") }}>{resume.name || "Your Name"}</p>
      <p style={{ fontSize: 11, fontWeight: 500, color: "#b8860b", letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 8px" }}>{resume.title || "Professional"}</p>
      <div style={{ height: 1, background: "linear-gradient(to right, #b8860b 0%, #e2d5b0 100%)", marginBottom: 14 }} />

      {/* Contact */}
      <div style={{ display: "flex", gap: 20, marginBottom: 14, fontSize: 9.5, color: "#6b5b4e", fontFamily: getFontFamily(formatting) }}>
        {[resume.phone, resume.email, resume.location].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}
        <ContactLinks resume={resume} formatting={formatting} />
      </div>

      {resume.summary && (
        <p style={{ fontSize: 10, color: "#6b5b4e", fontStyle: "italic", lineHeight: 1.7, margin: "0 0 14px" }}>{resume.summary}</p>
      )}

      {/* Work */}
      {resume.workExperience.filter(e => e.role).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: "#b8860b", letterSpacing: "0.15em", textTransform: "uppercase", borderBottom: "1px solid #e2d5b0", paddingBottom: 4, marginBottom: 8 }}>Experience</p>
          {resume.workExperience.map(exp => (
            <div key={exp.id} style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: "#1a1a2e", margin: "0 0 1px" }}>{exp.role}</p>
              <p style={{ fontSize: 10, color: "#b8860b", margin: "0 0 1px" }}>{exp.company} · {exp.start}{exp.end ? ` – ${exp.end}` : ""}</p>
              {exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 9.5, color: "#6b5b4e", lineHeight: 1.55, margin: "2px 0 0", fontFamily: getFontFamily(formatting) }} />}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {resume.education.filter(e => e.degree).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: "#b8860b", letterSpacing: "0.15em", textTransform: "uppercase", borderBottom: "1px solid #e2d5b0", paddingBottom: 4, marginBottom: 8 }}>Education</p>
          {resume.education.map((e, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <p style={{ fontSize: 10.5, fontWeight: 600, color: "#1a1a2e", margin: "0 0 1px" }}>{e.degree}</p>
              <p style={{ fontSize: 9.5, color: "#6b5b4e", margin: 0 }}>{e.institution}{e.year ? ` · ${e.year}` : ""}{e.grade ? ` · ${e.grade}` : ""}</p>
            </div>
          ))}
        </div>
      )}

      <DefaultExtraSections resume={resume} formatting={formatting} />

      {/* Skills */}
      {resume.skills.length > 0 && (
        <div style={{ marginTop: "auto" }}>
          <div style={{ height: 1, background: "linear-gradient(to right, #b8860b 0%, transparent 100%)", marginBottom: 8 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {resume.skills.map(s => (
              <span key={s} style={{ fontSize: 9, color: "#6b5b4e", fontFamily: getFontFamily(formatting), padding: "2px 8px", border: "1px solid #e2d5b0", borderRadius: 2 }}>{s}</span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 5 — Modern Light (Free)
   Soft gradient header, clean cards
═════════════════════════════════════════════════════════════ */
export function TemplateModernLight({ resume, formatting = {} }) {
  return (
    <div style={{ width: "100%", height: "100%", fontFamily: getFontFamily(formatting), background: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "22px 28px 16px" }}>
        <p style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>{resume.name || "Your Name"}</p>
        <p style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.8)", margin: "2px 0 0" }}>{resume.title || "Professional"}</p>
        <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
          {[resume.phone, resume.email, resume.location].filter(Boolean).map((v, i) => (
            <span key={i} style={{ fontSize: 9, color: "rgba(255,255,255,0.7)" }}>{v}</span>
          ))}
          <ContactLinks resume={resume} formatting={formatting} />
        </div>
      </div>

      <div style={{ flex: 1, padding: "16px 28px 20px", display: "flex", flexDirection: "column" }}>
        {/* Summary */}
        {resume.summary && (
          <div style={{ background: "#f0f4ff", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
            <p style={{ fontSize: 10, color: "#475569", lineHeight: 1.6, margin: 0 }}>{resume.summary}</p>
          </div>
        )}

        {/* Experience */}
        {resume.workExperience.filter(e => e.role).length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "#667eea", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Experience</p>
            {resume.workExperience.map(exp => (
              <div key={exp.id} style={{ background: "#f8faff", borderRadius: 8, padding: "10px 12px", marginBottom: 6, border: "1px solid #e0e7ff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#1e293b", margin: 0 }}>{exp.role}</p>
                  <p style={{ fontSize: 8.5, color: "#667eea", fontWeight: 600, margin: 0 }}>{exp.start}{exp.end ? ` – ${exp.end}` : ""}</p>
                </div>
                <p style={{ fontSize: 9.5, color: "#64748b", margin: "1px 0 3px" }}>{exp.company}</p>
                {exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.5, margin: 0 }} />}
              </div>
            ))}
          </div>
        )}

        {/* Education & Skills row */}
        <div style={{ display: "flex", gap: 20 }}>
          {resume.education.filter(e => e.degree).length > 0 && (
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: "#667eea", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Education</p>
              {resume.education.map((e, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#1e293b", margin: 0 }}>{e.degree}</p>
                  <p style={{ fontSize: 9, color: "#94a3b8", margin: 0 }}>{e.institution}{e.year ? ` · ${e.year}` : ""}</p>
                </div>
              ))}
            </div>
          )}
          {resume.skills.length > 0 && (
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: "#667eea", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Skills</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {resume.skills.map(s => (
                  <span key={s} style={{ fontSize: 8.5, color: "#475569", background: "#f0f4ff", padding: "2px 7px", borderRadius: 4 }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        <DefaultExtraSections resume={resume} formatting={formatting} />
        <div style={{ flex: 1 }} />
      </div>

    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 6 — Executive (PRO)
   Dark header, gold accents, premium feel
═════════════════════════════════════════════════════════════ */
export function TemplateExecutive({ resume, formatting = {} }) {
  return (
    <div style={{ width: "100%", height: "100%", fontFamily: getFontFamily(formatting), background: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Premium dark header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "24px 30px 18px", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)" }} />
        <p style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{resume.name || "Your Name"}</p>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#d4af37", letterSpacing: "0.12em", textTransform: "uppercase", margin: "2px 0 6px" }}>{resume.title || "Professional"}</p>
        <div style={{ height: 2, width: 60, background: "#d4af37", borderRadius: 1 }} />
      </div>

      <div style={{ flex: 1, padding: "18px 30px 20px", display: "flex", gap: 20 }}>
        {/* Left */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {resume.summary && (
            <p style={{ fontSize: 10, color: "#475569", lineHeight: 1.65, margin: "0 0 12px" }}>{resume.summary}</p>
          )}
          {resume.workExperience.filter(e => e.role).length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 8, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.12em", borderBottom: "2px solid #d4af37", paddingBottom: 4, marginBottom: 8 }}>Experience</p>
              {resume.workExperience.map(exp => (
                <div key={exp.id} style={{ marginBottom: 8, paddingLeft: 10, borderLeft: "2px solid #e2e8f0" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", margin: "0 0 1px" }}>{exp.role}</p>
                  <p style={{ fontSize: 9.5, color: "#d4af37", fontWeight: 600, margin: "0 0 1px" }}>{exp.company}</p>
                  <p style={{ fontSize: 8.5, color: "#94a3b8", margin: "0 0 2px" }}>{exp.start}{exp.end ? ` – ${exp.end}` : ""}</p>
                  {exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.55, margin: 0 }} />}
                </div>
              ))}
            </div>
          )}
          <div style={{ flex: 1 }} />
        </div>

        {/* Right */}
        <div style={{ width: 140, flexShrink: 0, display: "flex", flexDirection: "column" }}>
          {/* Contact */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 7.5, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Contact</p>
            {[resume.phone, resume.email, resume.location].filter(Boolean).map((v, i) => (
              <p key={i} style={{ fontSize: 9, color: "#64748b", margin: "0 0 3px" }}>{v}</p>
            ))}
            <ContactLinks resume={resume} isDark={true} direction="column" />
          </div>
          {/* Skills */}
          {resume.skills.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 7.5, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Skills</p>
              {resume.skills.map(s => (
                <p key={s} style={{ fontSize: 8.5, color: "#64748b", margin: "0 0 2px", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#d4af37", display: "inline-block" }} /> {s}
                </p>
              ))}
            </div>
          )}
          {/* Education */}
          {resume.education.filter(e => e.degree).length > 0 && (
            <div>
              <p style={{ fontSize: 7.5, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Education</p>
              {resume.education.map((e, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <p style={{ fontSize: 9, fontWeight: 600, color: "#1e293b", margin: 0 }}>{e.degree}</p>
                  <p style={{ fontSize: 8.5, color: "#64748b", margin: 0 }}>{e.institution}{e.year ? ` · ${e.year}` : ""}</p>
                </div>
              ))}
            </div>
          )}
          <DefaultExtraSections resume={resume} formatting={formatting} isDark={true} />
          <div style={{ flex: 1 }} />
        </div>
      </div>

    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 7 — Creative (PRO)
   Colorful, asymmetric, unique layout
═════════════════════════════════════════════════════════════ */
export function TemplateCreative({ resume, formatting = {} }) {
  return (
    <div style={{ width: "100%", height: "100%", fontFamily: getFontFamily(formatting), display: "flex", flexDirection: "column", background: "#fff" }}>
      {/* Top accent stripe */}
      <div style={{ height: 6, background: "linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff)", flexShrink: 0 }} />

      <div style={{ flex: 1, display: "flex" }}>
        {/* Left colored panel */}
        <div style={{ width: 170, flexShrink: 0, background: "#2d3436", padding: "22px 14px", display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 2px", lineHeight: 1.2 }}>{resume.name || "Your Name"}</p>
          <p style={{ fontSize: 8, fontWeight: 700, color: "#ffd93d", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>{resume.title || "Professional"}</p>
          <div style={{ height: 1, background: "rgba(255,255,255,0.15)", marginBottom: 12 }} />

          <p style={{ fontSize: 7, fontWeight: 700, color: "#ffd93d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Contact</p>
          {[resume.phone, resume.email, resume.location].filter(Boolean).map((v, i) => (
            <p key={i} style={{ fontSize: 8.5, color: "rgba(255,255,255,0.75)", margin: "0 0 3px", wordBreak: "break-word" }}>{v}</p>
          ))}
          <ContactLinks resume={resume} direction="column" />

          <div style={{ height: 1, background: "rgba(255,255,255,0.15)", margin: "10px 0" }} />

          <p style={{ fontSize: 7, fontWeight: 700, color: "#ffd93d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Skills</p>
          {resume.skills.map(s => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#6bcb77", flexShrink: 0 }} />
              <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.75)" }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Right content */}
        <div style={{ flex: 1, padding: "22px 20px 18px", display: "flex", flexDirection: "column" }}>
          {resume.summary && (
            <p style={{ fontSize: 10, color: "#475569", lineHeight: 1.6, margin: "0 0 12px", fontStyle: "italic" }}>{resume.summary}</p>
          )}

          {resume.workExperience.filter(e => e.role).length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 9, fontWeight: 800, color: "#ff6b6b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Work</p>
              {resume.workExperience.map(exp => (
                <div key={exp.id} style={{ marginBottom: 8, padding: "8px 10px", background: "#f8f9fa", borderRadius: 6, borderLeft: "3px solid #6bcb77" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#2d3436", margin: "0 0 1px" }}>{exp.role}</p>
                  <p style={{ fontSize: 9.5, color: "#636e72", margin: "0 0 1px" }}>{exp.company}<span style={{ color: "#b2bec3" }}> · {exp.start}{exp.end ? ` – ${exp.end}` : ""}</span></p>
                  {exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.5, margin: "2px 0 0" }} />}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {resume.education.filter(e => e.degree).length > 0 && (
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, color: "#ff6b6b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Education</p>
              {resume.education.map((e, i) => (
                <div key={i} style={{ marginBottom: 4, padding: "6px 10px", background: "#f8f9fa", borderRadius: 4 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#2d3436", margin: "0 0 1px" }}>{e.degree}</p>
                  <p style={{ fontSize: 9, color: "#636e72", margin: 0 }}>{e.institution}{e.year ? ` · ${e.year}` : ""}</p>
                </div>
              ))}
            </div>
          )}
          <DefaultExtraSections resume={resume} formatting={formatting} />
          <div style={{ flex: 1 }} />
        </div>
      </div>

    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 8 — Professional Dark (PRO)
   Full dark mode with vibrant cyan accents
═════════════════════════════════════════════════════════════ */
export function TemplateProfessionalDark({ resume, formatting = {} }) {
  return (
    <div style={{ width: "100%", height: "100%", fontFamily: getFontFamily(formatting), background: "#0f172a", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "24px 28px 14px", borderBottom: "1px solid rgba(6,182,212,0.2)" }}>
        <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{resume.name || "Your Name"}</p>
        <p style={{ fontSize: 10, fontWeight: 600, color: "#06b6d4", letterSpacing: "0.15em", textTransform: "uppercase", margin: "3px 0 6px" }}>{resume.title || "Professional"}</p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {[resume.phone, resume.email, resume.location].filter(Boolean).map((v, i) => (
            <span key={i} style={{ fontSize: 8.5, color: "#94a3b8" }}>{v}</span>
          ))}
          <ContactLinks resume={resume} formatting={formatting} isDark={true} />
        </div>
      </div>

      <div style={{ flex: 1, padding: "14px 28px 20px", display: "flex", flexDirection: "column" }}>
        {resume.summary && (
          <p style={{ fontSize: 9.5, color: "#94a3b8", lineHeight: 1.6, margin: "0 0 12px" }}>{resume.summary}</p>
        )}

        {resume.workExperience.filter(e => e.role).length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 8, fontWeight: 700, color: "#06b6d4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Experience</p>
            {resume.workExperience.map(exp => (
              <div key={exp.id} style={{ marginBottom: 8, padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{exp.role}</p>
                  <p style={{ fontSize: 8, color: "#06b6d4", margin: 0 }}>{exp.start}{exp.end ? ` – ${exp.end}` : ""}</p>
                </div>
                <p style={{ fontSize: 9, color: "#64748b", margin: "1px 0 3px" }}>{exp.company}</p>
                {exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.5, margin: 0 }} />}
              </div>
            ))}
          </div>
        )}

        {/* Skills & Education */}
        <div style={{ display: "flex", gap: 16 }}>
          {resume.skills.length > 0 && (
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 8, fontWeight: 700, color: "#06b6d4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Skills</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {resume.skills.map(s => (
                  <span key={s} style={{ fontSize: 8, color: "#94a3b8", background: "rgba(255,255,255,0.06)", padding: "3px 7px", borderRadius: 3 }}>{s}</span>
                ))}
              </div>
            </div>
          )}
          {resume.education.filter(e => e.degree).length > 0 && (
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 8, fontWeight: 700, color: "#06b6d4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Education</p>
              {resume.education.map((e, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <p style={{ fontSize: 9.5, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>{e.degree}</p>
                  <p style={{ fontSize: 8.5, color: "#64748b", margin: 0 }}>{e.institution}{e.year ? ` · ${e.year}` : ""}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <DefaultExtraSections resume={resume} formatting={formatting} isDark={true} />
        <div style={{ flex: 1 }} />
      </div>

    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 9 — Contemporary (PRO)
   Two-tone, asymmetric, modern
═════════════════════════════════════════════════════════════ */
export function TemplateContemporary({ resume, formatting = {} }) {
  return (
    <div style={{ width: "100%", height: "100%", fontFamily: getFontFamily(formatting), display: "flex", background: "#fff" }}>
      {/* Left bar */}
      <div style={{ width: 190, flexShrink: 0, background: "#f0fdf4", padding: "28px 18px", display: "flex", flexDirection: "column" }}>
        <div style={{ width: 70, height: 70, borderRadius: 16, background: "linear-gradient(135deg, #059669, #34d399)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, color: "#fff", fontSize: 28, fontWeight: 800 }}>
          {(resume.name || "Y")[0]}
        </div>
        <p style={{ fontSize: 16, fontWeight: 800, color: "#064e3b", margin: "0 0 1px", lineHeight: 1.2 }}>{resume.name || "Your Name"}</p>
        <p style={{ fontSize: 9, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>{resume.title || "Professional"}</p>
        <div style={{ height: 1, background: "#a7f3d0", marginBottom: 14 }} />

        <p style={{ fontSize: 7, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Contact</p>
        {[resume.phone, resume.email, resume.location].filter(Boolean).map((v, i) => (
          <p key={i} style={{ fontSize: 9, color: "#065f46", margin: "0 0 4px", wordBreak: "break-word" }}>{v}</p>
        ))}
        <ContactLinks resume={resume} direction="column" />

        <div style={{ height: 1, background: "#a7f3d0", margin: "10px 0" }} />

        <p style={{ fontSize: 7, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Skills</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {resume.skills.map(s => (
            <span key={s} style={{ fontSize: 8, color: "#065f46", background: "rgba(5,150,105,0.1)", padding: "2px 6px", borderRadius: 3 }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Right */}
      <div style={{ flex: 1, padding: "28px 24px 20px", display: "flex", flexDirection: "column" }}>
        {/* Summary */}
        {resume.summary && (
          <p style={{ fontSize: 10, color: "#475569", lineHeight: 1.65, margin: "0 0 14px" }}>{resume.summary}</p>
        )}

        {/* Experience */}
        {resume.workExperience.filter(e => e.role).length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 8, fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>Experience</p>
            {resume.workExperience.map(exp => (
              <div key={exp.id} style={{ marginBottom: 8, padding: "10px 0", borderBottom: "1px solid #e2e8f0" }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: "#0f172a", margin: "0 0 1px" }}>{exp.role}</p>
                <p style={{ fontSize: 9.5, color: "#059669", fontWeight: 600, margin: "0 0 1px" }}>{exp.company}</p>
                <p style={{ fontSize: 8.5, color: "#94a3b8", margin: "0 0 2px" }}>{exp.start}{exp.end ? ` – ${exp.end}` : ""}</p>
                {exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.5, margin: 0 }} />}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {resume.education.filter(e => e.degree).length > 0 && (
          <div>
            <p style={{ fontSize: 8, fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6 }}>Education</p>
            {resume.education.map((e, i) => (
              <div key={i} style={{ marginBottom: 4 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: "#0f172a", margin: 0 }}>{e.degree}</p>
                <p style={{ fontSize: 9, color: "#64748b", margin: 0 }}>{e.institution}{e.year ? ` · ${e.year}` : ""}{e.grade ? ` · ${e.grade}` : ""}</p>
              </div>
            ))}
          </div>
        )}
        <DefaultExtraSections resume={resume} formatting={formatting} />
        <div style={{ flex: 1 }} />
      </div>

    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 10 — Bold (PRO)
   Large typography, high contrast, statement design
═════════════════════════════════════════════════════════════ */
export function TemplateBold({ resume, formatting = {} }) {
  return (
    <div style={{ width: "100%", height: "100%", fontFamily: getFontFamily(formatting), background: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Massive name banner */}
      <div style={{ padding: "28px 30px 14px", background: "#000" }}>
        <p style={{ fontSize: 30, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.03em", lineHeight: 1 }}>{resume.name || "Your Name"}</p>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#facc15", letterSpacing: "0.2em", textTransform: "uppercase", margin: "4px 0 0" }}>{resume.title || "Professional"}</p>
      </div>

      {/* Contact strip */}
      <div style={{ padding: "8px 30px", background: "#facc15", display: "flex", gap: 20, flexWrap: "wrap" }}>
        {[resume.phone, resume.email, resume.location].filter(Boolean).map((v, i) => (
          <span key={i} style={{ fontSize: 9.5, fontWeight: 700, color: "#000" }}>{v}</span>
        ))}
        <ContactLinks resume={resume} formatting={formatting} isDark={true} />
      </div>

      <div style={{ flex: 1, padding: "18px 30px 20px", display: "flex", flexDirection: "column" }}>
        {/* Summary */}
        {resume.summary && (
          <p style={{ fontSize: 10.5, color: "#334155", fontWeight: 500, lineHeight: 1.65, margin: "0 0 14px" }}>{resume.summary}</p>
        )}

        {/* Two-column layout */}
        <div style={{ display: "flex", gap: 20, flex: 1 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {/* Experience */}
            {resume.workExperience.filter(e => e.role).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 10, fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.12em", borderBottom: "4px solid #facc15", paddingBottom: 4, marginBottom: 8, display: "inline-block" }}>Experience</p>
                {resume.workExperience.map(exp => (
                  <div key={exp.id} style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 800, color: "#000", margin: "0 0 1px" }}>{exp.role}</p>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "#facc15", margin: "0 0 1px" }}>{exp.company}</p>
                    <p style={{ fontSize: 9, color: "#64748b", margin: "0 0 2px" }}>{exp.start}{exp.end ? ` – ${exp.end}` : ""}</p>
                    {exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 10, color: "#475569", lineHeight: 1.5, margin: 0 }} />}
                  </div>
                ))}
              </div>
            )}
            <div style={{ flex: 1 }} />
          </div>

          <div style={{ width: 140, flexShrink: 0, display: "flex", flexDirection: "column" }}>
            {/* Skills */}
            {resume.skills.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 10, fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Skills</p>
                {resume.skills.map(s => (
                  <p key={s} style={{ fontSize: 9.5, color: "#334155", fontWeight: 600, margin: "0 0 3px", borderBottom: "1px solid #f1f5f9", paddingBottom: 2 }}>{s}</p>
                ))}
              </div>
            )}

            {/* Education */}
            {resume.education.filter(e => e.degree).length > 0 && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Education</p>
                {resume.education.map((e, i) => (
                  <div key={i} style={{ marginBottom: 4 }}>
                    <p style={{ fontSize: 9.5, fontWeight: 700, color: "#1e293b", margin: 0 }}>{e.degree}</p>
                    <p style={{ fontSize: 8.5, color: "#64748b", margin: 0 }}>{e.institution}{e.year ? ` · ${e.year}` : ""}</p>
                  </div>
                ))}
              </div>
            )}
            <DefaultExtraSections resume={resume} formatting={formatting} isDark={true} />
            <div style={{ flex: 1 }} />
          </div>
        </div>
      </div>

    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 11 — Sidebar (Free)
   Inline sidebar with accent color, clean
═════════════════════════════════════════════════════════════ */
export function TemplateSidebar({ resume, formatting = {} }) {
  const { first, last } = nameParts(resume.name);
  const ac = formatting.accentColor || "#6366f1";
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", fontFamily: getFontFamily(formatting), background: "#fff" }}>
      <div style={{ width: 200, flexShrink: 0, background: ac, padding: "28px 16px", display: "flex", flexDirection: "column" }}>
        {resume.photo && <div style={{ width: 70, height: 70, borderRadius: 12, overflow: "hidden", alignSelf: "center", marginBottom: 10, border: "2px solid rgba(255,255,255,0.3)" }}><img src={resume.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
        <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", textAlign: "center", margin: "0 0 2px" }}>{first}<br />{last}</p>
        <p style={{ fontSize: 7.5, fontWeight: 700, color: "rgba(255,255,255,0.65)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 14px" }}>{resume.title || "Professional"}</p>
        <div style={{ height: 1, background: "rgba(255,255,255,0.12)", marginBottom: 12 }} />
        <p style={{ fontSize: 7, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Contact</p>
        {[resume.phone, resume.email, resume.location].filter(Boolean).map((v, i) => <p key={i} style={{ fontSize: 9, color: "rgba(255,255,255,0.8)", margin: "0 0 4px", wordBreak: "break-word" }}>{v}</p>)}
        <ContactLinks resume={resume} direction="column" />

        <div style={{ height: 1, background: "rgba(255,255,255,0.12)", margin: "10px 0" }} />
        <p style={{ fontSize: 7, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Skills</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>{resume.skills.map(s => <span key={s} style={{ fontSize: 8, color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 3 }}>{s}</span>)}</div>
      </div>
      <div style={{ flex: 1, padding: "28px 22px 20px", display: "flex", flexDirection: "column" }}>
        {resume.summary && <p style={{ fontSize: 10, color: "#475569", lineHeight: 1.6, margin: "0 0 12px" }}>{resume.summary}</p>}
        {resume.workExperience.filter(e => e.role).length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 8, fontWeight: 800, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: `2px solid ${ac}`, paddingBottom: 4, marginBottom: 8 }}>Experience</p>
            {resume.workExperience.map(exp => (
              <div key={exp.id} style={{ marginBottom: 8, paddingLeft: 10, borderLeft: `2px solid ${ac}22` }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><p style={{ fontSize: 10.5, fontWeight: 700, color: "#1e293b", margin: 0 }}>{exp.role}</p><p style={{ fontSize: 8, color: ac, fontWeight: 600, margin: 0 }}>{exp.start}{exp.end ? ` – ${exp.end}` : ""}</p></div>
                <p style={{ fontSize: 9, color: "#64748b", margin: "1px 0 3px" }}>{exp.company}</p>
                {exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 9, color: "#475569", lineHeight: 1.5, margin: 0 }} />}
              </div>
            ))}
          </div>
        )}
        {resume.education.filter(e => e.degree).length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 8, fontWeight: 800, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: `2px solid ${ac}`, paddingBottom: 4, marginBottom: 8 }}>Education</p>
            {resume.education.map((e, i) => <div key={i} style={{ marginBottom: 4 }}><p style={{ fontSize: 9.5, fontWeight: 600, color: "#1e293b", margin: 0 }}>{e.degree}</p><p style={{ fontSize: 8.5, color: "#64748b", margin: 0 }}>{e.institution}{e.year ? ` · ${e.year}` : ""}</p></div>)}
          </div>
        )}
        <DefaultExtraSections resume={resume} formatting={formatting} />
        <div style={{ flex: 1 }} />
      </div>

    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 12 — Timeline (Free)
   Chronological timeline for experience
═════════════════════════════════════════════════════════════ */
export function TemplateTimeline({ resume, formatting = {} }) {
  const ac = formatting.accentColor || "#0891b2";
  return (
    <div style={{ width: "100%", height: "100%", fontFamily: getFontFamily(formatting), background: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ background: `linear-gradient(135deg, ${ac}, #0e7490)`, padding: "20px 28px", display: "flex", alignItems: "center", gap: 16 }}>
        {resume.photo && <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0 }}><img src={resume.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
        <div><p style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>{resume.name || "Your Name"}</p><p style={{ fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.7)", margin: "2px 0 0" }}>{resume.title || "Professional"}</p></div>
      </div>
      <div style={{ padding: "12px 28px", background: "#f0fdfa", borderBottom: "1px solid #ccfbf1", display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[resume.phone, resume.email, resume.location].filter(Boolean).map((v, i) => <span key={i} style={{ fontSize: 8.5, color: "#0f766e" }}>{v}</span>)}
        <ContactLinks resume={resume} formatting={formatting} />
      </div>
      <div style={{ flex: 1, padding: "16px 28px 20px", display: "flex", flexDirection: "column" }}>
        {resume.summary && <p style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.6, margin: "0 0 12px" }}>{resume.summary}</p>}
        {resume.workExperience.filter(e => e.role).length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 8, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Experience</p>
            {resume.workExperience.map((exp, i, arr) => (
              <div key={exp.id} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: ac }} />
                  {i < arr.length - 1 && <div style={{ flex: 1, width: 1.5, background: "#e2e8f0" }} />}
                </div>
                <div style={{ flex: 1 }}><p style={{ fontSize: 10.5, fontWeight: 700, color: "#0f172a", margin: "0 0 1px" }}>{exp.role}</p><p style={{ fontSize: 9, color: ac, fontWeight: 600, margin: "0 0 1px" }}>{exp.company} · {exp.start}{exp.end ? ` – ${exp.end}` : ""}</p>{exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 9, color: "#475569", lineHeight: 1.5, margin: "2px 0 0" }} />}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 16 }}>
          {resume.education.filter(e => e.degree).length > 0 && (
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 8, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Education</p>
              {resume.education.map((e, i) => <div key={i} style={{ marginBottom: 4 }}><p style={{ fontSize: 9.5, fontWeight: 600, color: "#1e293b", margin: 0 }}>{e.degree}</p><p style={{ fontSize: 8.5, color: "#64748b", margin: 0 }}>{e.institution}</p></div>)}
            </div>
          )}
          {resume.skills.length > 0 && (
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 8, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Skills</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>{resume.skills.map(s => <span key={s} style={{ fontSize: 8, color: "#475569", background: "#f0fdfa", padding: "2px 7px", borderRadius: 3 }}>{s}</span>)}</div>
            </div>
          )}
        </div>
        <DefaultExtraSections resume={resume} formatting={formatting} />
        <div style={{ flex: 1 }} />
      </div>

    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 13 — Compact (Free)
   Single-column dense professional
═════════════════════════════════════════════════════════════ */
export function TemplateCompact({ resume, formatting = {} }) {
  const { first, last } = nameParts(resume.name);
  const ac = formatting.accentColor || "#94a3b8";
  return (
    <div style={{ width: "100%", height: "100%", fontFamily: getFontFamily(formatting), background: "#fff", display: "flex", flexDirection: "column", padding: "24px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
        {resume.photo && <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}><img src={resume.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
        <div><p style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>{first} {last}</p><p style={{ fontSize: 9, fontWeight: 600, color: "#64748b", margin: "1px 0 0" }}>{resume.title || "Professional"}</p></div>
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 8.5, color: ac, marginBottom: 8, flexWrap: "wrap" }}>{[resume.phone, resume.email, resume.location].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}<ContactLinks resume={resume} formatting={formatting} /></div>
      {resume.summary && <p style={{ fontSize: 9, color: "#475569", lineHeight: 1.55, margin: "0 0 10px" }}>{resume.summary}</p>}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {resume.workExperience.filter(e => e.role).length > 0 && (
          <div style={{ marginBottom: 10 }}><p style={{ fontSize: 7.5, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.12em", borderBottom: "1px solid #e2e8f0", paddingBottom: 4, marginBottom: 6 }}>Experience</p>
            {resume.workExperience.map(exp => <div key={exp.id} style={{ marginBottom: 5 }}><p style={{ fontSize: 9.5, fontWeight: 700, color: "#0f172a", margin: 0 }}>{exp.role}</p><p style={{ fontSize: 8.5, color: "#475569", margin: "0 0 1px" }}>{exp.company}<span style={{ color: ac }}> · {exp.start}{exp.end ? ` – ${exp.end}` : ""}</span></p>{exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 8.5, color: "#64748b", lineHeight: 1.45, margin: 0 }} />}</div>)}
          </div>
        )}
        {resume.education.filter(e => e.degree).length > 0 && (
          <div style={{ marginBottom: 10 }}><p style={{ fontSize: 7.5, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.12em", borderBottom: "1px solid #e2e8f0", paddingBottom: 4, marginBottom: 6 }}>Education</p>
            {resume.education.map((e, i) => <div key={i} style={{ marginBottom: 3, display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 8.5, fontWeight: 600, color: "#1e293b" }}>{e.degree}{e.institution ? ` – ${e.institution}` : ""}</span><span style={{ fontSize: 8, color: ac }}>{e.year}</span></div>)}
          </div>
        )}
        {resume.skills.length > 0 && (
          <div><p style={{ fontSize: 7.5, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.12em", borderBottom: "1px solid #e2e8f0", paddingBottom: 4, marginBottom: 6 }}>Skills</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>{resume.skills.map(s => <span key={s} style={{ fontSize: 8, color: "#475569", background: "#f8fafc", padding: "2px 7px", borderRadius: 3, border: "1px solid #e2e8f0" }}>{s}</span>)}</div>
          </div>
        )}
        <DefaultExtraSections resume={resume} formatting={formatting} />
        <div style={{ flex: 1 }} />
      </div>

    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 14 — Focus (Free)
   Minimal with bold left accent border
═════════════════════════════════════════════════════════════ */
export function TemplateFocus({ resume, formatting = {} }) {
  const ac = formatting.accentColor || "#0f172a";
  return (
    <div style={{ width: "100%", height: "100%", fontFamily: getFontFamily(formatting), background: "#fff", display: "flex" }}>
      <div style={{ width: 5, background: ac, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: "28px 28px 20px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div><p style={{ fontSize: 22, fontWeight: 700, color: ac, margin: 0, letterSpacing: "-0.03em" }}>{resume.name || "Your Name"}</p><p style={{ fontSize: 10, fontWeight: 600, color: "#64748b", margin: "1px 0 0" }}>{resume.title || "Professional"}</p></div>
          {resume.photo && <div style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}><img src={resume.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 9, color: "#94a3b8", marginBottom: 12, borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>{[resume.phone, resume.email, resume.location].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}<ContactLinks resume={resume} formatting={formatting} /></div>
        {resume.summary && <p style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.6, margin: "0 0 12px", fontStyle: "italic" }}>{resume.summary}</p>}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {resume.workExperience.filter(e => e.role).length > 0 && (
            <div style={{ marginBottom: 12 }}><p style={{ fontSize: 8, fontWeight: 800, color: ac, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Experience</p>
              {resume.workExperience.map(exp => <div key={exp.id} style={{ marginBottom: 7, padding: "7px 10px", background: "#f8fafc", borderLeft: `3px solid ${ac}`, borderRadius: "0 6px 6px 0" }}><p style={{ fontSize: 10, fontWeight: 700, color: "#1e293b", margin: 0 }}>{exp.role}</p><p style={{ fontSize: 8.5, color: "#64748b", margin: "0 0 2px" }}>{exp.company} · {exp.start}{exp.end ? ` – ${exp.end}` : ""}</p>{exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 8.5, color: "#475569", lineHeight: 1.45, margin: 0 }} />}</div>)}
            </div>
          )}
          {resume.projects.filter(p => p.name).length > 0 && (
            <div style={{ marginBottom: 10 }}><p style={{ fontSize: 8, fontWeight: 800, color: ac, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Projects</p>
              {resume.projects.map(p => <div key={p.id} style={{ marginBottom: 5 }}><p style={{ fontSize: 9.5, fontWeight: 600, color: "#1e293b", margin: 0 }}>{p.link ? <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>{p.name}</a> : p.name}{p.year ? ` (${p.year})` : ""}</p>{p.desc && <ProjectBullets text={p.desc} formatting={formatting} style={{ fontSize: 8.5, color: "#64748b", lineHeight: 1.45, margin: 0 }} />}</div>)}
            </div>
          )}
          <div style={{ display: "flex", gap: 16, marginTop: "auto" }}>
            {resume.education.filter(e => e.degree).length > 0 && <div style={{ flex: 1 }}><p style={{ fontSize: 7.5, fontWeight: 800, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Education</p>{resume.education.map((e, i) => <p key={i} style={{ fontSize: 8.5, color: "#1e293b", margin: "0 0 2px", fontWeight: 600 }}>{e.degree}<span style={{ color: "#94a3b8", fontWeight: 400 }}> · {e.institution}</span></p>)}</div>}
            {resume.skills.length > 0 && <div style={{ flex: 1 }}><p style={{ fontSize: 7.5, fontWeight: 800, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Skills</p><div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>{resume.skills.map(s => <span key={s} style={{ fontSize: 8, color: "#475569", background: "#f1f5f9", padding: "2px 6px", borderRadius: 2 }}>{s}</span>)}</div></div>}
          </div>
        </div>
        <DefaultExtraSections resume={resume} formatting={formatting} skipProjects />
        <div style={{ flex: 1 }} />
      </div>

    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 15 — Grid (Free)
   Two-column grid layout
═════════════════════════════════════════════════════════════ */
export function TemplateGrid({ resume, formatting = {} }) {
  const ac = formatting.accentColor || "#7c3aed";
  return (
    <div style={{ width: "100%", height: "100%", fontFamily: getFontFamily(formatting), background: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ background: ac, padding: "18px 24px 14px", display: "flex", alignItems: "center", gap: 14 }}>
        {resume.photo && <div style={{ width: 50, height: 50, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(255,255,255,0.3)" }}><img src={resume.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
        <div><p style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>{resume.name || "Your Name"}</p><p style={{ fontSize: 9, fontWeight: 500, color: "rgba(255,255,255,0.7)", margin: "1px 0 0" }}>{resume.title || "Professional"}</p></div>
      </div>
      <div style={{ flex: 1, padding: "14px 24px 20px", display: "flex", gap: 16 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {resume.summary && <p style={{ fontSize: 9, color: "#475569", lineHeight: 1.55, margin: "0 0 10px" }}>{resume.summary}</p>}
          {resume.workExperience.filter(e => e.role).length > 0 && (
            <div style={{ marginBottom: 10 }}><p style={{ fontSize: 7.5, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Experience</p>
              {resume.workExperience.map(exp => <div key={exp.id} style={{ marginBottom: 5, padding: "6px 8px", background: "#faf5ff", borderRadius: 6 }}><p style={{ fontSize: 9.5, fontWeight: 700, color: "#1e293b", margin: 0 }}>{exp.role}</p><p style={{ fontSize: 8, color: ac, margin: 0 }}>{exp.company}<span style={{ color: "#94a3b8", fontWeight: 400 }}> · {exp.start}{exp.end ? ` – ${exp.end}` : ""}</span></p>{exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 8, color: "#475569", lineHeight: 1.4, margin: "1px 0 0" }} />}</div>)}
            </div>
          )}
          <DefaultExtraSections resume={resume} formatting={formatting} />
          <div style={{ flex: 1 }} />
        </div>
        <div style={{ width: 130, flexShrink: 0 }}>
          <p style={{ fontSize: 7.5, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Contact</p>
          {[resume.phone, resume.email, resume.location].filter(Boolean).map((v, i) => <p key={i} style={{ fontSize: 8, color: "#64748b", margin: "0 0 4px", wordBreak: "break-word" }}>{v}</p>)}
          <ContactLinks resume={resume} direction="column" />
          {resume.skills.length > 0 && <><p style={{ fontSize: 7.5, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", margin: "10px 0 4px" }}>Skills</p>
            {resume.skills.map(s => <p key={s} style={{ fontSize: 8, color: "#475569", margin: "0 0 2px" }}>▸ {s}</p>)}</>}
          {resume.education.filter(e => e.degree).length > 0 && <><p style={{ fontSize: 7.5, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", margin: "10px 0 4px" }}>Education</p>
            {resume.education.map((e, i) => <p key={i} style={{ fontSize: 8, color: "#1e293b", margin: "0 0 3px", fontWeight: 600 }}>{e.degree}<br /><span style={{ fontWeight: 400, color: "#64748b" }}>{e.institution}</span></p>)}</>}
        </div>
      </div>

    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 16 — Cardinal (PRO)
   Premium red/navy contrast
═════════════════════════════════════════════════════════════ */
export function TemplateCardinal({ resume, formatting = {} }) {
  const ac = formatting.accentColor || "#dc2626";
  return (
    <div style={{ width: "100%", height: "100%", fontFamily: getFontFamily(formatting), background: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#0f172a", padding: "22px 26px 16px", display: "flex", gap: 14, alignItems: "center" }}>
        {resume.photo && <div style={{ width: 54, height: 54, borderRadius: 14, overflow: "hidden", border: "2px solid rgba(220,38,38,0.5)" }}><img src={resume.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
        <div><p style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>{resume.name || "Your Name"}</p><p style={{ fontSize: 9, fontWeight: 600, color: ac, letterSpacing: "0.08em", textTransform: "uppercase", margin: "2px 0 0" }}>{resume.title || "Professional"}</p></div>
      </div>
      <div style={{ background: ac, padding: "6px 26px", display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[resume.phone, resume.email, resume.location].filter(Boolean).map((v, i) => <span key={i} style={{ fontSize: 8.5, color: "#fff", fontWeight: 600 }}>{v}</span>)}
        <ContactLinks resume={resume} formatting={formatting} />
      </div>
      <div style={{ flex: 1, padding: "14px 26px 20px", display: "flex", gap: 18 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {resume.summary && <p style={{ fontSize: 9, color: "#475569", lineHeight: 1.55, margin: "0 0 10px" }}>{resume.summary}</p>}
          {resume.workExperience.filter(e => e.role).length > 0 && (
            <div style={{ marginBottom: 10 }}><p style={{ fontSize: 8, fontWeight: 800, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: `2px solid ${ac}`, paddingBottom: 3, marginBottom: 6 }}>Experience</p>
              {resume.workExperience.map(exp => <div key={exp.id} style={{ marginBottom: 6, padding: "7px 10px", background: "#fef2f2", borderRadius: 6 }}><p style={{ fontSize: 10, fontWeight: 700, color: "#1e293b", margin: 0 }}>{exp.role}</p><p style={{ fontSize: 8.5, color: ac, fontWeight: 600, margin: 0 }}>{exp.company} · {exp.start}{exp.end ? ` – ${exp.end}` : ""}</p>{exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 8.5, color: "#475569", lineHeight: 1.45, margin: "1px 0 0" }} />}</div>)}
            </div>
          )}
          {resume.projects.filter(p => p.name).length > 0 && (
            <div style={{ marginBottom: 8 }}><p style={{ fontSize: 8, fontWeight: 800, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: `2px solid ${ac}`, paddingBottom: 3, marginBottom: 6 }}>Projects</p>
              {resume.projects.map(p => <div key={p.id} style={{ marginBottom: 4 }}><p style={{ fontSize: 9.5, fontWeight: 600, color: "#1e293b", margin: 0 }}>{p.link ? <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>{p.name}</a> : p.name}</p>{p.desc && <ProjectBullets text={p.desc} formatting={formatting} style={{ fontSize: 8.5, color: "#64748b", lineHeight: 1.4, margin: 0 }} />}</div>)}
            </div>
          )}
          <div style={{ flex: 1 }} />
        </div>
        <div style={{ width: 130, flexShrink: 0, display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 7.5, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Skills</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 2, marginBottom: 10 }}>{resume.skills.map(s => <span key={s} style={{ fontSize: 7.5, color: "#475569", background: "#f1f5f9", padding: "2px 6px", borderRadius: 3 }}>{s}</span>)}</div>
          {resume.education.filter(e => e.degree).length > 0 && <><p style={{ fontSize: 7.5, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Education</p>
            {resume.education.map((e, i) => <div key={i} style={{ marginBottom: 4 }}><p style={{ fontSize: 8.5, fontWeight: 600, color: "#1e293b", margin: 0 }}>{e.degree}</p><p style={{ fontSize: 8, color: "#64748b", margin: 0 }}>{e.institution}</p></div>)}</>}
          <DefaultExtraSections resume={resume} formatting={formatting} skipProjects />
          <div style={{ flex: 1 }} />
        </div>
      </div>

    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 17 — Obsidian (PRO)
   Full dark mode with purple-neon accents
═════════════════════════════════════════════════════════════ */
export function TemplateObsidian({ resume, formatting = {} }) {
  const ac = formatting.accentColor || "#a855f7";
  return (
    <div style={{ width: "100%", height: "100%", fontFamily: getFontFamily(formatting), background: "#09090b", display: "flex", flexDirection: "column" }}>
      <div style={{ borderBottom: `1px solid ${ac}22`, padding: "22px 26px 14px", display: "flex", alignItems: "center", gap: 14 }}>
        {resume.photo && <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", border: `2px solid ${ac}44` }}><img src={resume.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
        <div><p style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>{resume.name || "Your Name"}</p><p style={{ fontSize: 9, color: ac, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: "1px 0 0" }}>{resume.title || "Professional"}</p></div>
      </div>
      <div style={{ padding: "8px 26px", display: "flex", gap: 14, flexWrap: "wrap", background: "rgba(255,255,255,0.03)" }}>
        {[resume.phone, resume.email, resume.location].filter(Boolean).map((v, i) => <span key={i} style={{ fontSize: 8, color: "#a1a1aa" }}>{v}</span>)}
        <ContactLinks resume={resume} formatting={formatting} isDark={true} />
      </div>
      <div style={{ flex: 1, padding: "14px 26px 20px", display: "flex", flexDirection: "column" }}>
        {resume.summary && <p style={{ fontSize: 9, color: "#a1a1aa", lineHeight: 1.55, margin: "0 0 10px" }}>{resume.summary}</p>}
        {resume.workExperience.filter(e => e.role).length > 0 && (
          <div style={{ marginBottom: 10 }}><p style={{ fontSize: 7.5, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Experience</p>
            {resume.workExperience.map(exp => <div key={exp.id} style={{ marginBottom: 6, padding: "8px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 6, border: `1px solid rgba(168,85,247,0.08)` }}><p style={{ fontSize: 9.5, fontWeight: 700, color: "#e4e4e7", margin: 0 }}>{exp.role}</p><p style={{ fontSize: 8, color: ac, fontWeight: 600, margin: 0 }}>{exp.company} · {exp.start}{exp.end ? ` – ${exp.end}` : ""}</p>{exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 8, color: "#a1a1aa", lineHeight: 1.45, margin: "1px 0 0" }} />}</div>)}
          </div>
        )}
        <div style={{ display: "flex", gap: 14 }}>
          {resume.education.filter(e => e.degree).length > 0 && (
            <div style={{ flex: 1 }}><p style={{ fontSize: 7.5, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Education</p>
              {resume.education.map((e, i) => <div key={i} style={{ marginBottom: 4 }}><p style={{ fontSize: 8.5, fontWeight: 600, color: "#d4d4d8", margin: 0 }}>{e.degree}</p><p style={{ fontSize: 8, color: "#71717a", margin: 0 }}>{e.institution}</p></div>)}
            </div>
          )}
          {resume.skills.length > 0 && (
            <div style={{ flex: 1 }}><p style={{ fontSize: 7.5, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Skills</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>{resume.skills.map(s => <span key={s} style={{ fontSize: 7.5, color: "#d4d4d8", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 3 }}>{s}</span>)}</div>
            </div>
          )}
        </div>
        <DefaultExtraSections resume={resume} formatting={formatting} isDark={true} />
        <div style={{ flex: 1 }} />
      </div>

    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 18 — Luxury (PRO)
   Gold/black editorial/premium feel
═════════════════════════════════════════════════════════════ */
export function TemplateLuxury({ resume, formatting = {} }) {
  const ac = formatting.accentColor || "#b8860b";
  const { first, last } = nameParts(resume.name);
  return (
    <div style={{ width: "100%", height: "100%", fontFamily: getFontFamily(formatting, "'Playfair Display', 'Georgia', serif"), background: "#faf8f5", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", padding: "28px 30px 20px", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 160, height: 160, background: `radial-gradient(circle, ${ac}11 0%, transparent 70%)` }} />
        <div style={{ display: "flex", gap: 16, alignItems: "center", position: "relative", zIndex: 1 }}>
          {resume.photo && <div style={{ width: 60, height: 60, borderRadius: "50%", overflow: "hidden", border: `2px solid ${ac}66` }}><img src={resume.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
          <div><p style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "0.02em" }}>{first} {last}</p><p style={{ fontSize: 11, color: ac, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", margin: "2px 0 6px" }}>{resume.title || "Professional"}</p><div style={{ height: 2, width: 50, background: ac, borderRadius: 1 }} /></div>
        </div>
      </div>
      <div style={{ padding: "10px 30px", background: "#fff", borderBottom: "1px solid #e2d5b0", display: "flex", gap: 18, flexWrap: "wrap" }}>
        {[resume.phone, resume.email, resume.location].filter(Boolean).map((v, i) => <span key={i} style={{ fontSize: 9, color: "#6b5b4e", fontFamily: getFontFamily(formatting) }}>{v}</span>)}
        <ContactLinks resume={resume} formatting={formatting} isDark={true} />
      </div>
      <div style={{ flex: 1, padding: "16px 30px 20px", display: "flex", flexDirection: "column" }}>
        {resume.summary && <p style={{ fontSize: 10, color: "#6b5b4e", fontStyle: "italic", lineHeight: 1.65, margin: "0 0 12px", fontFamily: getFontFamily(formatting) }}>{resume.summary}</p>}
        {resume.workExperience.filter(e => e.role).length > 0 && (
          <div style={{ marginBottom: 10 }}><p style={{ fontSize: 9, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.15em", borderBottom: "1px solid #e2d5b0", paddingBottom: 4, marginBottom: 8 }}>Experience</p>
            {resume.workExperience.map(exp => <div key={exp.id} style={{ marginBottom: 7 }}><p style={{ fontSize: 11, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>{exp.role}</p><p style={{ fontSize: 9, color: ac, margin: "0 0 1px" }}>{exp.company} · {exp.start}{exp.end ? ` – ${exp.end}` : ""}</p>{exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 9, color: "#6b5b4e", lineHeight: 1.5, margin: 0, fontFamily: getFontFamily(formatting) }} />}</div>)}
          </div>
        )}
        <div style={{ display: "flex", gap: 20 }}>
          {resume.education.filter(e => e.degree).length > 0 && (
            <div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.15em", borderBottom: "1px solid #e2d5b0", paddingBottom: 4, marginBottom: 6 }}>Education</p>
              {resume.education.map((e, i) => <div key={i} style={{ marginBottom: 4 }}><p style={{ fontSize: 9.5, fontWeight: 600, color: "#1a1a2e", margin: 0 }}>{e.degree}</p><p style={{ fontSize: 8.5, color: "#6b5b4e", margin: 0 }}>{e.institution}{e.year ? ` · ${e.year}` : ""}</p></div>)}
            </div>
          )}
          {resume.skills.length > 0 && (
            <div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.15em", borderBottom: "1px solid #e2d5b0", paddingBottom: 4, marginBottom: 6 }}>Skills</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>{resume.skills.map(s => <span key={s} style={{ fontSize: 8.5, color: "#6b5b4e", fontFamily: getFontFamily(formatting), padding: "2px 7px", border: "1px solid #e2d5b0", borderRadius: 2 }}>{s}</span>)}</div>
            </div>
          )}
        </div>
        <DefaultExtraSections resume={resume} formatting={formatting} isDark={true} />
        <div style={{ flex: 1 }} />
      </div>

    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 19 — Nature (PRO)
   Green, organic tones
═════════════════════════════════════════════════════════════ */
export function TemplateNature({ resume, formatting = {} }) {
  const ac = formatting.accentColor || "#059669";
  return (
    <div style={{ width: "100%", height: "100%", fontFamily: getFontFamily(formatting), background: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ background: `linear-gradient(135deg, ${ac}, #059669)`, padding: "20px 26px 14px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -40, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ display: "flex", gap: 14, alignItems: "center", position: "relative", zIndex: 1 }}>
          {resume.photo && <div style={{ width: 54, height: 54, borderRadius: 12, overflow: "hidden", border: "2px solid rgba(255,255,255,0.25)" }}><img src={resume.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
          <div><p style={{ fontSize: 19, fontWeight: 800, color: "#fff", margin: 0 }}>{resume.name || "Your Name"}</p><p style={{ fontSize: 9, fontWeight: 500, color: "rgba(255,255,255,0.75)", letterSpacing: "0.06em", textTransform: "uppercase", margin: "2px 0 0" }}>{resume.title || "Professional"}</p></div>
        </div>
      </div>
      <div style={{ padding: "8px 26px", background: "#f0fdf4", display: "flex", gap: 14, flexWrap: "wrap", borderBottom: "1px solid #bbf7d0" }}>
        {[resume.phone, resume.email, resume.location].filter(Boolean).map((v, i) => <span key={i} style={{ fontSize: 8.5, color: "#065f46" }}>{v}</span>)}
        <ContactLinks resume={resume} formatting={formatting} />
      </div>
      <div style={{ flex: 1, padding: "14px 26px 20px", display: "flex", flexDirection: "column" }}>
        {resume.summary && <p style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.55, margin: "0 0 10px" }}>{resume.summary}</p>}
        {resume.workExperience.filter(e => e.role).length > 0 && (
          <div style={{ marginBottom: 10 }}><p style={{ fontSize: 7.5, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Experience</p>
            {resume.workExperience.map(exp => <div key={exp.id} style={{ marginBottom: 6, paddingLeft: 10, borderLeft: `2px solid ${ac}33` }}><p style={{ fontSize: 10, fontWeight: 700, color: "#1e293b", margin: 0 }}>{exp.role}</p><p style={{ fontSize: 8.5, color: ac, fontWeight: 600, margin: 0 }}>{exp.company} · {exp.start}{exp.end ? ` – ${exp.end}` : ""}</p>{exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 8.5, color: "#475569", lineHeight: 1.45, margin: "1px 0 0" }} />}</div>)}
          </div>
        )}
        <div style={{ display: "flex", gap: 16 }}>
          {resume.education.filter(e => e.degree).length > 0 && (
            <div style={{ flex: 1 }}><p style={{ fontSize: 7.5, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Education</p>
              {resume.education.map((e, i) => <div key={i} style={{ marginBottom: 4, padding: "6px 8px", background: "#f0fdf4", borderRadius: 4 }}><p style={{ fontSize: 9, fontWeight: 600, color: "#1e293b", margin: 0 }}>{e.degree}</p><p style={{ fontSize: 8, color: "#065f46", margin: 0 }}>{e.institution}{e.year ? ` · ${e.year}` : ""}</p></div>)}
            </div>
          )}
          {resume.skills.length > 0 && (
            <div style={{ flex: 1 }}><p style={{ fontSize: 7.5, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Skills</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>{resume.skills.map(s => <span key={s} style={{ fontSize: 8, color: "#065f46", background: "#f0fdf4", padding: "2px 6px", borderRadius: 3 }}>{s}</span>)}</div>
            </div>
          )}
        </div>
        <DefaultExtraSections resume={resume} formatting={formatting} />
        <div style={{ flex: 1 }} />
      </div>

    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TEMPLATE 20 — Slate (PRO)
   Modern blue-gray, clean corporate
═════════════════════════════════════════════════════════════ */
export function TemplateSlate({ resume, formatting = {} }) {
  const ac = formatting.accentColor || "#475569";
  const { first, last } = nameParts(resume.name);
  return (
    <div style={{ width: "100%", height: "100%", fontFamily: getFontFamily(formatting), background: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex" }}>
        <div style={{ width: 5, background: `linear-gradient(180deg, #0f172a, ${ac})`, flexShrink: 0 }} />
        <div style={{ flex: 1, padding: "22px 24px 12px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {resume.photo && <div style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: "1px solid #cbd5e1" }}><img src={resume.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
            <div><p style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>{first} {last}</p><p style={{ fontSize: 9, color: "#64748b", fontWeight: 500, margin: "1px 0 0" }}>{resume.title || "Professional"}</p></div>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 6, fontSize: 8.5, color: "#94a3b8", flexWrap: "wrap" }}>
            {[resume.phone, resume.email, resume.location].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}
            <ContactLinks resume={resume} formatting={formatting} />
          </div>
        </div>
      </div>
      <div style={{ flex: 1, padding: "12px 24px 20px", display: "flex", gap: 18 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {resume.summary && <p style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.55, margin: "0 0 10px" }}>{resume.summary}</p>}
          {resume.workExperience.filter(e => e.role).length > 0 && (
            <div style={{ marginBottom: 10 }}><p style={{ fontSize: 7.5, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Experience</p>
              {resume.workExperience.map(exp => <div key={exp.id} style={{ marginBottom: 6, padding: "7px 10px", background: "#f8fafc", borderRadius: 4, borderLeft: `3px solid ${ac}` }}><p style={{ fontSize: 9.5, fontWeight: 700, color: "#1e293b", margin: 0 }}>{exp.role}</p><p style={{ fontSize: 8, color: "#64748b", margin: 0 }}>{exp.company} · {exp.start}{exp.end ? ` – ${exp.end}` : ""}</p>{exp.desc && <FormattedParagraph text={exp.desc} formatting={formatting} style={{ fontSize: 8, color: "#475569", lineHeight: 1.45, margin: "1px 0 0" }} />}</div>)}
            </div>
          )}
          <DefaultExtraSections resume={resume} formatting={formatting} />
          <div style={{ flex: 1 }} />
        </div>
        <div style={{ width: 140, flexShrink: 0 }}>
          {resume.skills.length > 0 && (
            <div style={{ marginBottom: 12 }}><p style={{ fontSize: 7.5, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Skills</p>
              {resume.skills.map(s => <p key={s} style={{ fontSize: 8.5, color: "#475569", margin: "0 0 3px", borderBottom: "1px solid #f1f5f9", paddingBottom: 2 }}>{s}</p>)}
            </div>
          )}
          {resume.education.filter(e => e.degree).length > 0 && (
            <div><p style={{ fontSize: 7.5, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Education</p>
              {resume.education.map((e, i) => <div key={i} style={{ marginBottom: 4 }}><p style={{ fontSize: 9, fontWeight: 600, color: "#1e293b", margin: 0 }}>{e.degree}</p><p style={{ fontSize: 8, color: "#64748b", margin: 0 }}>{e.institution}</p></div>)}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   Template definition metadata
═════════════════════════════════════════════════════════════ */
function TemplateCardPreview({ accent, name, tag, isDark }) {
  const bg = isDark ? "#1e293b" : "#fff";
  const textColor = isDark ? "#fff" : "#0f172a";
  const labelColor = isDark ? "rgba(255,255,255,0.5)" : "#64748b";
  return (
    <div style={{ width: "100%", height: "100%", background: bg, padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Header line */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <div style={{ width: 20, height: 20, borderRadius: 4, background: accent }} />
        <div style={{ height: 6, width: "60%", borderRadius: 2, background: labelColor, opacity: 0.4 }} />
      </div>
      {/* Title lines */}
      <div style={{ height: 8, width: "80%", borderRadius: 2, background: textColor, opacity: 0.15, marginTop: 6 }} />
      <div style={{ height: 6, width: "50%", borderRadius: 2, background: textColor, opacity: 0.1, marginTop: 2 }} />
      {/* Content blocks */}
      <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ height: 4, width: "100%", borderRadius: 1, background: accent, opacity: 0.3 }} />
          <div style={{ height: 4, width: "85%", borderRadius: 1, background: textColor, opacity: 0.08 }} />
          <div style={{ height: 4, width: "70%", borderRadius: 1, background: textColor, opacity: 0.08 }} />
        </div>
        <div style={{ width: 30, height: 30, borderRadius: 4, background: accent, opacity: 0.15 }} />
      </div>
      {/* More lines */}
      <div style={{ height: 4, width: "90%", borderRadius: 1, background: textColor, opacity: 0.06, marginTop: 2 }} />
      <div style={{ height: 4, width: "60%", borderRadius: 1, background: textColor, opacity: 0.06 }} />
      {/* Tag */}
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
        <div style={{
          fontSize: 7, fontWeight: 800, padding: "1px 6px", borderRadius: 3,
          background: tag === "PRO" ? accent : "transparent",
          color: tag === "PRO" ? "#fff" : accent,
          border: tag === "PRO" ? "none" : `1px solid ${accent}`,
        }}>
          {tag === "PRO" ? "PRO" : "FREE"}
        </div>
      </div>
    </div>
  );
}

export { TemplateCardPreview };

export const TEMPLATES = [
  { id: "classic-blue", name: "Classic Blue", tag: "Free", accent: "#002366", component: TemplateClassicBlue, isDark: true },
  { id: "corporate", name: "Corporate", tag: "Free", accent: "#143f86", component: TemplateCorporate },
  { id: "minimal-clean", name: "Minimal Clean", tag: "Free", accent: "#94a3b8", component: TemplateMinimalClean },
  { id: "elegant", name: "Elegant", tag: "Free", accent: "#b8860b", component: TemplateElegant },
  { id: "modern-light", name: "Modern Light", tag: "Free", accent: "#667eea", component: TemplateModernLight },
  { id: "sidebar", name: "Sidebar", tag: "Free", accent: "#6366f1", component: TemplateSidebar },
  { id: "timeline", name: "Timeline", tag: "Free", accent: "#0891b2", component: TemplateTimeline },
  { id: "compact", name: "Compact", tag: "Free", accent: "#94a3b8", component: TemplateCompact },
  { id: "focus", name: "Focus", tag: "Free", accent: "#0f172a", component: TemplateFocus },
  { id: "grid", name: "Grid", tag: "Free", accent: "#7c3aed", component: TemplateGrid },
  { id: "executive", name: "Executive", tag: "PRO", accent: "#d4af37", component: TemplateExecutive, isDark: true },
  { id: "creative", name: "Creative", tag: "PRO", accent: "#ff6b6b", component: TemplateCreative },
  { id: "professional-dark", name: "Professional Dark", tag: "PRO", accent: "#06b6d4", component: TemplateProfessionalDark, isDark: true },
  { id: "contemporary", name: "Contemporary", tag: "PRO", accent: "#059669", component: TemplateContemporary },
  { id: "bold", name: "Bold", tag: "PRO", accent: "#000000", component: TemplateBold, isDark: true },
  { id: "cardinal", name: "Cardinal", tag: "PRO", accent: "#dc2626", component: TemplateCardinal },
  { id: "obsidian", name: "Obsidian", tag: "PRO", accent: "#a855f7", component: TemplateObsidian, isDark: true },
  { id: "luxury", name: "Luxury", tag: "PRO", accent: "#b8860b", component: TemplateLuxury, isDark: true },
  { id: "nature", name: "Nature", tag: "PRO", accent: "#059669", component: TemplateNature },
  { id: "slate", name: "Slate", tag: "PRO", accent: "#475569", component: TemplateSlate },
];

export function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
}

export function isProTemplate(id) {
  const t = getTemplate(id);
  return t?.tag === "PRO";
}
