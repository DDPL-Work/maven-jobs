import { FiGlobe, FiLock, FiSettings, FiBarChart2, FiMonitor, FiCheckCircle, FiInfo } from "react-icons/fi";
import CandidateHeader from "../../../components/common/CandidateHeader";
import LandingFooter from "../../../components/LandingFooter";
import "./CookiePolicy.css";

const COOKIE_ROWS = [
  {
    icon: FiLock,
    name: "Essential cookies",
    desc: "Authentication, session management, and security protections. The platform cannot function without these.",
    alwaysOn: true,
  },
  {
    icon: FiSettings,
    name: "Preference cookies",
    desc: "Remember language, saved filters, job-search criteria, and UI preferences.",
    alwaysOn: false,
  },
  {
    icon: FiBarChart2,
    name: "Analytics cookies",
    desc: "Help us understand how candidates and employers use the platform to improve features and recommendations.",
    alwaysOn: false,
  },
  {
    icon: FiGlobe,
    name: "Third-party cookies",
    desc: "Set by trusted partners such as analytics providers and, where used, advertising networks.",
    alwaysOn: false,
  },
];

const BROWSERS = [
  { name: "Google Chrome", path: "Settings → Privacy and security → Cookies and other site data" },
  { name: "Mozilla Firefox", path: "Settings → Privacy & Security → Cookies and Site Data" },
  { name: "Apple Safari", path: "Preferences → Privacy → Manage Website Data" },
  { name: "Microsoft Edge", path: "Settings → Cookies and site permissions → Manage and delete cookies" },
];

export default function CookiePolicy() {
  return (
    <main className="ck-page">
      <CandidateHeader />

      <section className="ck-console">
        <div className="ck-console-top">
          <div>
            <span className="ck-kicker"><FiInfo /> COOKIE CONTROL CENTER</span>
            <h1>Cookies &amp; Tracking</h1>
            <p>
              The control panel below explains exactly what cookies Maven Jobs stores on your device and why. You are
              in control — review each category and manage cookies from your browser.
            </p>
          </div>
          <div className="ck-cookie-visual" aria-hidden="true">
            <div className="ck-cookie-bite" />
            <span className="ck-cookie-chip c1" />
            <span className="ck-cookie-chip c2" />
            <span className="ck-cookie-chip c3" />
          </div>
        </div>

        <div className="ck-panel">
          <div className="ck-panel-title">
            <span>Category</span>
            <span>Status</span>
          </div>
          {COOKIE_ROWS.map((row) => (
            <div className="ck-row" key={row.name}>
              <div className="ck-row-icon"><row.icon size={17} /></div>
              <div className="ck-row-info">
                <strong>{row.name}</strong>
                <p>{row.desc}</p>
              </div>
              <div className="ck-row-state">
                <span className={`ck-switch ${row.alwaysOn ? "on" : ""}`}>
                  <span className="ck-knob" />
                </span>
                {row.alwaysOn ? <em>Always on</em> : <em>Optional</em>}
              </div>
            </div>
          ))}
          <div className="ck-panel-foot">
            <FiLock size={14} />
            Managing cookies applies browser-wide — changes take effect on your next visit.
          </div>
        </div>
      </section>

      <div className="ck-body">
        <section className="ck-section">
          <h2>What are cookies?</h2>
          <p>
            Cookies are small text files stored on your device when you visit a website. They help the website
            remember your preferences, understand how you use the site, and keep you securely logged in. We also use
            similar technologies such as local storage and web beacons.
          </p>
        </section>

        <section className="ck-section">
          <h2>Manage cookies in your browser</h2>
          <div className="ck-browser-grid">
            {BROWSERS.map((b) => (
              <div className="ck-browser" key={b.name}>
                <FiMonitor size={18} />
                <div>
                  <strong>{b.name}</strong>
                  <span>{b.path}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="ck-warn">
            Disabling essential cookies may prevent you from logging in or using core features such as applying to
            jobs or managing your profile.
          </div>
        </section>

        <section className="ck-section">
          <h2>Consent &amp; updates</h2>
          <p>
            Where required by law, we obtain your consent before setting non-essential cookies. Continuing to use the
            platform after seeing our cookie notice indicates acceptance of this policy. We may update this policy
            periodically — the latest version always appears on this page.
          </p>
          <p className="ck-contact">
            <FiCheckCircle size={15} /> Questions? Write to{" "}
            <a href="mailto:privacy@mavenjobs.in">privacy@mavenjobs.in</a>
          </p>
        </section>
      </div>

      <LandingFooter />
    </main>
  );
}