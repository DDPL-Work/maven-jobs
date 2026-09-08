import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import "./responsive.css";
import NaukriLandingPage from "./pages/candidates/features/landing/NaukriLandingPage";
import EmployerLandingPage from "./pages/candidates/features/landing/EmployerLandingPage";
import ClientRegistrationForm from "./pages/employer/features/auth/ClientRegistrationForm";
import JobListingPage from "./pages/candidates/features/jobs/JobListingPage";
import JobsInfo from "./pages/candidates/features/jobs/JobsInfo";
import JobDetailsPage from "./pages/candidates/features/jobs/JobDetailsPage";
import Buyonline from "./pages/employer/features/pricing/Buyonline";
import ProfileDashboard from "./pages/candidates/features/dashboard/ProfileDashboard";
import HomeDashboard from "./pages/candidates/features/dashboard/HomeDashboard";
import RecommendedJobsPage from "./pages/candidates/features/dashboard/RecommendedJobsPage";
import CompaniesPage from "./pages/candidates/features/jobs/CompaniesPage";
import Jobprofile from "./pages/candidates/features/jobs/Jobprofile";
import ExpertAssist from "./pages/employer/features/landing/Artist";
import Services from "./pages/candidates/features/premium/Services";
import MavenPro from "./pages/candidates/features/premium/MavenPro";
import Premium from "./pages/candidates/features/premium/Premium";
import Info from "./pages/candidates/features/dashboard/Info";
import FooterPage from "./pages/candidates/features/landing/FooterPage";
import TermsOfService from "./pages/candidates/legal/TermsOfService";
import PrivacyPolicy from "./pages/candidates/legal/PrivacyPolicy";
import CookiePolicy from "./pages/candidates/legal/CookiePolicy";
import FraudAlert from "./pages/candidates/legal/FraudAlert";
import RefundPolicy from "./pages/candidates/legal/RefundPolicy";
import GrievanceRedressal from "./pages/candidates/legal/GrievanceRedressal";
import EmployerGrievances from "./pages/employer/features/legal/Grievances";
import EmployerTerms from "./pages/employer/features/legal/EmployerTerms";
import EmployerPrivacyPolicy from "./pages/employer/features/legal/EmployerPrivacyPolicy";
import SummonsAndNotice from "./pages/employer/features/legal/SummonsAndNotice";
import TrustAndSafety from "./pages/employer/features/legal/TrustAndSafety";
import Whitehat from "./pages/employer/features/legal/Whitehat";
import SalaryInsights from "./pages/candidates/features/jobs/SalaryInsights";
import Blogs from "./pages/candidates/features/blog/Blogs";
import BlogAIRex from "./pages/candidates/features/blog/Blogsx";
import BlogArticle from "./pages/candidates/features/blog/BlogArticle";
import DailyQuiz from "./pages/candidates/features/engagement/DailyQuiz";
import SavedJobs from "./pages/candidates/features/jobs/SavedJobs";
import Leave from "./pages/candidates/features/premium/Leave";
import DailyQuizNotification from "./components/DailyQuizNotification";
import PostJob from "./pages/employer/features/jobs/PostJob";
import ProtectedEmployerRoute from "./components/employer/ProtectedEmployerRoute";
import EmployerHelp from "./pages/employer/features/landing/Help";
import Talent from "./pages/employer/features/landing/Talent";
import Branding from "./pages/employer/features/landing/Branding";
import JobPosting from "./pages/employer/features/landing/JobPosting";
import ResumeDatabase from "./pages/employer/features/landing/ResumeDatabase";
import ResumeBuilder from "./pages/candidates/features/resume/ResumeBuilder";
import ResumeView from "./pages/candidates/features/resume/ResumeView";
import ResumeViewer from "./pages/candidates/features/resume/ResumeViewer";
import HiringAutomation from "./pages/employer/features/landing/HiringAutomation";
import EmployerDashboard from "./pages/employer/features/dashboard/Dashboards";
import AnalyticsPage from "./pages/employer/features/dashboard/AnalyticsPage";
import SearchResume from "./pages/employer/features/search/SearchResume";
import SearchResults from "./pages/employer/features/search/SearchResults";
import ManageSearch from "./pages/employer/features/search/ManageSearch";
import Pricing from "./pages/employer/features/pricing/Pricing";
import DraftJobs from "./pages/employer/features/jobs/DraftJobs";
import ReviewSharePage from "./pages/employer/features/reviews/ReviewSharePage";
import FolderListPage from "./pages/employer/features/folders/FolderListPage";
import SingleFolderPage from "./pages/employer/features/folders/SingleFolderPage";
import JobPostingReport from "./pages/employer/report/JobPostingReport";
import ResdexReport from "./pages/employer/report/ResdexReport";
// Employer Company Profile
import CompanyProfilePage from "./pages/employer/features/profile/CompanyProfilePage";
import MySubscriptionsPage from "./pages/employer/features/subscriptions/MySubscriptionsPage";
import PublicProfileByShareId from "./pages/candidates/features/profile/PublicProfileByShareId";
import PublicCandidateProfile from "./pages/candidates/features/profile/PublicCandidateProfile";
import CandidateSitemap from "./pages/candidates/features/landing/CandidateSitemap";
import InterviewQuestions from "./pages/candidates/features/company/InterviewQuestions";
import SalaryCalculator from "./pages/candidates/features/company/SalaryCalculator";
import MIvitesPage from "./pages/candidates/features/engagement/MIvitesPage";
import Premium3D from "./components/Premium3D";
import { AuthProvider, useAuth } from "./AuthContext";
import ScrollToTop from "./components/ScrollToTop";
import authService from "./services/authService";
import TextResume from "./pages/candidates/features/services/TextResume";
import VisualResume from "./pages/candidates/features/services/VisualResume";
import ResumeCritique from "./pages/candidates/features/services/ResumeCritique";
import Jobs4u from "./pages/candidates/features/services/Jobs4u";
import PriorityApplicant from "./pages/candidates/features/services/PriorityApplicant";
import ContactUs from "./pages/candidates/features/services/ContactUs";
import ResumeDisplay from "./pages/candidates/features/services/ResumeDisplay";
import MonthlySubscriptions from "./pages/candidates/features/services/MonthlySubscriptions";
import BasicPremiumPlans from "./pages/candidates/features/services/BasicPremiumPlans";
import ResumeMaker from "./pages/candidates/features/services/ResumeMaker";
import ResumeQualityScore from "./pages/candidates/features/services/ResumeQualityScore";
import ResumeSamples from "./pages/candidates/features/services/ResumeSamples";
import JobLetterSamples from "./pages/candidates/features/services/JobLetterSamples";

const ProtectedRoute = ({ children }) => {
  const hasToken =
    localStorage.getItem("candidateToken") ||
    localStorage.getItem("token");
  if (!hasToken) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppContent() {
  const [showQuizPopup, setShowQuizPopup] = useState(false);
  const [quizNotification, setQuizNotification] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const isLoggedIn = user || localStorage.getItem("user");
    const alreadyShown = sessionStorage.getItem("dailyQuizShown");
    const isPublicSharePage = location.pathname.startsWith("/mj/");

    if (isLoggedIn && !alreadyShown && !isPublicSharePage) {
      let cancelled = false;
      const timer = setTimeout(async () => {
        try {
          const quiz = await authService.getQuizNotification();
          if (!cancelled && quiz?.isAvailable) {
            setQuizNotification(quiz);
            setShowQuizPopup(true);
            sessionStorage.setItem("dailyQuizShown", "true");
          }
        } catch {
          if (!cancelled) {
            setQuizNotification(null);
          }
        }
      }, 1500);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
  }, [user, location.pathname]);

  // Redirect to /dashboard after login/register
  useEffect(() => {
    const handler = () => navigate("/dashboard");
    window.addEventListener("candidate-logged-in", handler);
    return () => window.removeEventListener("candidate-logged-in", handler);
  }, [navigate]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* --- Public & Common Routes --- */}
        <Route path="/" element={<NaukriLandingPage />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blogs/:slug" element={<BlogArticle />} />
        <Route path="/blog-article" element={<BlogAIRex />} />
        <Route path="/mj/:shareId" element={<PublicProfileByShareId />} />
        <Route path="/candidates/:candidateId" element={<PublicCandidateProfile />} />
        
        {/* --- Legal Pages --- */}
        <Route path="/maven-jobs/terms" element={<TermsOfService />} />
        <Route path="/maven-jobs/privacy" element={<PrivacyPolicy />} />
        <Route path="/maven-jobs/cookies" element={<CookiePolicy />} />
        <Route path="/maven-jobs/fraud-alert" element={<FraudAlert />} />
        <Route path="/maven-jobs/refund-policy" element={<RefundPolicy />} />
        <Route path="/maven-jobs/grievance" element={<GrievanceRedressal />} />
        <Route path="/maven-jobs/employer-terms" element={<EmployerTerms />} />
        <Route path="/maven-jobs/employer-privacy" element={<EmployerPrivacyPolicy />} />
        <Route path="/maven-jobs/employer-grievance" element={<EmployerGrievances />} />
        <Route path="/maven-jobs/summons" element={<SummonsAndNotice />} />
        <Route path="/maven-jobs/trust-safety" element={<TrustAndSafety />} />
        <Route path="/maven-jobs/whitehat" element={<Whitehat />} />
        <Route path="/maven-jobs/:slug" element={<FooterPage />} />

        {/* --- Candidate Routes --- */}
        {/* --- Public Candidate Routes --- */}
        <Route path="/jobs" element={<JobListingPage />} />
        <Route path="/jobs/info" element={<JobsInfo />} />
        <Route path="/salary-insights" element={<SalaryInsights />} />
        <Route path="/interview-questions" element={<InterviewQuestions />} />
        <Route path="/salary-calculator" element={<SalaryCalculator />} />
        <Route path="/jobs/:filter" element={<JobListingPage />} />
        <Route path="/job/:id" element={<JobDetailsPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/companies/:filter" element={<CompaniesPage />} />
        <Route path="/company/:id" element={<Jobprofile />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/text-resume" element={<TextResume />} />
        <Route path="/services/visual-resume" element={<VisualResume />} />
        <Route path="/services/resume-critique" element={<ResumeCritique />} />
        <Route path="/services/jobs4u" element={<Jobs4u />} />
        <Route path="/services/priority-applicant" element={<PriorityApplicant />} />
        <Route path="/services/contact-us" element={<ContactUs />} />
        <Route path="/services/resume-display" element={<ResumeDisplay />} />
        <Route path="/services/monthly-subscriptions" element={<MonthlySubscriptions />} />
        <Route path="/services/basic-and-premium-plans" element={<BasicPremiumPlans />} />
        <Route path="/services/resume-maker" element={<ResumeMaker />} />
        <Route path="/services/resume-quality-score" element={<ResumeQualityScore />} />
        <Route path="/services/resume-samples" element={<ResumeSamples />} />
        <Route path="/services/job-letter-samples" element={<JobLetterSamples />} />
        <Route path="/pro" element={<MavenPro />} /> 
        <Route path="/premium" element={<Premium />} />
        <Route path="/info" element={<Info />} />
        <Route path="/sitemap" element={<CandidateSitemap />} />
        <Route path="/leave" element={<Leave />} />

        {/* --- Protected Candidate Routes --- */}
        <Route path="/dashboard" element={<ProtectedRoute><HomeDashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfileDashboard /></ProtectedRoute>} />
        <Route path="/daily-quiz" element={<ProtectedRoute><DailyQuiz /></ProtectedRoute>} />
        <Route path="/saved-jobs" element={<ProtectedRoute><SavedJobs /></ProtectedRoute>} />
        <Route path="/recommended-jobs" element={<ProtectedRoute><RecommendedJobsPage /></ProtectedRoute>} />
        <Route path="/mivites" element={<ProtectedRoute><MIvitesPage /></ProtectedRoute>} />
        <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
        <Route path="/resume-view" element={<ProtectedRoute><ResumeView /></ProtectedRoute>} />
        <Route path="/profile/resume" element={<ProtectedRoute><ResumeViewer /></ProtectedRoute>} />

        {/* --- Employer Routes --- */}
        <Route path="/employer-login" element={<EmployerLandingPage />} />
        <Route path="/recruit/client-registration-form" element={<ClientRegistrationForm />} />
        <Route path="/buy-online" element={<Buyonline />} />
        <Route path="/expert-assist" element={<ExpertAssist />} />
        <Route path="/employer-help" element={<EmployerHelp />} />
        <Route path="/talent-pulse" element={<Talent />} />
        <Route path="/branding" element={<Branding />} />
        <Route path="/job-posting" element={<JobPosting />} />
        <Route path="/resume-database" element={<ResumeDatabase />} />
        <Route path="/hiring-automation" element={<HiringAutomation />} />
        <Route path="/review/:reviewId" element={<ReviewSharePage />} />
        <Route path="/post-job" element={<ProtectedEmployerRoute><PostJob /></ProtectedEmployerRoute>} />
        <Route path="/employer-draft-jobs" element={<ProtectedEmployerRoute><DraftJobs /></ProtectedEmployerRoute>} />
        <Route path="/employer-dashboard" element={<ProtectedEmployerRoute><EmployerDashboard /></ProtectedEmployerRoute>} />
        <Route path="/employer-dashboard/company-profile" element={<ProtectedEmployerRoute><CompanyProfilePage /></ProtectedEmployerRoute>} />
        <Route path="/company-profile" element={<ProtectedEmployerRoute><CompanyProfilePage /></ProtectedEmployerRoute>} />
        <Route path="/employer-dashboard/subscriptions" element={<ProtectedEmployerRoute><MySubscriptionsPage /></ProtectedEmployerRoute>} />
        <Route path="/my-subscriptions" element={<ProtectedEmployerRoute><MySubscriptionsPage /></ProtectedEmployerRoute>} />
        <Route path="/employer-dashboard/analytics" element={<ProtectedEmployerRoute><AnalyticsPage /></ProtectedEmployerRoute>} />
        <Route path="/employer-dashboard/pricing" element={<ProtectedEmployerRoute><Pricing /></ProtectedEmployerRoute>} />
        <Route path="/employer-dashboard/folders" element={<ProtectedEmployerRoute><FolderListPage /></ProtectedEmployerRoute>} />
        <Route path="/manage-folders" element={<ProtectedEmployerRoute><FolderListPage /></ProtectedEmployerRoute>} />
        <Route path="/manage-folders/:tab" element={<ProtectedEmployerRoute><FolderListPage /></ProtectedEmployerRoute>} />
        <Route path="/employer-dashboard/folders/:folderId" element={<ProtectedEmployerRoute><SingleFolderPage /></ProtectedEmployerRoute>} />
        <Route path="/resdex" element={<ProtectedEmployerRoute><SearchResume /></ProtectedEmployerRoute>} />
        <Route path="/resdex/search-results" element={<ProtectedEmployerRoute><SearchResults /></ProtectedEmployerRoute>} />
        <Route path="/manage-search" element={<ProtectedEmployerRoute><ManageSearch /></ProtectedEmployerRoute>} />
        <Route path="/reports-job-posting" element={<ProtectedEmployerRoute><JobPostingReport /></ProtectedEmployerRoute>} />
        <Route path="/report/resdex" element={<ProtectedEmployerRoute><ResdexReport /></ProtectedEmployerRoute>} />
        <Route path="/reports-resdex" element={<ProtectedEmployerRoute><ResdexReport /></ProtectedEmployerRoute>} />
      </Routes>

      <DailyQuizNotification
        isOpen={showQuizPopup}
        duration={10}
        onClose={() => setShowQuizPopup(false)}
        onTakeQuiz={() => navigate("/daily-quiz")}
        quizTitle={quizNotification?.title || "Your Daily Quiz is Ready!"}
        quizSubtitle={quizNotification?.subtitle || "Sharpen your skills with today's challenge and earn XP."}
        questionCount={quizNotification?.questionCount || 5}
        xpReward={quizNotification?.xpReward || 100}
        quizDurationSeconds={quizNotification?.durationSeconds || 75}
      />
      {!location.pathname.startsWith("/mj/") && location.pathname !== "/blog-article" && location.pathname !== "/resume-builder" && location.pathname !== "/recruit/client-registration-form" && <Premium3D />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

