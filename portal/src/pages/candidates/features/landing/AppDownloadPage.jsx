import React, { useEffect } from "react";
import CandidateHeader from "../../../../components/common/CandidateHeader";
import LandingFooter from "../../../../components/LandingFooter";
import { FiDownload, FiBell, FiZap, FiMessageSquare, FiSmartphone } from "react-icons/fi";
import { FaGooglePlay, FaApple } from "react-icons/fa";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.mavenjobs";
const APP_STORE_URL = "https://apps.apple.com/app/maven-jobs/id6440000000";
const QR_IMAGE_URL = "https://res.cloudinary.com/dntt0iavv/image/upload/v1790405098/email-assets/maven-app-download-qr.png";

export default function AppDownloadPage() {
  useEffect(() => {
    document.title = "Download Maven Jobs App - Android & iOS";
    const ua = navigator.userAgent || navigator.vendor || window.opera || "";

    // If accessed on mobile, auto-redirect to respective store
    if (/android/i.test(ua)) {
      window.location.href = PLAY_STORE_URL;
    } else if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
      window.location.href = APP_STORE_URL;
    }
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column" }}>
      <CandidateHeader />

      <main style={{ flex: 1, padding: "48px 16px", maxWidth: "1100px", margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "9999px", backgroundColor: "#dbeafe", color: "#1d4ed8", fontSize: "0.85rem", fontWeight: "600", marginBottom: "16px" }}>
            <FiSmartphone /> Available for Android &amp; iOS
          </div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "800", color: "#0f172a", marginBottom: "12px", letterSpacing: "-0.02em" }}>
            Get the Maven Jobs App
          </h1>
          <p style={{ fontSize: "1.1rem", color: "#64748b", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
            India&apos;s premier career platform in your pocket. Track applications, chat with top recruiters, and apply to 10,000+ verified jobs anywhere, anytime.
          </p>
        </div>

        {/* Hero Card */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)", border: "1px solid #e2e8f0", padding: "40px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "36px", alignItems: "center", marginBottom: "48px" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", marginBottom: "16px" }}>
              Direct Download Links
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "28px" }}>
              Click below or scan the QR code to install the official Maven Jobs mobile app directly to your device.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "260px" }}>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                id="btn-download-google-play"
                style={{ display: "flex", alignItems: "center", gap: "14px", backgroundColor: "#0f172a", color: "#ffffff", padding: "12px 20px", borderRadius: "12px", textDecoration: "none", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)", transition: "transform 0.2s" }}
              >
                <FaGooglePlay size={26} color="#34D399" />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.8 }}>Get it on</div>
                  <div style={{ fontSize: "1rem", fontWeight: "700" }}>Google Play</div>
                </div>
              </a>

              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                id="btn-download-app-store"
                style={{ display: "flex", alignItems: "center", gap: "14px", backgroundColor: "#0f172a", color: "#ffffff", padding: "12px 20px", borderRadius: "12px", textDecoration: "none", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)", transition: "transform 0.2s" }}
              >
                <FaApple size={30} />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.8 }}>Download on the</div>
                  <div style={{ fontSize: "1rem", fontWeight: "700" }}>App Store</div>
                </div>
              </a>
            </div>
          </div>

          {/* QR Code Container */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "16px", padding: "28px", border: "1px dashed #cbd5e1" }}>
            <div style={{ backgroundColor: "#ffffff", padding: "12px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", marginBottom: "14px" }}>
              <img
                src={QR_IMAGE_URL}
                alt="Scan to Download Maven Jobs App"
                width={180}
                height={180}
                style={{ display: "block", borderRadius: "8px" }}
              />
            </div>
            <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "1rem", marginBottom: "4px" }}>
              Scan to Download
            </div>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0, maxWidth: "240px" }}>
              Point your phone camera or Google Lens at this code to install.
            </p>
          </div>
        </div>

        {/* Feature Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
          <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "#dbeafe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", marginBottom: "14px" }}>
              <FiBell />
            </div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>Instant Job Alerts</h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: "1.5", margin: 0 }}>Be the first to apply with instant push notifications when matching jobs are posted.</p>
          </div>

          <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", marginBottom: "14px" }}>
              <FiZap />
            </div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>1-Click Easy Apply</h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: "1.5", margin: 0 }}>Apply to hundreds of verified vacancies in seconds with your saved profile.</p>
          </div>

          <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", marginBottom: "14px" }}>
              <FiMessageSquare />
            </div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>Recruiter Chat &amp; NVites</h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: "1.5", margin: 0 }}>Connect directly with hiring managers and receive exclusive interview invitations.</p>
          </div>

          <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "#f3e8ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", marginBottom: "14px" }}>
              <FiDownload />
            </div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>Offline Resume Access</h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: "1.5", margin: 0 }}>View and share your generated professional CV even with spotty connectivity.</p>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
