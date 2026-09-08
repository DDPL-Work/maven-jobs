import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { FaApple, FaFacebookF, FaGooglePlay, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import mavenLogo from '../../assets/maven-logo-BdiSsfJk.svg';
import qrImage from '../../assets/QR.png';
import '../pages/candidates/features/landing/NaukriLandingPage.css';

const socialLinks = [
  { label: 'X', icon: FaXTwitter, url: 'https://x.com/Maven_Jobs' },
  { label: 'LinkedIn', icon: FaLinkedinIn, url: 'https://www.linkedin.com/company/mavenjobs-in/' },
  { label: 'Facebook', icon: FaFacebookF, url: 'https://www.facebook.com/mavenjobs.in?rdid=Wpu7WO4FcCWTZ0KV&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1EaA6f6Up3%2F#' },
  { label: 'Instagram', icon: FaInstagram, url: 'https://www.instagram.com/mavenjobs.in/' },
];

export default function LandingFooter() {
  const { user } = useAuth();
  // This footer is rendered inside the candidate portal.
  // Candidates (logged-in or not) should never see "Post a Job".
  const isEmployer = user?.role === 'CLIENT' || user?.role === 'ADMIN';
  return (
    <footer className="lp-footer">
      <div className="lp-footer__inner">
        <div className="lp-footer__brand">
          <img src={mavenLogo} alt="Maven Jobs" className="lp-footer__logo" />
          <p>India's most trusted hiring platform for the next generation of careers.</p>
          <div className="lp-footer__socials">
            {socialLinks.map(({ label, icon: Icon, url }) => (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}><Icon /></a>
            ))}
          </div>
        </div>
        <div className="lp-footer__col">
          <h4>For Job Seekers</h4>
          <Link to="/jobs">Browse jobs</Link>
          <Link to="/companies">Companies</Link>
          <Link to="/blogs" state={{ from: '/' }}>Career advice</Link>
          <Link to="/services">Resume builder</Link>
          <Link to="/salary-insights">Salary insights</Link>
        </div>
        <div className="lp-footer__col">
          <h4>For Employers</h4>
          <Link to="/employer-login">Employer login</Link>
          {isEmployer && <Link to="/post-job">Post a job</Link>}
        </div>
        <div className="lp-footer__col">
          <h4>Company</h4>
          <Link to="/maven-jobs/about">About us</Link>
          <Link to="/blogs" state={{ from: '/' }}>Blog</Link>
          <Link to="/maven-jobs/press">Press</Link>
          <Link to="/maven-jobs/careers">Careers at Maven</Link>
          <Link to="/maven-jobs/contact">Contact</Link>
          <Link to="/sitemap">Site Map</Link>
        </div>
        <div className="lp-footer__app">
          <h4>Get the App</h4>
          <a href="#" className="lp-app-btn"><FaApple /> App Store</a>
          <a href="#" className="lp-app-btn"><FaGooglePlay /> Google Play</a>
          <div className="lp-footer__qr">
            <img src={qrImage} alt="QR" />
            <span>Scan to download</span>
          </div>
        </div>
      </div>
      <div className="lp-footer__bottom">
        <span>&copy; {new Date().getFullYear()} Maven Jobs. All rights reserved.</span>
        <div>
          <Link to="/maven-jobs/privacy">Privacy Policy</Link>
          <Link to="/maven-jobs/terms">Terms of Service</Link>
          <Link to="/maven-jobs/cookies">Cookie Settings</Link>
          <Link to="/maven-jobs/fraud-alert">Fraud Alert</Link>
          <Link to="/maven-jobs/refund-policy">Refund Policy</Link>
          <Link to="/maven-jobs/grievance">Grievance</Link>
        </div>
      </div>
    </footer>
  );
}
