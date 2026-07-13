import { createContext, useContext, useState, ReactNode } from 'react';
import { Company } from '../types';

interface CompanyContextType {
  companies: Company[];
  currentCompany: Company;
  setCurrentCompany: (company: Company) => void;
}

const mockCompanies: Company[] = [
  {
    id: "comp-1",
    name: "FlowBot Demo",
    logo: null,
    plan: "Pro",
    usersCount: 5,
    whatsappsCount: 3
  },
  {
    id: "comp-2",
    name: "Acme Corp Brazil",
    logo: null,
    plan: "Enterprise",
    usersCount: 12,
    whatsappsCount: 5
  }
];

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies] = useState<Company[]>(mockCompanies);
  const [currentCompany, setCurrentCompany] = useState<Company>(mockCompanies[0]);

  return (
    <CompanyContext.Provider value={{ companies, currentCompany, setCurrentCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
