import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiChevronDown, FiGrid, FiBell, FiBriefcase, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../AuthContext';
import mavenLogo from '../../assets/maven-logo-BdiSsfJk.svg';
import './Navbar.css';
import AvatarDropdown from "./common/AvatarDropdown";

export default function Navbar() {
  const { user, openLogin, openRegister } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeNavDropdown, setActiveNavDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleNavClick = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <nav className={`shared-nav ${isScrolled ? 'scrolled' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className="shared-nav-container">
        {/* Logo */}
        <Link to="/employer-login" className="shared-nav-logo">
          <img src={mavenLogo} alt="Naukri" className="shared-nav-logo-image" />
        </Link>

        {/* Hamburger Toggle */}
        <button
          className="shared-nav-hamburger"
          onClick={() => setMobileMenuOpen(p => !p)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        {/* Links */}
        <div className={`shared-nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <div 
            className="shared-nav-link-item"
            onMouseEnter={() => setActiveNavDropdown('Jobs')}
            onMouseLeave={() => setActiveNavDropdown(null)}
          >
            <Link to="/jobs" onClick={() => setMobileMenuOpen(false)}>Jobs <span className="nav-badge">1</span></Link>
            {activeNavDropdown === 'Jobs' && (
              <div className="shared-mega-menu">
                <div className="shared-mega-column">
                  <h4>Popular categories</h4>
                  <Link to="/jobs" onClick={() => setMobileMenuOpen(false)}>IT jobs</Link>
                  <Link to="/jobs" onClick={() => setMobileMenuOpen(false)}>Sales jobs</Link>
                  <Link to="/jobs" onClick={() => setMobileMenuOpen(false)}>Marketing jobs</Link>
                </div>
                <div className="shared-mega-column">
                  <h4>Jobs in demand</h4>
                  <Link to="/jobs" onClick={() => setMobileMenuOpen(false)}>Fresher jobs</Link>
                  <Link to="/jobs" onClick={() => setMobileMenuOpen(false)}>Remote jobs</Link>
                </div>
              </div>
            )}
          </div>

          <div 
            className="shared-nav-link-item"
            onMouseEnter={() => setActiveNavDropdown('Companies')}
            onMouseLeave={() => setActiveNavDropdown(null)}
          >
            <Link to="/companies" onClick={() => setMobileMenuOpen(false)}>Companies</Link>
          </div>

          {/* Mobile-only actions */}
          <div className="shared-nav-mobile-actions">
            <div className="shared-nav-search mobile">
              <input type="text" placeholder="Search jobs here" />
              <button className="shared-nav-search-btn">
                <FiSearch size={16} />
              </button>
            </div>
            {!user && (
              <div className="shared-nav-auth-buttons mobile">
                <button className="btn-login" onClick={openLogin}>Login</button>
                <button className="btn-register" onClick={openRegister}>Register</button>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions (Desktop) */}
        <div className="shared-nav-actions">
          
          {/* Search Bar */}
          <div className="shared-nav-search desktop-only">
            <input type="text" placeholder="Search jobs here" />
            <button className="shared-nav-search-btn">
              <FiSearch size={16} />
            </button>
          </div>

          {/* Naukri 360 */}
          <button className="shared-nav-360-btn">
            naukri <span style={{ color: '#10b981' }}>360</span>
          </button>

          {/* Notifications */}
          <div className="shared-nav-bell">
            <FiBell size={22} color="#6b7280" />
            <span className="nav-badge">1</span>
          </div>

          {/* Profile Dropdown */}
          {user ? (
            <AvatarDropdown />
          ) : (
            <div className="shared-nav-auth-buttons desktop-only">
              <button className="btn-login" onClick={openLogin}>Login</button>
              <button className="btn-register" onClick={openRegister}>Register</button>
            </div>
          )}
          
          {/* Employer Login */}
          <button 
            className="shared-nav-employer-btn desktop-only" 
            onClick={() => navigate('/employer-login')}
            title="Employer Login"
          >
            <FiBriefcase size={20} />
            <span>Employer Login</span>
          </button>

          {!user && (
            <div className="shared-nav-employer desktop-only">
              <span>For employers <FiChevronDown /></span>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
}
