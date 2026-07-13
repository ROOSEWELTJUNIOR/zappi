export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  companyId: string | null;
  role: 'admin' | 'manager' | 'agent';
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
}

export interface Company {
  id: string;
  name: string;
  logo: string | null;
  plan: string;
  segment: string;
  employeesCount: string;
  phone: string;
  usersCount: number;
  whatsappsCount: number;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Connection {
  id: string;
  name: string;
  phone: string;
  status: 'connected' | 'disconnected' | 'pending';
  createdAt: string;
}

export interface Flow {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'draft';
  trigger: string;
  lastRun?: string;
  stepsCount: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  status: 'active' | 'inactive';
}

export interface Order {
  id: string;
  orderNumber: string;
  contactName: string;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
}
