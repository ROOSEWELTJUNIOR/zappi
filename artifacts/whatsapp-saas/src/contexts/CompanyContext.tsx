import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Company } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'flowbot_company';
const STORAGE_COMPANIES_KEY = 'flowbot_companies';

interface CreateCompanyData {
  name: string;
  phone: string;
  segment: string;
  employeesCount: string;
  logo?: string | null;
}

interface CompanyContextType {
  company: Company | null;
  /** Alias for `company` — used by Header and other existing components */
  currentCompany: Company | null;
  companies: Company[];
  hasCompany: boolean;
  createCompany: (data: CreateCompanyData) => Promise<Company>;
  switchCompany: (id: string) => void;
  /** Alias for switchCompany — used by Header (accepts a Company object) */
  setCurrentCompany: (company: Company) => void;
}

const mockCompanies: Company[] = [
  {
    id: 'company_1',
    name: 'FlowBot Demo',
    logo: null,
    plan: 'Pro',
    segment: 'Marketing',
    employeesCount: '11-50',
    phone: '(11) 99999-0001',
    usersCount: 5,
    whatsappsCount: 3,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'company_2',
    name: 'E-commerce Brasil',
    logo: null,
    plan: 'Starter',
    segment: 'E-commerce',
    employeesCount: '1-10',
    phone: '(21) 98888-0002',
    usersCount: 2,
    whatsappsCount: 1,
    createdAt: '2024-03-01T10:00:00Z',
  },
];

/** Synchronously restore companies list from localStorage */
function restoreCompanies(): Company[] {
  try {
    const stored = localStorage.getItem(STORAGE_COMPANIES_KEY);
    if (stored) return JSON.parse(stored) as Company[];
  } catch { /* ignore */ }
  return mockCompanies;
}

/** Synchronously restore active company from localStorage */
function restoreCurrentCompany(companies: Company[]): Company | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Company;
  } catch { /* ignore */ }
  return null;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Synchronous init — no useEffect gap, no null flash
  const [companies, setCompanies] = useState<Company[]>(restoreCompanies);
  const [company, setCompany] = useState<Company | null>(() =>
    restoreCurrentCompany(restoreCompanies()),
  );

  // Fallback: if no stored company but user has a companyId, resolve from list
  useEffect(() => {
    if (!company && user?.companyId) {
      const found = companies.find((c) => c.id === user.companyId) ?? null;
      if (found) {
        setCompany(found);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
      }
    }
  }, [user?.companyId, company, companies]);

  const createCompany = async (data: CreateCompanyData): Promise<Company> => {
    await new Promise((r) => setTimeout(r, 900));

    const newCompany: Company = {
      id: 'company_' + Date.now(),
      name: data.name,
      logo: data.logo ?? null,
      plan: 'free',
      segment: data.segment,
      employeesCount: data.employeesCount,
      phone: data.phone,
      usersCount: 1,
      whatsappsCount: 0,
      createdAt: new Date().toISOString(),
    };

    const updated = [...companies, newCompany];
    setCompanies(updated);
    setCompany(newCompany);
    localStorage.setItem(STORAGE_COMPANIES_KEY, JSON.stringify(updated));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCompany));

    return newCompany;
  };

  const switchCompany = (id: string) => {
    const found = companies.find((c) => c.id === id) ?? null;
    setCompany(found);
    if (found) localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
  };

  const setCurrentCompany = (c: Company) => {
    setCompany(c);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  };

  return (
    <CompanyContext.Provider
      value={{
        company,
        currentCompany: company,
        companies,
        hasCompany: !!company,
        createCompany,
        switchCompany,
        setCurrentCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) throw new Error('useCompany must be used within CompanyProvider');
  return context;
}
