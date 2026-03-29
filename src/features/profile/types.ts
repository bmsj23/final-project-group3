export type ProfileSummary = {
  id: string;
  fullName: string;
  role: 'admin' | 'user';
  bio?: string;
};
