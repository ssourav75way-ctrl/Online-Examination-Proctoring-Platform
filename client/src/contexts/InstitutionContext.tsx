import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { InstitutionMembership } from "@/types/auth";

interface InstitutionContextType {
  activeMembership: InstitutionMembership | null;
  institutionId: string;
  allMemberships: InstitutionMembership[];
  hasMultiple: boolean;
  switchInstitution: (index: number) => void;
  activeIndex: number;
}

const InstitutionContext = createContext<InstitutionContextType>({
  activeMembership: null,
  institutionId: "",
  allMemberships: [],
  hasMultiple: false,
  switchInstitution: () => {},
  activeIndex: 0,
});

const STORAGE_KEY = "oep_active_institution_idx";

export function InstitutionProvider({ children }: { children: ReactNode }) {
  const user = useSelector((state: RootState) => state.auth.user);
  const memberships = user?.institutionMembers || [];

  const [activeIndex, setActiveIndex] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? parseInt(saved, 10) : 0;
    return parsed >= 0 && parsed < memberships.length ? parsed : 0;
  });

  useEffect(() => {
    if (activeIndex >= memberships.length && memberships.length > 0) {
      setActiveIndex(0);
      localStorage.setItem(STORAGE_KEY, "0");
    }
  }, [memberships.length, activeIndex]);

  const switchInstitution = (index: number) => {
    if (index >= 0 && index < memberships.length) {
      setActiveIndex(index);
      localStorage.setItem(STORAGE_KEY, String(index));
      window.location.reload();
    }
  };

  const activeMembership = memberships[activeIndex] || null;

  return (
    <InstitutionContext.Provider
      value={{
        activeMembership,
        institutionId: activeMembership?.institution?.id || "",
        allMemberships: memberships,
        hasMultiple: memberships.length > 1,
        switchInstitution,
        activeIndex,
      }}
    >
      {children}
    </InstitutionContext.Provider>
  );
}

export function useInstitution() {
  return useContext(InstitutionContext);
}
