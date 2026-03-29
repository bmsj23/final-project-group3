export type SignInFormValues = {
  email: string;
  password: string;
};

export type SignUpFormValues = SignInFormValues & {
  fullName: string;
};
