// ResumeBuilder.jsx
// Modular Component-Based Architecture
// Uses Google Fonts via a style tag injection (works in all setups)

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../../AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getTemplate,
  isProTemplate,
  loadGoogleFont,
} from "./ResumeTemplates";
import authService from "../../../../services/authService";
import paymentService from "../../../../services/paymentService";
import { usePdfExport } from "../../../../utils/usePdfExport";

// Extracted Builder Components & Data
import {
  BUILDER_CSS,
  INITIAL_RESUME,
  generateResumeName,
  mapProfileToResume,
} from "./components/builder/builderData";
import { EditorPanel } from "./components/builder/EditorPanel";
import { TemplatesPanel } from "./components/builder/TemplatesPanel";
import { FormattingPanel } from "./components/builder/FormattingPanel";
import { EnhancePanel } from "./components/builder/EnhancePanel";
import {
  PROUpsellModal,
  AnalysisModal,
  GrammarModal,
} from "./components/builder/BuilderModals";
import {
  BuilderHeader,
  BuilderMobileSidebar,
  BuilderMobileBottomNav,
} from "./components/builder/BuilderNav";
import { ResumePreviewPane } from "./components/builder/ResumePreviewPane";

// Re-export mapProfileToResume for any consumers
export { mapProfileToResume };

export default function ResumeBuilder() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("editor");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobilePreviewActive, setIsMobilePreviewActive] = useState(false);
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [resume, setResume] = useState(() => {
    try {
      const saved = sessionStorage.getItem("rb_resume");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed === "object" &&
          parsed.name &&
          parsed.name !== "John Doe" &&
          parsed.name !== "Pranjal Kundliya"
        ) {
          return parsed;
        }
      }
    } catch {
      /* ignore */
    }
    if (user) {
      return mapProfileToResume(user, user);
    }
    return INITIAL_RESUME;
  });
  const [selectedTemplate, setSelectedTemplate] = useState("classic-blue");
  const [formatting, setFormatting] = useState(() => {
    try {
      const saved = sessionStorage.getItem("rb_formatting");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch {
      /* ignore */
    }
    return {
      spacing: "Medium",
      font: "DM Sans",
      fontSize: "Medium",
      accentColor: "#143f86",
    };
  });
  const [resumeName, setResumeName] = useState(() => {
    return user?.name ? generateResumeName(user.name) : "Resume_Candidate";
  });
  const [editingName, setEditingName] = useState(false);
  const [showATSModal, setShowATSModal] = useState(false);
  const [showRoastModal, setShowRoastModal] = useState(false);
  const [showRecruiterModal, setShowRecruiterModal] = useState(false);
  const [showGrammarModal, setShowGrammarModal] = useState(false);
  const [grammarSource, setGrammarSource] = useState("built");
  const [showPROModal, setShowPROModal] = useState(false);
  const [scale, setScale] = useState(1);
  const [saveStatus, setSaveStatus] = useState("saved");
  const autoSaveTimer = useRef(null);
  const [pageCount, setPageCount] = useState(1);
  const previewContainerRef = useRef(null);
  const nameRef = useRef(null);
  const pdfSourceRef = useRef(null);
  const uploadRef = useRef(null);
  const [uploadedResumePdf, setUploadedResumePdf] = useState(null);

  // Fetch full logged-in user profile data and populate resume
  useEffect(() => {
    let isMounted = true;

    // Immediately apply AuthContext user if available and not yet loaded from server
    if (user && !profileLoaded) {
      const initialFromAuth = mapProfileToResume(user, user);
      setResume((prev) => {
        if (
          !prev ||
          prev.name === "John Doe" ||
          prev.name === "Pranjal Kundliya" ||
          !profileLoaded
        ) {
          return initialFromAuth;
        }
        return prev;
      });
      if (user.name) {
        setResumeName((prev) =>
          prev === "Resume_John" ||
          prev === "Resume_Pranjal" ||
          prev === "Resume_Candidate"
            ? generateResumeName(user.name)
            : prev,
        );
      }
    }

    // Always fetch fresh candidate profile from server API
    const fetchCandidateProfile = async () => {
      setIsSyncingProfile(true);
      try {
        const res = await authService.getCandidateProfile();
        if (!isMounted) return;
        const profileData = res?.data?.profile;
        if (profileData) {
          const mapped = mapProfileToResume(profileData, user);
          setResume(mapped);
          setProfileLoaded(true);
          const candidateName = profileData.user?.name || user?.name;
          if (candidateName) {
            setResumeName((prev) =>
              prev === "Resume_John" ||
              prev === "Resume_Pranjal" ||
              prev === "Resume_Candidate"
                ? generateResumeName(candidateName)
                : prev,
            );
          }
        }
      } catch (err) {
        console.warn("[ResumeBuilder] Profile fetch error:", err);
      } finally {
        if (isMounted) setIsSyncingProfile(false);
      }
    };

    fetchCandidateProfile();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleSyncFromProfile = async () => {
    setIsSyncingProfile(true);
    try {
      const res = await authService.getCandidateProfile();
      const profileData = res?.data?.profile || user;
      const mapped = mapProfileToResume(profileData, user);
      setResume(mapped);
      setProfileLoaded(true);
      const candidateName = profileData?.user?.name || user?.name;
      if (candidateName) {
        setResumeName(generateResumeName(candidateName));
      }
    } catch (err) {
      console.error("[ResumeBuilder] Sync failed:", err);
      if (user) {
        setResume(mapProfileToResume(user, user));
      }
    } finally {
      setIsSyncingProfile(false);
    }
  };

  // Auto-scale to fit window width on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        const newScale = (window.innerWidth - 40) / 595;
        setScale(newScale > 0.1 ? newScale : 0.5);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Measure template content height for pagination
  useEffect(() => {
    if (pdfSourceRef.current) {
      const h = pdfSourceRef.current.scrollHeight;
      const pages = Math.max(1, Math.ceil(h / 842));
      if (pages !== pageCount) setPageCount(pages);
    }
  }, [resume, selectedTemplate, formatting]);

  // Preload and activate selected Google Font dynamically
  useEffect(() => {
    if (formatting?.font) {
      loadGoogleFont(formatting.font);
    }
  }, [formatting?.font]);

  // Auto-save resume to sessionStorage with debounce
  useEffect(() => {
    setSaveStatus("unsaved");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      try {
        sessionStorage.setItem("rb_resume", JSON.stringify(resume));
        sessionStorage.setItem("rb_selectedTemplate", selectedTemplate);
        sessionStorage.setItem("rb_formatting", JSON.stringify(formatting));
        setSaveStatus("saved");
      } catch {
        setSaveStatus("saved");
      }
    }, 800);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [resume, selectedTemplate, formatting]);

  const {
    exportPdf,
    isExporting: pdfExporting,
  } = usePdfExport();
  const isDownloading = pdfExporting;

  const handleDownload = async () => {
    const plan = user?.membership?.plan || "FREE";
    const isProUser = plan === "PRO" || plan === "ELITE";
    if (isProTemplate(selectedTemplate) && !isProUser) {
      setShowPROModal(true);
      return;
    }
    const pages = document.querySelectorAll("#resume-print .rb-print-page");
    if (!pages.length) return;
    try {
      await exportPdf(pages, `${resumeName.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("[PDF Export] Failed:", err);
    }
  };

  const handleModalOpen = (key) => {
    if (key === "ats") setShowATSModal(true);
    else if (key === "roast") setShowRoastModal(true);
    else if (key === "recruiter") setShowRecruiterModal(true);
    else if (key === "grammar") {
      setGrammarSource("built");
      setShowGrammarModal(true);
    }
  };

  const handleProUpgrade = async () => {
    try {
      const orderRes = await paymentService.createOrder("PRO");
      if (!orderRes?.success || !orderRes?.data)
        throw new Error("Failed to create order");
      await paymentService.openCheckout({
        order: orderRes.data,
        keyId: orderRes.data.keyId,
        user,
        onSuccess: async (result) => {
          if (result?.success) {
            updateUser?.({
              ...user,
              membership: { plan: "PRO", active: true },
            });
            setShowPROModal(false);
          }
        },
        onError: (msg) => {
          console.error("[Upgrade] Payment error:", msg);
        },
      });
    } catch (err) {
      console.error("[Upgrade] Failed:", err.message);
    }
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedResumePdf(ev.target?.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const clearUploadedPdf = () => setUploadedResumePdf(null);

  // Inject CSS once
  useEffect(() => {
    const id = "rb-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = BUILDER_CSS;
      document.head.appendChild(style);
    }
    return () => {};
  }, []);

  return (
    <div
      className="rb-root"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#f0f4fb",
        overflow: "hidden",
      }}
    >
      {/* TOP NAVIGATION BAR & MOBILE HEADER */}
      <BuilderHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        editingName={editingName}
        setEditingName={setEditingName}
        resumeName={resumeName}
        setResumeName={setResumeName}
        nameRef={nameRef}
        isSyncingProfile={isSyncingProfile}
        handleSyncFromProfile={handleSyncFromProfile}
        handleDownload={handleDownload}
        isDownloading={isDownloading}
        uploadRef={uploadRef}
        handleUpload={handleUpload}
        uploadedResumePdf={uploadedResumePdf}
        clearUploadedPdf={clearUploadedPdf}
        navigate={navigate}
        isMobilePreviewActive={isMobilePreviewActive}
        setIsMobilePreviewActive={setIsMobilePreviewActive}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
      />

      {/* MOBILE SIDEBAR */}
      <BuilderMobileSidebar
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        editingName={editingName}
        setEditingName={setEditingName}
        resumeName={resumeName}
        setResumeName={setResumeName}
        handleSyncFromProfile={handleSyncFromProfile}
        isSyncingProfile={isSyncingProfile}
        handleDownload={handleDownload}
        isDownloading={isDownloading}
        uploadRef={uploadRef}
      />

      {/* MAIN BODY */}
      <div
        className="rb-main-content"
        style={{ flex: 1, display: "flex", overflow: "hidden" }}
      >
        {/* LEFT PANEL */}
        <div
          className={`rb-no-print rb-editor-pane ${isMobilePreviewActive ? "hidden-on-mobile" : ""}`}
          style={{
            width: 380,
            flexShrink: 0,
            background: "white",
            borderRight: "1px solid #e8eef8",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "1px 0 8px rgba(20,63,134,0.04)",
          }}
        >
          {activeTab === "editor" && (
            <EditorPanel resume={resume} setResume={setResume} />
          )}
          {activeTab === "templates" && (
            <TemplatesPanel
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
            />
          )}
          {activeTab === "formatting" && (
            <FormattingPanel
              formatting={formatting}
              setFormatting={setFormatting}
            />
          )}
          {activeTab === "enhance" && <EnhancePanel onOpen={handleModalOpen} />}
        </div>

        {/* RIGHT — Preview canvas */}
        <ResumePreviewPane
          isMobilePreviewActive={isMobilePreviewActive}
          scale={scale}
          setScale={setScale}
          saveStatus={saveStatus}
          previewContainerRef={previewContainerRef}
          uploadedResumePdf={uploadedResumePdf}
          setGrammarSource={setGrammarSource}
          setShowGrammarModal={setShowGrammarModal}
          clearUploadedPdf={clearUploadedPdf}
          pdfSourceRef={pdfSourceRef}
          pageCount={pageCount}
          resume={resume}
          formatting={formatting}
          selectedTemplate={selectedTemplate}
        />
      </div>

      {/* Analysis Modals */}
      {showATSModal && (
        <AnalysisModal
          resume={resume}
          mode="ats"
          onClose={() => setShowATSModal(false)}
        />
      )}
      {showRoastModal && (
        <AnalysisModal
          resume={resume}
          mode="roast"
          onClose={() => setShowRoastModal(false)}
        />
      )}
      {showRecruiterModal && (
        <AnalysisModal
          resume={resume}
          mode="recruiter"
          onClose={() => setShowRecruiterModal(false)}
        />
      )}
      {showGrammarModal && (
        <GrammarModal
          resume={resume}
          source={grammarSource}
          onClose={() => setShowGrammarModal(false)}
        />
      )}

      {/* PRO Upsell Modal */}
      {showPROModal && (
        <PROUpsellModal
          templateName={getTemplate(selectedTemplate)?.name || "PRO"}
          onClose={() => setShowPROModal(false)}
          onUpgrade={handleProUpgrade}
        />
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <BuilderMobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobilePreviewActive={isMobilePreviewActive}
        setIsMobilePreviewActive={setIsMobilePreviewActive}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
      />
    </div>
  );
}
