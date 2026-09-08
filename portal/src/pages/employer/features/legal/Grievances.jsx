import React from "react";
import LandingEmployeeHeader from "../../../../components/employer/LandingEmployeeHeader";
import EmployerFooter from "../../../../components/EmployerFooter";

const Grievances = () => {
  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <LandingEmployeeHeader solid />
      <div style={{ flex: 1, padding: "80px 4%", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        <div style={{ background: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          <h1 style={{ fontSize: "28px", color: "#0f172a", marginBottom: "24px" }}>Grievance Redressal for Employers</h1>
          <p style={{ color: "#475569", lineHeight: "1.6" }}>
            MavenJobs is committed to resolving employer queries and grievances in a timely and efficient manner. 
            If you face any issues with our services, billing, or candidate interactions, please reach out to our support team.
          </p>
          <div style={{ marginTop: "24px", color: "#475569", lineHeight: "1.6" }}>
            <p>Email: employersupport@mavenjobs.com</p>
            <p>Phone: +1-800-MAVEN-JOBS</p>
          </div>
        </div>
      </div>
      <EmployerFooter />
    </div>
  );
};

export default Grievances;
