import type { AppRole } from '../../lib/supabase/types';

export type AuthContract = {
  signUpFields: ['fullName', 'email', 'password'];
  signInFields: ['email', 'password'];
  profileFieldsAfterAuth: ['id', 'email', 'full_name', 'role', 'is_suspended'];
  guestRestrictions: ['create_event', 'book_event', 'cancel_booking', 'edit_profile'];
  roleSource: 'profiles.role';
};

export const authContract: AuthContract = {
  signUpFields: ['fullName', 'email', 'password'],
  signInFields: ['email', 'password'],
  profileFieldsAfterAuth: ['id', 'email', 'full_name', 'role', 'is_suspended'],
  guestRestrictions: ['create_event', 'book_event', 'cancel_booking', 'edit_profile'],
  roleSource: 'profiles.role',
};

export function isAdminRole(role: AppRole | undefined) {
  return role === 'admin';
}
