"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { User } from "firebase/auth";
import { subscribeToAuthChanges } from "@/lib/firebase/client";
import { createSessionCookie, logoutSession } from "@/lib/actions/auth.action";
import { getProfileById } from "@/lib/actions/profile.action";
import { hasFacialData } from "@/lib/actions/facial.action";
import { Profile } from "@/lib/domains/profile.domain";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  hasFacialSetup: boolean | null;
  loginScanFace: boolean;
  needsFacialSetup: boolean;
  needsLoginScan: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  setServerSession: (idToken: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  refreshFacialStatus: () => Promise<void>;
  setLoginScanFace: (scanned: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasFacialSetup, setHasFacialSetup] = useState<boolean | null>(null);
  const [loginScanFace, setLoginScanFaceState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      setUser(firebaseUser);

      // Reset login scan face for new user session
      setLoginScanFaceState(false);

      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          await setServerSession(idToken);

          // Fetch the user's profile and facial setup status in parallel
          const [profileResult, facialResult] = await Promise.all([
            getProfileById(firebaseUser.uid),
            hasFacialData(firebaseUser.uid),
          ]);

          if (profileResult.profile) {
            setProfile(profileResult.profile);
          } else if (profileResult.error) {
            console.error("Error fetching profile:", profileResult.error);
          }

          // Set facial setup status with better error handling
          if (facialResult.success) {
            setHasFacialSetup(facialResult.data || false);
          } else {
            console.error("Error checking facial data:", facialResult.error);
            // When there's an error checking facial data, assume they need setup
            setHasFacialSetup(false);
          }
        } catch (error) {
          console.error("Error in auth initialization:", error);
          setHasFacialSetup(false);
        } finally {
          // Only set loading to false after all data is loaded
          setIsLoading(false);
        }
      } else {
        setProfile(null);
        setHasFacialSetup(null);
        // Set loading to false immediately for logged out users
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const needsFacialSetup = user !== null && hasFacialSetup !== true;
  const needsLoginScan =
    user !== null && hasFacialSetup === true && !loginScanFace;

  function setLoginScanFace(scanned: boolean) {
    setLoginScanFaceState(scanned);
  }

  async function setServerSession(idToken: string): Promise<boolean> {
    const result = await createSessionCookie(idToken);
    return result.success;
  }

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    try {
      const profileResult = await getProfileById(user.uid);
      if (profileResult.profile) {
        setProfile(profileResult.profile);
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  }, [user]);

  async function refreshFacialStatus() {
    if (!user) return;

    try {
      const facialResult = await hasFacialData(user.uid);
      setHasFacialSetup(
        facialResult.success ? facialResult.data || false : false
      );
    } catch (error) {
      console.error("Error refreshing facial status:", error);
    }
  }

  async function signOut() {
    try {
      // Clear the server-side session
      await logoutSession();
      // Sign out from Firebase client
      await import("@/lib/firebase/client").then((auth) => auth.logoutUser());
      setUser(null);
      setProfile(null);
      setHasFacialSetup(null);
      setLoginScanFaceState(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        hasFacialSetup,
        loginScanFace,
        needsFacialSetup,
        needsLoginScan,
        isLoading,
        signOut,
        setServerSession,
        refreshProfile,
        refreshFacialStatus,
        setLoginScanFace,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
