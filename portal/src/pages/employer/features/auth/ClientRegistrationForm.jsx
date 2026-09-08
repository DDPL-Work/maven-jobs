import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEdit2, FiCheck, FiChevronDown } from "react-icons/fi";
import { FaBuilding, FaMobileAlt, FaEnvelopeOpenText, FaShieldAlt } from "react-icons/fa";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { INDIAN_STATES_AND_UT_ARRAY, STATE_WISE_CITIES } from "indian-states-cities-list";
import mavenLogo from "../../../../../assets/maven-logo-BdiSsfJk.svg";
import "./ClientRegistrationForm.css";

// Step definitions for the top stepper
const STEPS = [
  { key: 1, label: "Mobile", icon: FaMobileAlt },
  { key: 2, label: "Verify", icon: FiCheck },
  { key: 3, label: "Company", icon: FaBuilding },
  { key: 4, label: "Confirm", icon: FaShieldAlt },
];

const CustomDropdown = ({ value, options, onChange, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div
      className={`crf2-custom-dropdown ${disabled ? "disabled" : ""}`}
      ref={dropdownRef}
    >
      <div
        className={`crf2-dropdown-header ${isOpen ? "is-open" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <FiChevronDown
          className={`crf2-dropdown-icon ${isOpen ? "is-open" : ""}`}
        />
      </div>
      {isOpen && !disabled && (
        <ul className="crf2-dropdown-list">
          {options.map((opt) => (
            <li
              key={opt.value}
              className={`crf2-dropdown-item ${
                opt.value === value ? "selected" : ""
              }`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const ClientRegistrationForm = () => {
  const navigate = useNavigate();
  // Steps: 1 (Mobile), 2 (Mobile OTP), 3 (Basic Details), 4 (Company Details & Email OTP)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [phone, setPhone] = useState("");
  const [agreeWhatsApp, setAgreeWhatsApp] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Step 2
  const [mobileOtp, setMobileOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(57);

  // Step 3 (Basic Details)
  const [hiringFor, setHiringFor] = useState("your company");
  const [companyName, setCompanyName] = useState("");
  const [employees, setEmployees] = useState("");
  const [fullName, setFullName] = useState("");
  const [designation, setDesignation] = useState("");
  const [pincode, setPincode] = useState("");
  const [manualAddress, setManualAddress] = useState(false);
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [cityPincodes, setCityPincodes] = useState([]);

  // Step 4 (Company Details & Finalize)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);

  const otpInputRefs = useRef([]);
  const emailOtpRefs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  useEffect(() => {
    if (pincode.length === 6 && !manualAddress) {
      const fetchPincodeDetails = async () => {
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
          const data = await res.json();
          if (data && data[0] && data[0].Status === "Success") {
            const postOffice = data[0].PostOffice[0];
            setState(postOffice.State);
            setCity(postOffice.District || postOffice.Block);
            setCountry("India");
          } else {
            setManualAddress(true);
          }
        } catch (err) {
          setManualAddress(true);
        }
      };
      fetchPincodeDetails();
    }
  }, [pincode, manualAddress]);

  useEffect(() => {
    if (city && manualAddress && country === "India") {
      const fetchCityPincodes = async () => {
        try {
          const res = await fetch(`https://api.postalpincode.in/postoffice/${city}`);
          const data = await res.json();
          if (data && data[0] && data[0].Status === "Success") {
            const uniquePincodes = [...new Set(data[0].PostOffice.map(po => po.Pincode))];
            setCityPincodes(uniquePincodes.sort());
            if (uniquePincodes.length === 1) {
              setPincode(uniquePincodes[0]);
            }
          } else {
            setCityPincodes([]);
          }
        } catch (err) {
          setCityPincodes([]);
        }
      };
      fetchCityPincodes();
    }
  }, [city, manualAddress, country]);

  const handleSendMobileOtp = () => {
    if (!phone || phone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!agreeTerms) {
      setError("You must agree to the Privacy Policy and Terms & Conditions.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      setTimer(57);
    }, 800);
  };

  const handleVerifyMobileOtp = () => {
    const code = mobileOtp.join("");
    if (code.length < 6) {
      setError("Please enter the complete OTP.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 800);
  };

  const handleBasicDetailsNext = () => {
    if (!companyName || !designation || !fullName || !pincode) {
      setError("Please fill all required basic details.");
      return;
    }
    setError("");
    setStep(4);
  };

  const handleSendEmailOtp = () => {
    if (!email) {
      setError("Please enter your company email.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setEmailOtpSent(true);
    }, 800);
  };

  const handleVerifyEmailOtp = () => {
    const eOtp = emailOtp.join("");
    if (eOtp.length < 6) {
      setError("Please enter the email OTP.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setEmailOtpVerified(true);
    }, 800);
  };

  const handleFinalRegister = async () => {
    if (password.length < 7) {
      setError("Please create a password (min 7 chars).");
      return;
    }
    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      console.log("Mock Registration Complete with data:", {
        fullName: fullName.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim(),
        designation: designation.trim(),
        pincode: pincode.trim(),
        country, state, city, address,
        hiringFor, employees
      });
      navigate("/employer-dashboard");
    }, 1000);
  };

  const handleOtpChange = (index, value, isEmail = false) => {
    const newOtp = isEmail ? [...emailOtp] : [...mobileOtp];
    const val = value.replace(/\D/g, "").slice(-1);
    newOtp[index] = val;
    if (isEmail) setEmailOtp(newOtp);
    else setMobileOtp(newOtp);

    if (val && index < 5) {
      const refs = isEmail ? emailOtpRefs : otpInputRefs;
      refs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e, isEmail = false) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      const refs = isEmail ? emailOtpRefs : otpInputRefs;
      refs.current[index - 1].focus();
    }
  };

  // ---- Layout pieces ----

  const renderHeader = () => (
    <header className="crf2-header">
      <Link to="/" className="crf2-header-logo">
        <img src={mavenLogo} alt="MavenJobs" />
      </Link>
      <div className="crf2-header-help">
        Need help? <a href="#">Contact us</a>
      </div>
    </header>
  );

  const renderStepper = () => (
    <div className="crf2-stepper" role="list">
      {STEPS.map((s, idx) => {
        const isDone = step > s.key;
        const isActive = step === s.key;
        const Icon = s.icon;
        return (
          <React.Fragment key={s.key}>
            <div
              className={`crf2-step ${isDone ? "is-done" : ""} ${isActive ? "is-active" : ""}`}
              role="listitem"
            >
              <span className="crf2-step-dot">
                {isDone ? <FiCheck size={14} /> : <Icon size={13} />}
              </span>
              <span className="crf2-step-label">{s.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <span className={`crf2-step-connector ${step > s.key ? "is-filled" : ""}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <div className="crf2-page">
      <div className="crf2-blob crf2-blob-a" aria-hidden="true" />
      <div className="crf2-blob crf2-blob-b" aria-hidden="true" />

      {renderHeader()}

      <main className="crf2-main">
        <div className="crf2-intro">
          <h1>Hire smarter,<br />hire faster</h1>
          <p>Join 50,000+ employers already hiring on MavenJobs</p>
          <div className="crf2-stats">
            <div className="crf2-stat">
              <strong>9L+</strong>
              <span>Candidates</span>
            </div>
            <div className="crf2-stat-divider" />
            <div className="crf2-stat">
              <strong>50K+</strong>
              <span>Employers</span>
            </div>
            <div className="crf2-stat-divider" />
            <div className="crf2-stat">
              <strong>4.6★</strong>
              <span>Avg. rating</span>
            </div>
          </div>
        </div>

        <div className="crf2-card">
          {renderStepper()}

          <div className="crf2-card-body">
            {step === 1 && (
              <div className="crf2-fade">
                <div className="crf2-section-head">
                  <span className="crf2-section-icon crf2-icon-navy"><FaMobileAlt /></span>
                  <div>
                    <h2>Let's get started</h2>
                    <p>Enter your mobile number to continue</p>
                  </div>
                </div>

                <div className="crf2-field">
                  <label>Mobile number</label>
                  <PhoneInput
                    country={"in"}
                    value={phone}
                    onChange={setPhone}
                    placeholder="Enter mobile number"
                    containerClass="crf2-phone-container"
                    inputClass="crf2-phone-input"
                    buttonClass="crf2-phone-button"
                  />
                </div>

                <label className="crf2-check">
                  <input type="checkbox" checked={agreeWhatsApp} onChange={(e) => setAgreeWhatsApp(e.target.checked)} />
                  <span>I agree to receive important updates on WhatsApp</span>
                </label>
                <label className="crf2-check">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
                  <span>I agree to the <a href="#">Privacy Policy</a> and <a href="#">Terms & Conditions</a></span>
                </label>

                {error && <div className="crf2-error">{error}</div>}

                <button
                  className="crf2-btn"
                  onClick={handleSendMobileOtp}
                  disabled={!phone || phone.length < 10 || !agreeTerms || loading}
                >
                  {loading ? "Sending…" : "Send OTP"}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="crf2-fade">
                <div className="crf2-section-head">
                  <span className="crf2-section-icon crf2-icon-teal"><FiCheck /></span>
                  <div>
                    <h2>Verify your number</h2>
                    <p>
                      Code sent to +91 {phone}
                      <button className="crf2-edit-btn" onClick={() => setStep(1)}>
                        <FiEdit2 size={12} /> Edit
                      </button>
                    </p>
                  </div>
                </div>

                <div className="crf2-otp-row">
                  {mobileOtp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="tel"
                      maxLength="1"
                      className="crf2-otp-box"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    />
                  ))}
                </div>

                <div className="crf2-resend">
                  Didn't receive it?{" "}
                  {timer > 0 ? (
                    <span>Resend in <b>00:{timer < 10 ? `0${timer}` : timer}</b></span>
                  ) : (
                    <button onClick={() => setTimer(57)}>Resend OTP</button>
                  )}
                </div>

                {error && <div className="crf2-error">{error}</div>}

                <button
                  className="crf2-btn"
                  onClick={handleVerifyMobileOtp}
                  disabled={mobileOtp.join("").length < 6 || loading}
                >
                  {loading ? "Verifying…" : "Verify OTP"}
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="crf2-fade">
                <div className="crf2-section-head">
                  <span className="crf2-section-icon crf2-icon-lime"><FaBuilding /></span>
                  <div>
                    <h2>Tell us about your company</h2>
                    <p>This helps us tailor your hiring experience</p>
                  </div>
                </div>

                {error && <div className="crf2-error">{error}</div>}

                <div className="crf2-field">
                  <label>Hiring for</label>
                  <div className="crf2-pill-toggle">
                    <button
                      type="button"
                      className={hiringFor === "your company" ? "is-active" : ""}
                      onClick={() => setHiringFor("your company")}
                    >
                      Your company
                    </button>
                    <button
                      type="button"
                      className={hiringFor === "a consultancy" ? "is-active" : ""}
                      onClick={() => setHiringFor("a consultancy")}
                    >
                      A consultancy
                    </button>
                  </div>
                </div>

                <div className="crf2-field">
                  <label>Company name</label>
                  <input type="text" className="crf2-input" placeholder="Enter company name" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </div>

                <div className="crf2-field">
                  <label>Number of employees</label>
                  <CustomDropdown
                    placeholder="Select range"
                    value={employees}
                    onChange={(val) => setEmployees(val)}
                    options={[
                      { value: "1-10", label: "1-10" },
                      { value: "11-50", label: "11-50" },
                      { value: "51-200", label: "51-200" },
                      { value: "201-500", label: "201-500" },
                      { value: "500+", label: "500+" },
                    ]}
                  />
                </div>

                <div className="crf2-grid-2">
                  <div className="crf2-field">
                    <label>Your full name</label>
                    <input type="text" className="crf2-input" placeholder="Enter full name" value={fullName} onChange={e => setFullName(e.target.value)} />
                  </div>
                  <div className="crf2-field">
                    <label>Your designation</label>
                    <input type="text" className="crf2-input" placeholder="Enter designation" value={designation} onChange={e => setDesignation(e.target.value)} />
                  </div>
                </div>

                <div className="crf2-field">
                  <label>Pin code</label>
                  <input type="text" className="crf2-input" placeholder="Enter pin code" value={pincode} onChange={e => setPincode(e.target.value)} maxLength={6} />
                  {!manualAddress && (
                    <button type="button" className="crf2-link-btn" onClick={() => setManualAddress(true)}>
                      Incorrect pincode? Choose manually
                    </button>
                  )}
                </div>

                {manualAddress && (
                  <div className="crf2-grid-2">
                    <div className="crf2-field">
                      <label>Country</label>
                      <CustomDropdown
                        placeholder="Select country"
                        value={country}
                        onChange={(val) => {
                          setCountry(val);
                          setState("");
                          setCity("");
                          setPincode("");
                          setCityPincodes([]);
                        }}
                        options={[
                          { value: "India", label: "India" },
                          { value: "United States", label: "United States" },
                          { value: "United Kingdom", label: "United Kingdom" },
                          { value: "Canada", label: "Canada" },
                          { value: "Australia", label: "Australia" },
                          { value: "Other", label: "Other" },
                        ]}
                      />
                    </div>
                    <div className="crf2-field">
                      <label>State</label>
                      {country === "India" ? (
                        <CustomDropdown
                          placeholder="Select state"
                          value={state}
                          onChange={(val) => {
                            setState(val);
                            setCity("");
                            setPincode("");
                            setCityPincodes([]);
                          }}
                          options={INDIAN_STATES_AND_UT_ARRAY.map((s) => ({
                            value: s,
                            label: s,
                          }))}
                        />
                      ) : (
                        <input type="text" className="crf2-input" placeholder="Enter state" value={state} onChange={e => setState(e.target.value)} />
                      )}
                    </div>
                    <div className="crf2-field">
                      <label>City</label>
                      {country === "India" ? (
                        <CustomDropdown
                          placeholder="Select city"
                          value={city}
                          onChange={(val) => {
                            setCity(val);
                            setPincode("");
                          }}
                          disabled={!state}
                          options={
                            state && STATE_WISE_CITIES[state.replace(/\s+/g, "")]
                              ? STATE_WISE_CITIES[state.replace(/\s+/g, "")].map(
                                  (c) => ({ value: c.value, label: c.label })
                                )
                              : []
                          }
                        />
                      ) : (
                        <input type="text" className="crf2-input" placeholder="Enter city" value={city} onChange={e => setCity(e.target.value)} />
                      )}
                    </div>
                    <div className="crf2-field">
                      <label>Pincode</label>
                      {country === "India" ? (
                        cityPincodes.length > 0 ? (
                          <CustomDropdown
                            placeholder="Select pincode"
                            value={pincode}
                            onChange={(val) => setPincode(val)}
                            options={cityPincodes.map((p) => ({
                              value: p,
                              label: p,
                            }))}
                          />
                        ) : (
                          <input type="text" className="crf2-input" placeholder="Enter pincode" value={pincode} onChange={e => setPincode(e.target.value)} maxLength={6} />
                        )
                      ) : (
                        <input type="text" className="crf2-input" placeholder="Enter zip/pincode" value={pincode} onChange={e => setPincode(e.target.value)} />
                      )}
                    </div>
                  </div>
                )}

                <div className="crf2-field">
                  <label>Company address</label>
                  <input type="text" className="crf2-input" placeholder="Enter complete address" value={address} onChange={e => setAddress(e.target.value)} />
                </div>

                <button className="crf2-btn" onClick={handleBasicDetailsNext}>
                  Continue
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="crf2-fade">
                <div className="crf2-section-head">
                  <span className="crf2-section-icon crf2-icon-navy"><FaEnvelopeOpenText /></span>
                  <div>
                    <h2>Secure your account</h2>
                    <p>Verify your work email to finish up</p>
                  </div>
                </div>

                {error && <div className="crf2-error">{error}</div>}

                {!emailOtpSent ? (
                  <>
                    <div className="crf2-field">
                      <label>Company email</label>
                      <input type="email" className="crf2-input" placeholder="Enter official email address" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <button className="crf2-btn" onClick={handleSendEmailOtp} disabled={loading || !email}>
                      {loading ? "Sending OTP…" : "Verify email"}
                    </button>
                  </>
                ) : !emailOtpVerified ? (
                  <>
                    <div className="crf2-field">
                      <label>Enter OTP sent to {email}</label>
                      <div className="crf2-otp-row">
                        {emailOtp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => (emailOtpRefs.current[index] = el)}
                            type="tel"
                            maxLength="1"
                            className="crf2-otp-box"
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value, true)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e, true)}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      className="crf2-btn"
                      onClick={handleVerifyEmailOtp}
                      disabled={loading || emailOtp.join("").length < 6}
                    >
                      {loading ? "Verifying…" : "Verify OTP"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="crf2-field">
                      <label>Create password</label>
                      <input type="password" className="crf2-input" placeholder="Minimum 7 characters" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>

                    <button
                      className="crf2-btn"
                      onClick={handleFinalRegister}
                      disabled={loading || password.length < 7}
                    >
                      {loading ? "Registering…" : "Register company"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="crf2-footer">
        <div className="crf2-footer-links">
          <a href="#">Contact us</a>
          <span>·</span>
          <a href="#">Report a problem</a>
        </div>
        <div>All rights reserved © 2026 MavenJobs Pvt Ltd.</div>
      </footer>
    </div>
  );
};

export default ClientRegistrationForm;