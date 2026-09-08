import React from "react";

export function nameParts(name) {
  const p = (name || "Your Name").split(" ");
  return { first: p[0], last: p.slice(1).join(" ") };
}

export const SectionHead = ({ title, style }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
      ...style,
    }}
  >
    <div
      style={{
        width: 3,
        height: 14,
        background: style?.accent || "#143f86",
        borderRadius: 2,
        flexShrink: 0,
      }}
    />
    <span
      style={{
        fontSize: 8,
        fontWeight: 800,
        color: "#374151",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      }}
    >
      {title}
    </span>
  </div>
);

export function ContactLinks({ resume, isDark, direction }) {
  const items = [];
  if (resume.github)
    items.push({
      badge: "GH",
      label: "GitHub",
      val: resume.github,
      bg: "#333",
    });
  if (resume.linkedin)
    items.push({
      badge: "LI",
      label: "LinkedIn",
      val: resume.linkedin,
      bg: "#0077b5",
    });
  if (resume.mavenjobs)
    items.push({
      badge: "MJ",
      label: "MavenJobs",
      val: resume.mavenjobs,
      bg: "#6366f1",
    });
  if (!items.length) return null;
  const col = isDark ? "#94a3b8" : "#475569";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction || "row",
        flexWrap: "wrap",
        gap: direction === "column" ? 4 : 12,
      }}
    >
      {items.map((item) => (
        <span
          key={item.label}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 9,
            color: col,
            wordBreak: "break-word",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 18,
              height: 18,
              borderRadius: 3,
              fontSize: 7,
              fontWeight: 800,
              color: "#fff",
              background: item.bg,
              flexShrink: 0,
            }}
          >
            {item.badge}
          </span>
          {item.val}
        </span>
      ))}
    </div>
  );
}

export function BulletPoints({ text, style }) {
  if (!text) return null;
  return (
    <p
      style={{
        fontSize: 10,
        color: "#475569",
        lineHeight: 1.6,
        margin: 0,
        ...style,
      }}
    >
      {text}
    </p>
  );
}

export function formatText(text) {
  if (!text) return "";
  let html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>");
  return html;
}

export const FONT_SIZE_SCALE_MAP = { Small: 0.85, Medium: 1, Large: 1.15 };
export const LINE_HEIGHT_MAP = { Compact: 1.3, Medium: 1.55, Comfortable: 1.8 };

export function ProjectBullets({ text, style, formatting }) {
  if (!text) return null;
  const lines = text.split("\n").filter(Boolean);
  if (lines.length === 0) return null;
  const { margin: _m, ...restStyle } = style || {};
  const scale = FONT_SIZE_SCALE_MAP[formatting?.fontSize] || 1;
  const lh = LINE_HEIGHT_MAP[formatting?.spacing] || 1.55;
  const fs = (restStyle?.fontSize || 9.5) * scale;
  const col = restStyle?.color || "#475569";
  return (
    <ul
      style={{ margin: "4px 0 0", padding: 0, listStyle: "none", ...restStyle }}
    >
      {lines.map((line, i) => {
        const clean = line.replace(/^[\s\u2022\-\*]+/, "").trim();
        if (!clean) return null;
        return (
          <li
            key={i}
            style={{
              fontSize: fs,
              color: col,
              lineHeight: lh,
              marginBottom: 2,
              paddingLeft: 18,
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 16,
                textAlign: "center",
                fontSize: fs,
              }}
            >
              {"\u2022"}
            </span>
            <span dangerouslySetInnerHTML={{ __html: formatText(clean) }} />
          </li>
        );
      })}
    </ul>
  );
}

export function FormattedParagraph({ text, style, formatting }) {
  if (!text) return null;
  const scale = FONT_SIZE_SCALE_MAP[formatting?.fontSize] || 1;
  const lh = LINE_HEIGHT_MAP[formatting?.spacing] || 1.55;
  const baseSize = 10 * scale;
  return (
    <p
      style={{
        fontSize: baseSize,
        lineHeight: lh,
        color: "#475569",
        margin: 0,
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: formatText(text) }}
    />
  );
}

export function DefaultExtraSections({ resume, isDark, skipProjects, formatting }) {
  const col = isDark ? "#cbd5e1" : "#475569";
  const headCol = isDark ? "#e2e8f0" : "#1e293b";
  const secStyle = { marginBottom: 14 };
  return (
    <>
      {!skipProjects && resume.projects?.filter((p) => p.name).length > 0 && (
        <div style={secStyle}>
          <SectionHead title="Projects" style={{ marginBottom: 6 }} />
          {resume.projects.map((p) => (
            <div key={p.id} style={{ marginBottom: 6 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: headCol,
                  margin: "0 0 2px",
                }}
              >
                {p.link ? (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "inherit",
                      textDecoration: "underline",
                      textUnderlineOffset: 2,
                    }}
                  >
                    {p.name}
                  </a>
                ) : (
                  p.name
                )}
                {p.duration ? ` · ${p.duration}` : ""}
                {p.year ? ` · ${p.year}` : ""}
              </p>
              {p.desc && (
                <ProjectBullets
                  text={p.desc}
                  formatting={formatting}
                  style={{
                    fontSize: 9,
                    color: col,
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
      {resume.internships?.length > 0 && (
        <div style={secStyle}>
          <SectionHead title="Internships" style={{ marginBottom: 6 }} />
          {resume.internships.map((intern) => (
            <div key={intern.id} style={{ marginBottom: 6 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: headCol,
                  margin: "0 0 1px",
                }}
              >
                {intern.role ? `${intern.role} at ` : ""}
                {intern.company}
              </p>
              {intern.duration && (
                <p style={{ fontSize: 9, color: col, margin: 0 }}>
                  {intern.duration}
                </p>
              )}
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
              <p
                key={i}
                style={{
                  fontSize: 9,
                  color: col,
                  lineHeight: 1.5,
                  margin: "0 0 3px",
                }}
              >
                {name}
                {issuer ? ` – ${issuer}` : ""}
                {year ? ` (${year})` : ""}
              </p>
            );
          })}
        </div>
      )}
      {resume.languages?.length > 0 && (
        <div style={secStyle}>
          <SectionHead title="Languages" style={{ marginBottom: 6 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {resume.languages.map((l) => (
              <span
                key={l}
                style={{
                  fontSize: 9,
                  color: col,
                  background: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.03)",
                  padding: "2px 8px",
                  borderRadius: 4,
                }}
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      )}
      {resume.hobbies?.length > 0 && (
        <div style={secStyle}>
          <SectionHead title="Hobbies" style={{ marginBottom: 6 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {resume.hobbies.map((h) => (
              <span
                key={h}
                style={{
                  fontSize: 9,
                  color: col,
                  background: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.03)",
                  padding: "2px 8px",
                  borderRadius: 4,
                }}
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      )}
      {resume.extraCurricular?.length > 0 && (
        <div style={secStyle}>
          <SectionHead title="Extra-Curricular" style={{ marginBottom: 6 }} />
          {resume.extraCurricular.map((act) => (
            <div key={act.id || act.title} style={{ marginBottom: 6 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: headCol,
                  margin: "0 0 2px",
                }}
              >
                {act.title}
              </p>
              {act.desc && (
                <p
                  style={{
                    fontSize: 9,
                    color: col,
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {act.desc}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      {resume.customSections?.length > 0 &&
        resume.customSections.map((cs, i) => (
          <div key={i} style={secStyle}>
            <SectionHead title={cs.title} style={{ marginBottom: 6 }} />
            {cs.items?.map((item, j) => (
              <div key={j} style={{ marginBottom: 6 }}>
                {item.title && (
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: headCol,
                      margin: "0 0 2px",
                    }}
                  >
                    {item.title}
                  </p>
                )}
                {item.desc && (
                  <p
                    style={{
                      fontSize: 9,
                      color: col,
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {item.desc}
                  </p>
                )}
                {item.bullets?.length > 0 && (
                  <div style={{ margin: "2px 0 0", paddingLeft: 12 }}>
                    {item.bullets.map((b, k) => (
                      <BulletPoints
                        key={k}
                        text={b}
                        style={{ fontSize: 8.5, color: col, marginBottom: 1 }}
                      />
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
