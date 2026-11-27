import { api } from "./api";

export interface Influencer {
  _id: string;
  name: string;
  email: string;
  referralCode: string;
  discountPercent: number;
  commissionPercent: number;
  firstPurchaseCommission: number;
  renewalCommission: number;
  balance: number;
  totalEarned: number;
  totalPaid: number;
  status: string;
}

export interface DashboardStats {
  totalReferrals: number;
  subscribedReferrals: number;
  balance: number;
  totalEarned: number;
  totalPaid: number;
  pendingTotal: number;
}

export interface ReferralRow {
  username: string;
  userEmail: string;
  hasSubscribed: boolean;
  joinedAt: string;
}

export interface CommissionRow {
  username: string;
  plan: string;
  amountPaid: number;
  commissionAmount: number;
  status: "pending" | "paid";
  period: string;
  purchasedAt: string;
  paidAt: string | null;
}

export interface DashboardData {
  influencer: Influencer;
  referralLink: string;
  stats: DashboardStats;
  referrals: ReferralRow[];
  commissions: CommissionRow[];
}

export interface LoginResponse {
  influencer: Influencer;
  token: string;
}

export const affiliateService = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/affiliate/login", { email, password }),

  getDashboard: () => api.get<DashboardData>("/affiliate/dashboard"),

  // Promo codes
  generatePromo: (plan: string = "gold", durationDays: number = 30) =>
    api.post<{ code: string; plan: string; durationDays: number; expiresAt: string; remaining: number }>(
      "/affiliate/promo/generate", { plan, durationDays }
    ),

  listPromos: () => api.get<Array<{
    _id: string;
    code: string;
    plan: string;
    durationDays: number;
    isUsed: boolean;
    usedByUsername: string;
    usedAt: string | null;
    expiresAt: string;
    createdAt: string;
  }>>("/affiliate/promo/list"),

  // Admin endpoints
  createInfluencer: (data: {
    name: string;
    email: string;
    password: string;
    referralCode?: string;
    discountPercent?: number;
    commissionPercent?: number;
    firstPurchaseCommission?: number;
    renewalCommission?: number;
  }, adminSecret: string) =>
    api.postAdmin<Influencer>("/affiliate/admin/influencers", data, adminSecret),

  listInfluencers: (adminSecret: string) =>
    api.getAdmin<Influencer[]>("/affiliate/admin/influencers", adminSecret),

  updateInfluencer: (influencerId: string, data: Partial<Influencer>, adminSecret: string) =>
    api.putAdmin<Influencer>(`/affiliate/admin/influencers/${influencerId}`, data, adminSecret),
};
