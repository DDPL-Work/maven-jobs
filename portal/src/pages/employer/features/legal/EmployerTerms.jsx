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

const EmployerTerms = () => {
  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <LandingEmployeeHeader solid />
      <div style={{ flex: 1, padding: "104px 4% 80px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        <div style={sectionStyle}>
          <h1 style={{ fontSize: "28px", color: "#0f172a", marginBottom: "16px" }}>
            Employer Terms & Conditions
          </h1>
          <p style={textStyle}>
            These terms govern how companies, recruiters, consultants, and hiring teams use MavenJobs employer
            services, including job postings, resume database access, branding products, subscriptions, credits,
            and dashboard tools.
          </p>

          <div style={{ marginTop: "28px", ...textStyle }}>
            <h2 style={{ fontSize: "20px", color: "#0f172a" }}>Account responsibility</h2>
            <p>
              Employers must provide accurate company, billing, and contact information. You are responsible for all
              activity performed through your employer account and must keep login credentials confidential.
            </p>

            <h2 style={{ fontSize: "20px", color: "#0f172a", marginTop: "24px" }}>Job postings and hiring activity</h2>
            <p>
              All job posts must describe genuine hiring requirements with accurate titles, compensation, locations,
              eligibility criteria, and employment terms. Misleading roles, duplicate spam posts, discriminatory
              listings, or roles requiring unlawful payments from candidates are prohibited.
            </p>

            <h2 style={{ fontSize: "20px", color: "#0f172a", marginTop: "24px" }}>Candidate data usage</h2>
            <p>
              Candidate resumes, profiles, applications, and contact information may be used only for recruitment and
              hiring purposes. Employers must not sell, publish, scrape, or reuse candidate data for marketing,
              unrelated outreach, or any purpose outside the candidate's hiring context.
            </p>

            <h2 style={{ fontSize: "20px", color: "#0f172a", marginTop: "24px" }}>Payments, credits, and services</h2>
            <p>
              Paid services, subscriptions, credits, and promotional plans are governed by the plan details shown at
              purchase. MavenJobs may pause or revoke employer access if payment fails, credits are misused, or the
              account violates these terms.
            </p>

            <h2 style={{ fontSize: "20px", color: "#0f172a", marginTop: "24px" }}>Suspension and enforcement</h2>
            <p>
              MavenJobs may remove content, restrict features, suspend accounts, or terminate services when an employer
              violates platform rules, applicable law, candidate safety standards, or our trust and safety policies.
            </p>
          </div>
        </div>
      </div>
      <EmployerFooter />
    </div>
  );
};

export default EmployerTerms;
