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
  companies: Company[];
  hasCompany: boolean;
  createCompany: (data: CreateCompanyData) => Promise<Company>;
  switchCompany: (id: string) => void;
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

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    const storedCompanies = localStorage.getItem(STORAGE_COMPANIES_KEY);
    const parsed: Company[] = storedCompanies ? JSON.parse(storedCompanies) : mockCompanies;
    setCompanies(parsed);

    const storedCurrent = localStorage.getItem(STORAGE_KEY);
    if (storedCurrent) {
      setCompany(JSON.parse(storedCurrent) as Company);
    } else if (user?.companyId) {
      const found = parsed.find((c) => c.id === user.companyId) ?? null;
      setCompany(found);
    }
  }, [user?.companyId]);

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

  return (
    <CompanyContext.Provider
      value={{ company, companies, hasCompany: !!company, createCompany, switchCompany }}
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
