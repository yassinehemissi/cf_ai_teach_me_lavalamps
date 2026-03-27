export type AuthMode = "signin" | "signup";

export type AuthFormProps = {
  mode: AuthMode;
};

export type AuthFormState = {
  email: string;
  password: string;
  error: string | null;
  isSubmitting: boolean;
  title: string;
  subtitle: string;
  submitLabel: string;
  alternateHref: string;
  alternateLabel: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
};
