export type SignInFormValues = {
  email: string;
  password: string;
};

export type SignUpFormValues = SignInFormValues & {
  fullName: string;
};

export type AuthFormErrors<T extends string> = Partial<Record<T, string>>;
