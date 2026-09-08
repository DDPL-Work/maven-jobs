import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Login from './auth/Login';
import SignUp from './auth/SignUp';
import authService from './services/authService';

const AuthContext = createContext({ user: null, login: () => {}, register: () => {}, loginWithGoogle: () => {}, logout: () => {}, updateUser: () => {}, updateProfile: () => {}, openLogin: () => {}, openRegister: () => {}, closeModals: () => {}, loading: false });

const resolveProfilePic = (profile, authUser) => {
  const fromProfile = typeof profile?.profilePic === 'string'
    ? profile.profilePic
    : profile?.profilePic?.url || '';
  if (fromProfile) return fromProfile;

  const fromAuthUser = authUser?.profilePic || authUser?.avatar || authUser?.profileImage || '';
  if (fromAuthUser) return fromAuthUser;

  return '';
};

const resolveCoverPic = (profile, authUser) => {
  const fromProfile = typeof profile?.coverPic === 'string'
    ? profile.coverPic
    : profile?.coverPic?.url || '';
  if (fromProfile) return fromProfile;

  return authUser?.coverPic || '';
};

const mergeUserFromMe = (data, prevUser) => {
  const authUser = data.user || {};
  const profile = data.profile || {};

  return {
    ...authUser,
    ...profile,
    id: authUser.id || profile.id || prevUser?.id || '',
    name: authUser.name || profile.user?.name || prevUser?.name || '',
    email: authUser.email || profile.user?.email || prevUser?.email || '',
    role: authUser.role || profile.user?.role || prevUser?.role || 'CANDIDATE',
    avatar: authUser.avatar || prevUser?.avatar || '',
    profilePic: resolveProfilePic(profile, authUser),
    coverPic: resolveCoverPic(profile, authUser),
    headline: profile.headline || prevUser?.headline || '',
    education: profile.education || prevUser?.education || '',
    itSkills: profile.itSkills || prevUser?.itSkills || '',
    workExperiences: profile.workExperiences || prevUser?.workExperiences || [],
    educations: profile.educations || prevUser?.educations || [],
    projects: profile.projects || prevUser?.projects || [],
    projectTitle: profile.projectTitle || prevUser?.projectTitle || '',
    projectLink: profile.projectLink || prevUser?.projectLink || '',
    projectDescription: profile.projectDescription || prevUser?.projectDescription || '',
    profileCompletion: profile.profileCompletion ?? prevUser?.profileCompletion ?? 0,
    publicShareId: profile.publicShareId || prevUser?.publicShareId || '',
    phone: profile.phone || prevUser?.phone || '',
    currentTitle: profile.currentTitle || prevUser?.currentTitle || '',
    currentCompany: profile.currentCompany || prevUser?.currentCompany || '',
    currentCity: profile.currentCity || prevUser?.currentCity || '',
    totalExperience: profile.totalExperience || prevUser?.totalExperience || '',
    skills: profile.skills || prevUser?.skills || [],
    preferredRoles: profile.preferredRoles || prevUser?.preferredRoles || [],
    preferredLocations: profile.preferredLocations || prevUser?.preferredLocations || '',
    summary: profile.summary || prevUser?.summary || '',
    expectedSalary: profile.expectedSalary || prevUser?.expectedSalary || '',
    noticePeriod: profile.noticePeriod || prevUser?.noticePeriod || '',
    membership: authUser.membership || prevUser?.membership || { plan: 'FREE', active: false },
    provider: authUser.provider || prevUser?.provider || 'local',
  };
};

const mergeLoginResponse = (data) => {
  const authUser = data.user || {};
  const profile = data.profile || {};

  return {
    ...authUser,
    ...profile,
    id: authUser.id || profile.id || '',
    name: authUser.name || profile.user?.name || '',
    email: authUser.email || profile.user?.email || '',
    role: authUser.role || profile.user?.role || 'CANDIDATE',
    avatar: authUser.avatar || '',
    profilePic: resolveProfilePic(profile, authUser),
    coverPic: resolveCoverPic(profile, authUser),
    headline: profile.headline || '',
    education: profile.education || '',
    itSkills: profile.itSkills || '',
    projectTitle: profile.projectTitle || '',
    projectLink: profile.projectLink || '',
    projectDescription: profile.projectDescription || '',
    profileCompletion: profile.profileCompletion || 0,
    publicShareId: profile.publicShareId || '',
    phone: profile.phone || '',
    currentTitle: profile.currentTitle || '',
    currentCompany: profile.currentCompany || '',
    currentCity: profile.currentCity || '',
    totalExperience: profile.totalExperience || '',
    skills: profile.skills || [],
    preferredRoles: profile.preferredRoles || [],
    preferredLocations: profile.preferredLocations || [],
    summary: profile.summary || '',
    expectedSalary: profile.expectedSalary || '',
    noticePeriod: profile.noticePeriod || '',
    membership: authUser.membership || { plan: 'FREE', active: false },
    provider: authUser.provider || 'local',
  };
};

const AUTH_TOKEN_KEY = 'candidateToken';

const getAuthToken = (data) => data.accessToken || data.token || '';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.role === 'CLIENT' || parsed.role === 'ADMIN') {
        localStorage.removeItem("user");
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token || token === 'undefined') {
      const oldToken = localStorage.getItem("token");
      if (oldToken && oldToken !== 'undefined') {
        try {
          const payload = JSON.parse(atob(oldToken.split('.')[1]));
          if (payload.role === 'CANDIDATE') {
            localStorage.setItem(AUTH_TOKEN_KEY, oldToken);
            localStorage.removeItem("token");
            token = oldToken;
          }
        } catch {}
      }
    }
    if (!token || token === 'undefined') return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role === 'CLIENT' || payload.role === 'ADMIN') {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem("user");
        setUser(null);
        return;
      }
    } catch {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem("user");
      setUser(null);
      return;
    }

    authService.getMe().then((data) => {
      if (data?.user) {
        setUser((prev) => {
          const fresh = mergeUserFromMe(data, prev);
          localStorage.setItem("user", JSON.stringify(fresh));
          return fresh;
        });
      }
    }).catch(() => {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem("user");
      setUser(null);
    });
  }, []);

  const openLogin = useCallback(() => {
    setIsLoginModalOpen(true);
    setIsRegisterModalOpen(false);
  }, []);

  const openRegister = useCallback(() => {
    setIsRegisterModalOpen(true);
    setIsLoginModalOpen(false);
  }, []);

  const closeModals = useCallback(() => {
    setIsLoginModalOpen(false);
    setIsRegisterModalOpen(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      const userData = mergeLoginResponse(data);
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem(AUTH_TOKEN_KEY, getAuthToken(data));
      closeModals();
      window.dispatchEvent(new Event("candidate-logged-in"));
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, message: error.message || "Invalid credentials" };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await authService.register(userData);
      const userObj = mergeLoginResponse(data);
      setUser(userObj);
      localStorage.setItem("user", JSON.stringify(userObj));
      localStorage.setItem(AUTH_TOKEN_KEY, getAuthToken(data));
      closeModals();
      window.dispatchEvent(new Event("candidate-logged-in"));
      return { success: true };
    } catch (error) {
      console.error("Registration failed:", error);
      return { success: false, message: error.message || "Registration failed" };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credential) => {
    setLoading(true);
    try {
      const data = await authService.loginWithGoogle(credential);
      const userData = mergeLoginResponse(data);
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem(AUTH_TOKEN_KEY, getAuthToken(data));
      closeModals();
      window.dispatchEvent(new Event("candidate-logged-in"));
      return { success: true };
    } catch (error) {
      console.error("Google login failed:", error);
      return { success: false, message: error.message || "Google login failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem("token");
    sessionStorage.removeItem("dailyQuizShown");
    window.dispatchEvent(new Event("candidate-session-expired"));
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updatedUser = { ...prev, ...updates };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      if (response.success) {
        const updatedProfile = response.data;
        const profilePicUrl = resolveProfilePic(updatedProfile, null);
        const coverPicUrl = resolveCoverPic(updatedProfile, null);

        const profileWithShareId = {
          ...updatedProfile,
          publicShareId: updatedProfile.publicShareId || '',
        };

        updateUser({
          ...profileData,
          ...profileWithShareId,
          headline: updatedProfile.headline || '',
          summary: updatedProfile.summary || '',
          currentTitle: updatedProfile.currentTitle || '',
          currentCompany: updatedProfile.currentCompany || '',
          totalExperience: updatedProfile.totalExperience || '',
          noticePeriod: updatedProfile.noticePeriod || '',
          currentCity: updatedProfile.currentCity || '',
          phone: updatedProfile.phone || '',
          skills: updatedProfile.skills || [],
          education: updatedProfile.education || '',
          itSkills: updatedProfile.itSkills || '',
          projectTitle: updatedProfile.projectTitle || '',
          projectLink: updatedProfile.projectLink || '',
          projectDescription: updatedProfile.projectDescription || '',
          expectedSalary: updatedProfile.expectedSalary || '',
          preferredLocations: updatedProfile.preferredLocations || [],
          profilePic: profilePicUrl,
          coverPic: coverPicUrl,
          profileCompletion: updatedProfile.profileCompletion ?? 0,
        });
        return { success: true, profile: updatedProfile };
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      return { success: false, message: error.message || "Failed to update profile" };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, updateUser, updateProfile, openLogin, openRegister, closeModals, loading }}>
      {children}
      {isLoginModalOpen && <Login isOpen={isLoginModalOpen} onClose={closeModals} openSignUp={openRegister} />}
      {isRegisterModalOpen && <SignUp isOpen={isRegisterModalOpen} onClose={closeModals} openLogin={openLogin} />}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
