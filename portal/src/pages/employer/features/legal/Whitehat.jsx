import React from "react";
import LandingEmployeeHeader from "../../../../components/employer/LandingEmployeeHeader";
import EmployerFooter from "../../../../components/EmployerFooter";

const Whitehat = () => {
  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <LandingEmployeeHeader solid />
      <div style={{ flex: 1, padding: "80px 4%", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        <div style={{ background: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          <h1 style={{ fontSize: "28px", color: "#0f172a", marginBottom: "24px" }}>Whitehat & Vulnerability Disclosure</h1>
          <p style={{ color: "#475569", lineHeight: "1.6" }}>
            MavenJobs is committed to ensuring the safety and security of our platform. We welcome and appreciate the efforts of security researchers in identifying potential vulnerabilities.
          </p>
          <div style={{ marginTop: "24px", color: "#475569", lineHeight: "1.6" }}>
            <p>If you have discovered a security issue, please report it to us responsibly.</p>
          </div>
        </div>
      </div>
      <EmployerFooter />
    </div>
  );
};

export default Whitehat;
