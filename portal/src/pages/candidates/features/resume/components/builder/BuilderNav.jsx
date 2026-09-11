import React from "react";
import {
  FiEdit3,
  FiLayout,
  FiSliders,
  FiZap,
  FiDownload,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiMoreVertical,
  FiEye,
  FiLoader,
  FiUpload,
  FiMenu,
} from "react-icons/fi";
import mavenLogo from "../../../../../../../assets/maven-logo-BdiSsfJk.svg";

export const TABS = [
  { id: "editor", label: "AI editor", Icon: FiEdit3 },
  { id: "templates", label: "Templates", Icon: FiLayout },
  { id: "formatting", label: "Formatting", Icon: FiSliders },
  { id: "enhance", label: "Enhance with AI", Icon: FiZap },
];

export function BuilderHeader({
  activeTab,
  setActiveTab,
  editingName,
  setEditingName,
  resumeName,
  setResumeName,
  nameRef,
  isSyncingProfile,
  handleSyncFromProfile,
  handleDownload,
  isDownloading,
  uploadRef,
  handleUpload,
  uploadedResumePdf,
  clearUploadedPdf,
  navigate,
  isMobilePreviewActive,
  setIsMobilePreviewActive,
  setIsMobileSidebarOpen,
}) {
  return (
    <>
      {/* DESKTOP HEADER */}
      <header
        className="rb-no-print rb-desktop-header"
        style={{
          height: 60,
          background: "white",
          borderBottom: "1px solid #e8eef8",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 12,
          flexShrink: 0,
          boxShadow: "0 1px 8px rgba(20,63,134,0.06)",
          zIndex: 30,
        }}
      >
        {/* Logo */}
        <img
          src={mavenLogo}
          alt="Maven Jobs"
          onClick={() => navigate("/profile")}
          style={{
            height: 28,
            width: "auto",
            flexShrink: 0,
            cursor: "pointer",
          }}
        />
        <div
          style={{ width: 1, height: 28, background: "#e8eef8", flexShrink: 0 }}
        />

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={active ? "" : "rb-tab"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "none",
                  background: active ? "#0a244d" : "transparent",
                  color: active ? "white" : "#4c6488",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: active ? "0 2px 8px rgba(10,36,77,0.2)" : "none",
                  transition: "all 0.18s ease",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon
                  style={{
                    fontSize: 13,
                    color: active
                      ? "white"
                      : id === "editor"
                        ? "#8b5cf6"
                        : id === "templates"
                          ? "#16a34a"
                          : id === "formatting"
                            ? "#ea580c"
                            : "#ea580c",
                  }}
                />
                {label}
              </button>
            );
          })}
        </div>

        {/* Resume name */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          {editingName ? (
            <input
              ref={nameRef}
              autoFocus
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#0a244d",
                border: "none",
                borderBottom: "2px solid #143f86",
                background: "transparent",
                padding: "2px 4px",
                textAlign: "center",
                outline: "none",
              }}
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                color: "#0a244d",
                padding: "6px 10px",
                borderRadius: 8,
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#143f86";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#0a244d";
              }}
            >
              {resumeName}
              <FiEdit3 style={{ fontSize: 13, color: "#c8d8ea" }} />
            </button>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={handleSyncFromProfile}
            disabled={isSyncingProfile}
            title="Sync resume with your latest profile data"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              background: "white",
              color: "#143f86",
              border: "1.5px solid #dde6f8",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              cursor: isSyncingProfile ? "not-allowed" : "pointer",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => {
              if (!isSyncingProfile) {
                e.currentTarget.style.borderColor = "#143f86";
                e.currentTarget.style.background = "#f0f5ff";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSyncingProfile) {
                e.currentTarget.style.borderColor = "#dde6f8";
                e.currentTarget.style.background = "white";
              }
            }}
          >
            <FiRefreshCw
              style={{
                fontSize: 13,
                animation: isSyncingProfile
                  ? "rb-spin 0.8s linear infinite"
                  : "none",
              }}
            />
            {isSyncingProfile ? "Syncing..." : "Sync Profile"}
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 18px",
              background: isDownloading ? "#94a3b8" : "white",
              color: isDownloading ? "#fff" : "#143f86",
              border: `2px solid ${isDownloading ? "#94a3b8" : "#143f86"}`,
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              cursor: isDownloading ? "not-allowed" : "pointer",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => {
              if (!isDownloading) {
                e.currentTarget.style.background = "#eef2ff";
              }
            }}
            onMouseLeave={(e) => {
              if (!isDownloading) {
                e.currentTarget.style.background = "white";
              }
            }}
          >
            {isDownloading ? (
              <FiLoader
                style={{
                  fontSize: 13,
                  animation: "rb-spin 0.7s linear infinite",
                }}
              />
            ) : (
              <FiDownload style={{ fontSize: 13 }} />
            )}
            {isDownloading ? "Generating PDF…" : "Download"}
          </button>
          <input
            type="file"
            ref={uploadRef}
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
          {uploadedResumePdf ? (
            <>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "#16a34a",
                  background: "#f0fdf4",
                  borderRadius: 999,
                  border: "1.5px solid #bbf7d0",
                }}
              >
                <FiCheck style={{ fontSize: 13 }} /> PDF loaded
              </span>
              <button
                onClick={clearUploadedPdf}
                title="Remove uploaded PDF"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 12px",
                  background: "white",
                  color: "#dc2626",
                  border: "1.5px solid #fecaca",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fef2f2";
                  e.currentTarget.style.borderColor = "#f87171";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.borderColor = "#fecaca";
                }}
              >
                <FiX style={{ fontSize: 13 }} /> Clear
              </button>
            </>
          ) : (
            <button
              onClick={() => uploadRef.current?.click()}
              title="Upload Custom Resume"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 16px",
                background: "white",
                color: "#475569",
                border: "1.5px solid #dde6f8",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#143f86";
                e.currentTarget.style.color = "#143f86";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#dde6f8";
                e.currentTarget.style.color = "#475569";
              }}
            >
              <FiUpload style={{ fontSize: 13 }} /> Upload
            </button>
          )}
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "white",
              border: "1.5px solid #e8eef8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#8ca2c0",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#143f86";
              e.currentTarget.style.color = "#143f86";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e8eef8";
              e.currentTarget.style.color = "#8ca2c0";
            }}
          >
            <FiMoreVertical style={{ fontSize: 15 }} />
          </button>
        </div>
      </header>

      {/* MOBILE ONLY HEADER */}
      <header
        className="rb-no-print rb-mobile-header"
        style={{
          display: "none", // Hidden by default, shown by CSS media query
          height: 60,
          background: "white",
          borderBottom: "1px solid #e8eef8",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          boxShadow: "0 1px 8px rgba(20,63,134,0.06)",
        }}
      >
        <img
          src={mavenLogo}
          alt="Maven Jobs"
          onClick={() => navigate("/profile")}
          style={{ height: 28, width: "auto", cursor: "pointer" }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => setIsMobilePreviewActive(!isMobilePreviewActive)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              color: "#143f86",
            }}
          >
            {isMobilePreviewActive ? (
              <FiEdit3 size={20} />
            ) : (
              <FiEye size={20} />
            )}
            {isMobilePreviewActive ? "Edit" : "Preview"}
          </button>
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#0a244d",
              display: "flex",
              alignItems: "center",
            }}
          >
            <FiMenu size={24} />
          </button>
        </div>
      </header>
    </>
  );
}

export function BuilderMobileSidebar({
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  editingName,
  setEditingName,
  resumeName,
  setResumeName,
  handleSyncFromProfile,
  isSyncingProfile,
  handleDownload,
  isDownloading,
  uploadRef,
}) {
  return (
    <>
      {/* MOBILE SIDEBAR OVERLAY */}
      <div
        className={`rb-mobile-overlay ${isMobileSidebarOpen ? "open" : ""} rb-no-print`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      {/* MOBILE SIDEBAR */}
      <div
        className={`rb-mobile-sidebar ${isMobileSidebarOpen ? "open" : ""} rb-no-print`}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px",
            borderBottom: "1px solid #e8eef8",
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#0a244d",
              margin: 0,
            }}
          >
            Menu
          </h2>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#0a244d",
            }}
          >
            <FiX size={24} />
          </button>
        </div>
        <div
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Resume Name */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {editingName ? (
              <input
                autoFocus
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0a244d",
                  border: "none",
                  borderBottom: "2px solid #143f86",
                  background: "transparent",
                  padding: "4px 8px",
                  outline: "none",
                }}
              />
            ) : (
              <button
                onClick={() => setEditingName(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "#f0f4fb",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0a244d",
                  padding: "8px 12px",
                  borderRadius: 8,
                  width: "100%",
                }}
              >
                {resumeName}
                <FiEdit3
                  style={{ fontSize: 14, color: "#4c6488", marginLeft: "auto" }}
                />
              </button>
            )}
          </div>

          <button
            onClick={() => {
              handleSyncFromProfile();
              setIsMobileSidebarOpen(false);
            }}
            disabled={isSyncingProfile}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px",
              background: "#f0f4fb",
              border: "1.5px solid #143f86",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              color: "#143f86",
            }}
          >
            <FiRefreshCw
              style={{
                fontSize: 16,
                animation: isSyncingProfile
                  ? "rb-spin 0.8s linear infinite"
                  : "none",
              }}
            />
            {isSyncingProfile ? "Syncing Profile..." : "Sync From Profile"}
          </button>

          <button
            onClick={() => {
              handleDownload();
              setIsMobileSidebarOpen(false);
            }}
            disabled={isDownloading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px",
              background: "#0a244d",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              color: "white",
            }}
          >
            {isDownloading ? (
              <FiLoader className="rb-spin" size={18} />
            ) : (
              <FiDownload size={18} />
            )}
            {isDownloading ? "Generating..." : "Download"}
          </button>

          <button
            onClick={() => {
              if (uploadRef.current) {
                uploadRef.current.click();
              }
              setIsMobileSidebarOpen(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px",
              background: "white",
              border: "1px solid #c8d8ea",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              color: "#4c6488",
            }}
          >
            <FiUpload size={18} /> Upload Custom PDF
          </button>
        </div>
      </div>
    </>
  );
}

export function BuilderMobileBottomNav({
  activeTab,
  setActiveTab,
  isMobilePreviewActive,
  setIsMobilePreviewActive,
  setIsMobileSidebarOpen,
}) {
  return (
    <nav
      className="rb-no-print rb-mobile-bottom-nav"
      style={{
        display: "none", // Hidden by default, shown by CSS media query
        justifyContent: "space-around",
        alignItems: "center",
        padding: "8px 0",
      }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const active = activeTab === id && !isMobilePreviewActive;
        return (
          <button
            key={id}
            onClick={() => {
              setActiveTab(id);
              setIsMobilePreviewActive(false);
              setIsMobileSidebarOpen(false);
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px 8px",
              color: active ? "#0a244d" : "#8ba3c7",
            }}
          >
            <Icon
              style={{
                fontSize: 20,
                color: active
                  ? "#0a244d"
                  : id === "editor"
                    ? "#8b5cf6"
                    : id === "templates"
                      ? "#16a34a"
                      : id === "formatting"
                        ? "#ea580c"
                        : "#ea580c",
              }}
            />
            <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
