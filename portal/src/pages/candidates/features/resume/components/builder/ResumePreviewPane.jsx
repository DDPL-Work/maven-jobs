import React from "react";
import { getTemplate } from "../templates/templateRegistry";

/* 
   TEMPLATE PREVIEW — delegates to selected template*/
export function TemplatePreview({ resume, formatting, selectedTemplate }) {
  const tpl = getTemplate(selectedTemplate);
  const Comp = tpl?.component;
  if (!Comp) return null;
  return <Comp resume={resume} formatting={formatting} />;
}

export function ResumePreviewPane({
  isMobilePreviewActive,
  scale,
  setScale,
  saveStatus,
  previewContainerRef,
  uploadedResumePdf,
  setGrammarSource,
  setShowGrammarModal,
  clearUploadedPdf,
  pdfSourceRef,
  pageCount,
  resume,
  formatting,
  selectedTemplate,
}) {
  return (
    <div
      className={`rb-preview-pane ${!isMobilePreviewActive ? "hidden-on-mobile" : ""}`}
      style={{
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "#e8edf5",
      }}
    >
      {/* Preview toolbar */}
      <div
        className="rb-no-print"
        style={{
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          borderBottom: "1px solid #dde6f8",
          background: "#e8edf5",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() =>
              setScale((s) => Math.max(0.3, Math.round((s - 0.1) * 100) / 100))
            }
            title="Zoom out"
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #dde6f8",
              borderRadius: 6,
              background: "white",
              cursor: "pointer",
              color: "#143f86",
              fontSize: 16,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            −
          </button>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#0a244d",
              minWidth: 36,
              textAlign: "center",
            }}
          >
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() =>
              setScale((s) => Math.min(1.5, Math.round((s + 0.1) * 100) / 100))
            }
            title="Zoom in"
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #dde6f8",
              borderRadius: 6,
              background: "white",
              cursor: "pointer",
              color: "#143f86",
              fontSize: 16,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            +
          </button>
          <div style={{ width: 1, height: 20, background: "#dde6f8" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#8ca2c0" }}>
            A4 · PDF
          </span>
          <div
            style={{
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: "#c8d8ea",
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color:
                saveStatus === "saved"
                  ? "#16a34a"
                  : saveStatus === "saving"
                    ? "#ea580c"
                    : "#8ca2c0",
              transition: "color 0.3s",
            }}
          >
            {saveStatus === "saved"
              ? "✓ Auto-saved"
              : saveStatus === "saving"
                ? "Saving..."
                : "Unsaved"}
          </span>
        </div>
      </div>

      {/* Scrollable area — auto-scaled A4 preview */}
      <div
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setScale((s) => Math.min(1.5, Math.max(0.3, s - e.deltaY * 0.002)));
          }
        }}
        ref={previewContainerRef}
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "20px",
        }}
      >
        {uploadedResumePdf ? (
          <div
            style={{
              width: "100%",
              maxWidth: 800,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background: "white",
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "0 4px 40px rgba(20,63,134,0.14)",
            }}
          >
            <div
              className="rb-no-print"
              style={{
                padding: "8px 12px",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: "#4c6488" }}>
                Uploaded Resume
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => {
                    setGrammarSource("uploaded");
                    setShowGrammarModal(true);
                  }}
                  style={{
                    padding: "5px 10px",
                    background: "#eef2ff",
                    color: "#143f86",
                    border: "1px solid #dde6f8",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  Fix Grammar
                </button>
                <button
                  onClick={clearUploadedPdf}
                  style={{
                    padding: "5px 10px",
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
            <iframe
              src={uploadedResumePdf}
              style={{
                flex: 1,
                width: "100%",
                height: "100%",
                border: "none",
              }}
              title="Uploaded Resume"
            />
          </div>
        ) : (
          <div
            className="rb-scale-wrapper"
            style={{
              transformOrigin: "top center",
              transform: `scale(${scale})`,
              position: "relative",
            }}
          >
            {/* Hidden PDF source - inside transform for consistent rendering context */}
            <div
              ref={pdfSourceRef}
              className="rb-pdf-source rb-no-print"
              style={{
                position: "absolute",
                visibility: "hidden",
                width: 595,
                left: "-9999px",
              }}
            >
              <TemplatePreview
                resume={resume}
                formatting={formatting}
                selectedTemplate={selectedTemplate}
              />
            </div>
            {Array.from({ length: pageCount }).map((_, i) => (
              <div
                key={i}
                style={{ marginBottom: i < pageCount - 1 ? 24 : 0 }}
              >
                <div
                  className="rb-page-wrapper"
                  style={{
                    width: 595,
                    height: 842,
                    overflow: "hidden",
                    background: "white",
                    boxShadow: "0 4px 40px rgba(20,63,134,0.14)",
                    borderRadius: 2,
                    position: "relative",
                  }}
                >
                  <div style={{ marginTop: -i * 842 }}>
                    <TemplatePreview
                      resume={resume}
                      formatting={formatting}
                      selectedTemplate={selectedTemplate}
                    />
                  </div>
                </div>
                <div
                  className="rb-no-print"
                  style={{ textAlign: "center", marginTop: 6 }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "#8ca2c0",
                      fontWeight: 600,
                    }}
                  >
                    Page {i + 1} of {pageCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hidden print container — 1:1 scale, no transforms, used by html2canvas */}
        <div
          id="resume-print"
          style={{
            position: "absolute",
            left: "-9999px",
            top: 0,
            zIndex: -1,
            width: 595,
            background: "white",
          }}
        >
          {Array.from({ length: pageCount }).map((_, i) => (
            <div
              key={i}
              className="rb-print-page"
              style={{
                width: 595,
                height: 842,
                overflow: "hidden",
                background: "white",
              }}
            >
              <div style={{ marginTop: -i * 842 }}>
                <TemplatePreview
                  resume={resume}
                  formatting={formatting}
                  selectedTemplate={selectedTemplate}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
