export type AdminMetric = {
  label: string;
  value: number;
};

export type AdminUserSummary = {
  id: string;
  email: string;
  fullName: string | null;
  role: 'admin' | 'user';
  isSuspended: boolean;
  createdAt: string;
};
