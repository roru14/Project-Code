import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DailyGoals } from "@/lib/constants";
import { storage, type Profile } from "@/lib/storage";

interface ProfileContextType {
  profile: Profile;
  goals: DailyGoals;
  setName: (name: string) => void;
  setGoals: (goals: DailyGoals) => void;
  completeOnboarding: (name: string) => void;
  reload: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function useProfile(): ProfileContextType {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}

/** Convenience for the many screens that only care about the goals. */
export function useGoals(): DailyGoals {
  return useProfile().goals;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(storage.loadProfile);

  const persist = useCallback((next: Profile) => {
    storage.saveProfile(next);
    setProfile(next);
  }, []);

  const setName = useCallback(
    (name: string) => persist({ ...profile, name: name.trim() }),
    [persist, profile],
  );

  const setGoals = useCallback(
    (goals: DailyGoals) => persist({ ...profile, goals }),
    [persist, profile],
  );

  const completeOnboarding = useCallback(
    (name: string) =>
      persist({ ...profile, name: name.trim(), onboarded: true }),
    [persist, profile],
  );

  const reload = useCallback(() => setProfile(storage.loadProfile()), []);

  const value = useMemo<ProfileContextType>(
    () => ({
      profile,
      goals: profile.goals,
      setName,
      setGoals,
      completeOnboarding,
      reload,
    }),
    [profile, setName, setGoals, completeOnboarding, reload],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}
