import React, { useState } from "react";
import { FiEdit2, FiCheck, FiX, FiCheckCircle } from "react-icons/fi";
import "../../pages/candidates/features/dashboard/Components/ProfileDashboard/BasicDetailsModal.css";
import CustomSelect from "../common/CustomSelect";

import { getNames } from "country-list";

const MOCK_COUNTRIES = getNames();
const MOCK_LANGUAGES = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Kannada",
  "Dutch",
  "Indonesian",
  "Malaysian",
  "Japanese",
  "Russian",
  "Chinese",
  "Korean",
  "Italian",
  "Portuguese",
  "Mao",
  "Nepali",
  "Arabic",
  "French",
  "German",
  "Spanish",
  "Urdu",
  "Konkani",
  "Bodo",
  "Manipuri",
  "Sindhi",
  "Sanskrit",
  "Marathi",
  "Malayalam",
  "Gujarati",
  "Punjabi",
  "Odia",
  "Assamese",
];

const PersonalDetailsSection = React.memo(({ user, onEdit, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // State for form
  const [gender, setGender] = useState(user?.personalDetailsObj?.gender || "");
  const [moreInfo, setMoreInfo] = useState(
    user?.personalDetailsObj?.moreInfo || [],
  );
  const [maritalStatus, setMaritalStatus] = useState(
    user?.personalDetailsObj?.maritalStatus || "",
  );

  const [dobDay, setDobDay] = useState(user?.personalDetailsObj?.dobDay || "");
  const [dobMonth, setDobMonth] = useState(
    user?.personalDetailsObj?.dobMonth || "",
  );
  const [dobYear, setDobYear] = useState(
    user?.personalDetailsObj?.dobYear || "",
  );

  const [category, setCategory] = useState(
    user?.personalDetailsObj?.category || "",
  );
  const [workPermitUsa, setWorkPermitUsa] = useState(
    user?.personalDetailsObj?.workPermitUsa || "",
  );
  const [workPermitOther, setWorkPermitOther] = useState(
    user?.personalDetailsObj?.workPermitOther || [],
  );

  const [address, setAddress] = useState(
    user?.personalDetailsObj?.address || "",
  );
  const [hometown, setHometown] = useState(
    user?.personalDetailsObj?.hometown || "",
  );
  const [pincode, setPincode] = useState(
    user?.personalDetailsObj?.pincode || "",
  );

  const [languages, setLanguages] = useState(() => {
    const initialLangs = user?.languages || [];
    return initialLangs.map(lang => {
      if (typeof lang === 'string') {
        return { name: lang !== '[object Object]' ? lang : '', proficiency: 'Beginner', read: false, write: false, speak: false };
      }
      return lang;
    });
  });

  const toggleMoreInfo = (info) => {
    setMoreInfo((prev) =>
      prev.includes(info) ? prev.filter((i) => i !== info) : [...prev, info],
    );
  };

  const toggleWorkPermitOther = (e) => {
    const val = e.target.value;
    if (!val) return;
    if (workPermitOther.includes(val)) return;
    if (workPermitOther.length >= 3) return;
    setWorkPermitOther((prev) => [...prev, val]);
  };

  const handleSave = async () => {
    setSaving(true);
    const personalDetailsObj = {
      gender,
      moreInfo,
      maritalStatus,
      dobDay,
      dobMonth,
      dobYear,
      category,
      workPermitUsa,
      workPermitOther,
      address,
      hometown,
      pincode,
    };

    // Clean up empty languages
    const validLanguages = languages.filter((l) => l.name);

    const r = await onSave({ personalDetailsObj, languages: validLanguages });
    if (r?.success !== false) setEditing(false);
    setSaving(false);
  };

  const handleCancel = () => {
    setGender(user?.personalDetailsObj?.gender || "");
    setMoreInfo(user?.personalDetailsObj?.moreInfo || []);
    setMaritalStatus(user?.personalDetailsObj?.maritalStatus || "");
    setDobDay(user?.personalDetailsObj?.dobDay || "");
    setDobMonth(user?.personalDetailsObj?.dobMonth || "");
    setDobYear(user?.personalDetailsObj?.dobYear || "");
    setCategory(user?.personalDetailsObj?.category || "");
    setWorkPermitUsa(user?.personalDetailsObj?.workPermitUsa || "");
    setWorkPermitOther(user?.personalDetailsObj?.workPermitOther || []);
    setAddress(user?.personalDetailsObj?.address || "");
    setHometown(user?.personalDetailsObj?.hometown || "");
    setPincode(user?.personalDetailsObj?.pincode || "");
    setLanguages(user?.languages || []);
    setEditing(false);
  };

  const addLanguage = () => {
    setLanguages([
      ...languages,
      { name: "", proficiency: "", read: false, write: false, speak: false },
    ]);
  };

  const updateLanguage = (idx, field, val) => {
    const next = [...languages];
    next[idx] = { ...next[idx], [field]: val };
    setLanguages(next);
  };

  const removeLanguage = (idx) => {
    setLanguages(languages.filter((_, i) => i !== idx));
  };

  const pd = user?.personalDetailsObj || {};
  const hasDetails =
    Object.values(pd).some((v) => (Array.isArray(v) ? v.length > 0 : !!v)) ||
    user?.languages?.length > 0;

  if (!hasDetails && !editing) {
    return (
      <div
        className="ps-card ps-add-card"
        onClick={() => setEditing(true)}
        style={{ cursor: "pointer" }}
      >
        <div className="ps-card-header">
          <h3 className="ps-section-title">Personal details</h3>
        </div>
        <div className="ps-add-placeholder">
          <FiEdit2 size={14} />
          <span>
            Add your personal details like gender, DOB, marital status...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="ps-card">
      <div className="ps-card-header">
        <h3 className="ps-section-title">Personal details</h3>
        {!editing && (
          <button
            className="ps-edit-btn"
            onClick={() => setEditing(true)}
            aria-label="Edit personal details"
          >
            <FiEdit2 size={14} />
          </button>
        )}
      </div>

      {!editing && (
        <div
          className="ps-personal-details-view"
          style={{ padding: "0 0 20px 0" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              rowGap: "24px",
              columnGap: "16px",
              marginBottom: "32px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-3)",
                  marginBottom: "4px",
                }}
              >
                Personal
              </div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-1)",
                  fontWeight: 500,
                }}
              >
                {pd.gender ? pd.gender.toLowerCase() : ""}
                {pd.gender && pd.maritalStatus ? ", " : ""}
                {pd.maritalStatus ? (
                  pd.maritalStatus
                ) : !pd.gender ? (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setEditing(true);
                    }}
                    style={{ color: "var(--blue)", textDecoration: "none" }}
                  >
                    Add marital status, more info
                  </a>
                ) : null}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-3)",
                  marginBottom: "4px",
                }}
              >
                Work permit
              </div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-1)",
                  fontWeight: 500,
                }}
              >
                {pd.workPermitUsa || pd.workPermitOther?.length > 0 ? (
                  [pd.workPermitUsa, ...(pd.workPermitOther || [])]
                    .filter(Boolean)
                    .join(", ")
                ) : (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setEditing(true);
                    }}
                    style={{ color: "var(--blue)", textDecoration: "none" }}
                  >
                    Add Work permit
                  </a>
                )}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-3)",
                  marginBottom: "4px",
                }}
              >
                Date of birth
              </div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-1)",
                  fontWeight: 500,
                }}
              >
                {pd.dobDay && pd.dobMonth && pd.dobYear
                  ? `${pd.dobDay} ${pd.dobMonth} ${pd.dobYear}`
                  : "-"}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-3)",
                  marginBottom: "4px",
                }}
              >
                Address
              </div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-1)",
                  fontWeight: 500,
                }}
              >
                {[pd.address, pd.hometown, pd.pincode]
                  .filter(Boolean)
                  .join(", ") || "-"}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-3)",
                  marginBottom: "4px",
                }}
              >
                Category
              </div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-1)",
                  fontWeight: 500,
                }}
              >
                {pd.category || "-"}
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid var(--slate-3)",
              paddingTop: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.05rem",
                  color: "var(--text-1)",
                  fontWeight: 600,
                }}
              >
                Languages
              </h3>
              <button
                onClick={() => setEditing(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--blue)",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Add languages
              </button>
            </div>

            {user?.languages?.length > 0 ? (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "0.9rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      color: "var(--text-3)",
                      borderBottom: "1px solid var(--slate-2)",
                    }}
                  >
                    <th style={{ padding: "12px 0", fontWeight: 500 }}>
                      Languages
                    </th>
                    <th style={{ padding: "12px 0", fontWeight: 500 }}>
                      Proficiency
                    </th>
                    <th
                      style={{
                        padding: "12px 0",
                        fontWeight: 500,
                        textAlign: "center",
                      }}
                    >
                      Read
                    </th>
                    <th
                      style={{
                        padding: "12px 0",
                        fontWeight: 500,
                        textAlign: "center",
                      }}
                    >
                      Write
                    </th>
                    <th
                      style={{
                        padding: "12px 0",
                        fontWeight: 500,
                        textAlign: "center",
                      }}
                    >
                      Speak
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {user.languages.map((lang, idx) => (
                    <tr
                      key={idx}
                      style={{ borderBottom: "1px solid var(--slate-1)" }}
                    >
                      <td
                        style={{
                          padding: "16px 0",
                          fontWeight: 600,
                          color: "var(--text-2)",
                        }}
                      >
                        {lang.name}
                      </td>
                      <td
                        style={{
                          padding: "16px 0",
                          fontWeight: 600,
                          color: "var(--text-2)",
                        }}
                      >
                        {lang.proficiency}
                      </td>
                      <td style={{ padding: "16px 0", textAlign: "center" }}>
                        {lang.read && (
                          <FiCheckCircle color="var(--text-3)" size={16} />
                        )}
                      </td>
                      <td style={{ padding: "16px 0", textAlign: "center" }}>
                        {lang.write && (
                          <FiCheckCircle color="var(--text-3)" size={16} />
                        )}
                      </td>
                      <td style={{ padding: "16px 0", textAlign: "center" }}>
                        {lang.speak && (
                          <FiCheckCircle color="var(--text-3)" size={16} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        </div>
      )}

      {editing && (
        <div
          className="bdm-overlay"
          onClick={handleCancel}
          style={{ zIndex: 9999 }}
        >
          <div
            className="bdm-container"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "700px" }}
          >
            <div className="bdm-header">
              <div className="bdm-title-row">
                <h2 className="bdm-title">Personal details</h2>
                <button className="bdm-close" onClick={handleCancel}>
                  <FiX size={20} />
                </button>
              </div>
              <p className="bdm-sub-label">
                This information is important for employers to know you better
              </p>
            </div>

            <div className="bdm-body">
              <div className="bdm-form">
                <div className="bdm-field">
                  <label>Gender</label>
                  <div className="bdm-pills">
                    {["Male", "Female", "Transgender"].map((g) => (
                      <button
                        key={g}
                        className={`bdm-pill ${gender === g ? "active" : ""}`}
                        onClick={() => setGender(g)}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bdm-field">
                  <label>More information</label>
                  <p
                    className="bdm-sub-label"
                    style={{ marginTop: "2px", marginBottom: "8px" }}
                  >
                    Companies are focusing on equal opportunities and might be
                    looking for candidates from diverse backgrounds.
                  </p>
                  <div className="bdm-pills">
                    {[
                      "Single parent",
                      "Working mother",
                      "Retired (60+)",
                      "LGBTQ+",
                    ].map((info) => (
                      <button
                        key={info}
                        className={`bdm-pill ${moreInfo.includes(info) ? "active" : ""}`}
                        onClick={() => toggleMoreInfo(info)}
                      >
                        {info} +
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bdm-field">
                  <label>Marital status</label>
                  <div className="bdm-pills">
                    {[
                      "Single/unmarried",
                      "Married",
                      "Widowed",
                      "Divorced",
                      "Separated",
                      "Other",
                    ].map((ms) => (
                      <button
                        key={ms}
                        className={`bdm-pill ${maritalStatus === ms ? "active" : ""}`}
                        onClick={() => setMaritalStatus(ms)}
                      >
                        {ms}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bdm-field">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      marginBottom: "4px",
                    }}
                  >
                    <label style={{ margin: 0 }}>Date of birth</label>
                    {(dobDay || dobMonth || dobYear) && (
                      <button
                        onClick={() => {
                          setDobDay("");
                          setDobMonth("");
                          setDobYear("");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--blue)",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="bdm-row" style={{ gap: "16px" }}>
                    <CustomSelect
                      value={dobDay}
                      onChange={(e) => setDobDay(e.target.value)}
                      placeholder="DD"
                      options={[...Array(31)].map((_, i) => ({
                        label: String(i + 1),
                        value: String(i + 1),
                      }))}
                    />
                    <CustomSelect
                      value={dobMonth}
                      onChange={(e) => setDobMonth(e.target.value)}
                      placeholder="MMM"
                      options={[
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                      ].map((m) => ({ label: m, value: m }))}
                    />
                    <CustomSelect
                      value={dobYear}
                      onChange={(e) => setDobYear(e.target.value)}
                      placeholder="YYYY"
                      options={[...Array(60)].map((_, i) => {
                        const yr = String(new Date().getFullYear() - 16 - i);
                        return { label: yr, value: yr };
                      })}
                    />
                  </div>
                </div>

                <div className="bdm-field">
                  <label>Category</label>
                  <p
                    className="bdm-sub-label"
                    style={{ marginTop: "2px", marginBottom: "8px" }}
                  >
                    Companies welcome people from various categories to bring
                    equality among all citizens
                  </p>
                  <div className="bdm-pills">
                    {[
                      "General",
                      "Scheduled Caste (SC)",
                      "Scheduled Tribe (ST)",
                      "OBC - Creamy",
                      "OBC - Non creamy",
                      "Other",
                    ].map((cat) => (
                      <button
                        key={cat}
                        className={`bdm-pill ${category === cat ? "active" : ""}`}
                        onClick={() => setCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bdm-field">
                  <label>Work permit for USA</label>
                  <div className="bdm-pills">
                    {[
                      "Have US H1 Visa",
                      "Need US H1 Visa",
                      "US TN Permit Holder",
                      "US Green Card Holder",
                      "US Citizen",
                      "Authorized to work in US",
                    ].map((wp) => (
                      <button
                        key={wp}
                        className={`bdm-pill ${workPermitUsa === wp ? "active" : ""}`}
                        onClick={() => setWorkPermitUsa(wp)}
                      >
                        {wp}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bdm-field">
                  <label>Work permit for other countries</label>
                  <CustomSelect
                    value=""
                    onChange={toggleWorkPermitOther}
                    placeholder="Select countries"
                    options={MOCK_COUNTRIES.filter(
                      (c) => !workPermitOther.includes(c),
                    ).map((c) => ({ label: c, value: c }))}
                  />
                  <p className="bdm-sub-label" style={{ marginTop: "6px" }}>
                    You can choose 3 countries at max
                  </p>
                  {workPermitOther.length > 0 && (
                    <div className="bdm-pills" style={{ marginTop: "12px" }}>
                      {workPermitOther.map((c) => (
                        <button
                          key={c}
                          className="bdm-pill active"
                          onClick={() =>
                            setWorkPermitOther(
                              workPermitOther.filter((w) => w !== c),
                            )
                          }
                        >
                          {c} ✕
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bdm-field">
                  <label>Permanent address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your permanent address"
                  />
                </div>

                <div className="bdm-field">
                  <label>Hometown</label>
                  <input
                    type="text"
                    value={hometown}
                    onChange={(e) => setHometown(e.target.value)}
                    placeholder="Enter hometown"
                  />
                </div>

                <div className="bdm-field">
                  <label>Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Enter pincode"
                  />
                </div>

                <div style={{ marginTop: "24px" }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.1rem",
                      color: "var(--text-1)",
                      fontWeight: 600,
                    }}
                  >
                    Language proficiency
                  </h3>
                  <p
                    className="bdm-sub-label"
                    style={{ marginTop: "4px", marginBottom: "24px" }}
                  >
                    Strengthen your resume by letting recruiters know you can
                    communicate in multiple languages
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "32px",
                    }}
                  >
                    {languages.map((lang, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                        }}
                      >
                        <div className="bdm-row">
                          <div className="bdm-field">
                            <label>
                              Language <span>*</span>
                            </label>
                            <CustomSelect
                              value={lang.name}
                              onChange={(e) =>
                                updateLanguage(idx, "name", e.target.value)
                              }
                              placeholder="Select language"
                              options={MOCK_LANGUAGES.map((l) => ({
                                label: l,
                                value: l,
                              }))}
                            />
                          </div>
                          <div className="bdm-field">
                            <label>
                              Proficiency <span>*</span>
                            </label>
                            <CustomSelect
                              value={lang.proficiency}
                              onChange={(e) =>
                                updateLanguage(
                                  idx,
                                  "proficiency",
                                  e.target.value,
                                )
                              }
                              placeholder="Select proficiency"
                              options={[
                                { label: "Expert", value: "Expert" },
                                { label: "Proficient", value: "Proficient" },
                                { label: "Beginner", value: "Beginner" },
                              ]}
                            />
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ display: "flex", gap: "32px" }}>
                            <label
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "0.95rem",
                                color: "var(--text-1)",
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={lang.read}
                                onChange={(e) =>
                                  updateLanguage(idx, "read", e.target.checked)
                                }
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  cursor: "pointer",
                                }}
                              />{" "}
                              Read
                            </label>
                            <label
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "0.95rem",
                                color: "var(--text-1)",
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={lang.write}
                                onChange={(e) =>
                                  updateLanguage(idx, "write", e.target.checked)
                                }
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  cursor: "pointer",
                                }}
                              />{" "}
                              Write
                            </label>
                            <label
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "0.95rem",
                                color: "var(--text-1)",
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={lang.speak}
                                onChange={(e) =>
                                  updateLanguage(idx, "speak", e.target.checked)
                                }
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  cursor: "pointer",
                                }}
                              />{" "}
                              Speak
                            </label>
                          </div>
                          <button
                            onClick={() => removeLanguage(idx)}
                            style={{
                              color: "var(--blue)",
                              fontWeight: 600,
                              background: "none",
                              border: "none",
                              fontSize: "0.9rem",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addLanguage}
                    style={{
                      marginTop: "24px",
                      color: "var(--blue)",
                      fontWeight: 600,
                      background: "none",
                      border: "none",
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Add another language
                  </button>
                </div>
              </div>
            </div>

            <div className="bdm-footer">
              <button className="bdm-btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button
                className="bdm-btn-save"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default PersonalDetailsSection;
