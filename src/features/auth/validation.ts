export function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email.trim());
}

export function isStrongEnoughPassword(password: string) {
  return password.trim().length >= 8;
}
