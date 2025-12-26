import * as React from "react";
import { reatomComponent } from "@reatom/react";
import { isAuthenticatedAtom } from "@/stores/auth/atoms";
import { match } from "ts-pattern";
import { LoginForm } from "./login-form";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = reatomComponent<AuthGuardProps>(({ children }) => {
  console.log("isAuthenticatedAtom", isAuthenticatedAtom());
  return match(isAuthenticatedAtom())
    .with(true, () => children)
    .otherwise(() => <LoginForm />);
}, "AuthGuard");
