import { useEffect, useState } from "react";
import { 
  LuUser, 
  LuMail, 
  LuPhone, 
  LuShield, 
  LuBuilding2, 
  LuSave,
  LuLoaderCircle
} from "react-icons/lu";
import { fetchProfile } from "../api/nshApi";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchProfile();
        setProfile(data);
      } catch (err) {
        setError("Failed to load your profile information.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading Profile...</div>;
  if (error) return <div style={{ padding: "20px", color: "#ef4444" }}>{error}</div>;

  return (
    <div style={{ padding: "24px 32px", maxWidth: "800px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "700", color: "#1e3a8a", margin: "0 0 8px 0" }}>My Profile</h1>
        <p style={{ color: "#64748b", margin: 0 }}>Manage your national account details and security settings.</p>
      </div>

      <div style={{ display: "grid", gap: "24px" }}>
        {/* Profile Card */}
        <div style={{ backgroundColor: "#fff", padding: "32px", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "32px" }}>
            <div style={{ 
              width: "80px", 
              height: "80px", 
              borderRadius: "50%", 
              backgroundColor: "#eff6ff", 
              color: "#1e40af", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              fontSize: "2rem",
              fontWeight: 700,
              border: "4px solid #fff",
              boxShadow: "0 0 0 1px #e2e8f0"
            }}>
              {profile.fullName.charAt(0)}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#1e293b" }}>{profile.fullName}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1e40af", backgroundColor: "#eff6ff", padding: "2px 10px", borderRadius: "12px" }}>
                  {profile.role.replace(/_/g, " ")}
                </span>
                <span style={{ fontSize: "0.875rem", color: "#64748b" }}>•</span>
                <span style={{ fontSize: "0.875rem", color: "#64748b" }}>{profile.department}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
            <div className="profile-field">
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                <LuMail size={16} /> Email Address
              </label>
              <input 
                type="email" 
                defaultValue={profile.email} 
                disabled 
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#64748b" }} 
              />
            </div>

            <div className="profile-field">
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                <LuPhone size={16} /> Phone Number
              </label>
              <input 
                type="text" 
                defaultValue={profile.phone || "Not set"} 
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }} 
              />
            </div>

            <div className="profile-field">
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                <LuBuilding2 size={16} /> Department
              </label>
              <input 
                type="text" 
                defaultValue={profile.department} 
                disabled 
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }} 
              />
            </div>

            <div className="profile-field">
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                <LuShield size={16} /> Access Scope
              </label>
              <input 
                type="text" 
                defaultValue="National / India Area" 
                disabled 
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }} 
              />
            </div>
          </div>

          <button style={{ 
            marginTop: "40px", 
            padding: "12px 24px", 
            borderRadius: "10px", 
            backgroundColor: "#1e40af", 
            color: "#fff", 
            border: "none", 
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer"
          }}>
            <LuSave size={18} /> Update Profile Settings
          </button>
        </div>
      </div>
    </div>
  );
}
