import React from "react";
import LandingEmployeeHeader from "../../../../components/employer/LandingEmployeeHeader";
import EmployerFooter from "../../../../components/EmployerFooter";

const sectionStyle = {
  background: "white",
  padding: "40px",
  borderRadius: "12px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
};

const textStyle = {
  color: "#475569",
  lineHeight: "1.7",
};

const EmployerPrivacyPolicy = () => {
  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <LandingEmployeeHeader solid />
      <div style={{ flex: 1, padding: "104px 4% 80px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        <div style={sectionStyle}>
          <h1 style={{ fontSize: "28px", color: "#0f172a", marginBottom: "16px" }}>
            Employer Privacy Policy
          </h1>
          <p style={textStyle}>
            This policy explains how MavenJobs handles employer account, company, billing, hiring, and usage data when
            employers use our recruitment products and services.
          </p>

          <div style={{ marginTop: "28px", ...textStyle }}>
            <h2 style={{ fontSize: "20px", color: "#0f172a" }}>Information we collect</h2>
            <p>
              We collect employer account details, company profile information, recruiter contact details, job posting
              content, billing records, subscription activity, support requests, and product usage data.
            </p>

            <h2 style={{ fontSize: "20px", color: "#0f172a", marginTop: "24px" }}>How we use employer data</h2>
            <p>
              Employer data is used to create and secure accounts, publish and manage jobs, provide candidate discovery
              tools, process payments, deliver support, prevent fraud, improve services, and comply with legal
              obligations.
            </p>

            <h2 style={{ fontSize: "20px", color: "#0f172a", marginTop: "24px" }}>Candidate data and recruiter access</h2>
            <p>
              Employers may access candidate information only through authorised platform features. MavenJobs logs and
              monitors access where needed to protect candidates, enforce usage limits, and investigate misuse.
            </p>

            <h2 style={{ fontSize: "20px", color: "#0f172a", marginTop: "24px" }}>Sharing and processors</h2>
            <p>
              We may share employer data with infrastructure, analytics, communications, payment, verification, and
              support providers who help us operate the platform. We do not sell employer data.
            </p>

            <h2 style={{ fontSize: "20px", color: "#0f172a", marginTop: "24px" }}>Security and retention</h2>
            <p>
              We use access controls, encryption, monitoring, and operational safeguards to protect employer data.
              Records are retained only as long as needed for service delivery, legal compliance, dispute resolution,
              audit, and fraud prevention.
            </p>

            <h2 style={{ fontSize: "20px", color: "#0f172a", marginTop: "24px" }}>Contact</h2>
            <p>
              For employer privacy questions, write to{" "}
              <a href="mailto:privacy@mavenjobs.in">privacy@mavenjobs.in</a>.
            </p>
          </div>
        </div>
      </div>
      <EmployerFooter />
    </div>
  );
};

export default EmployerPrivacyPolicy;
