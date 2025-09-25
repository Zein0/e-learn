"use client";

import { FormEvent, useState, useTransition } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type LoginFormDictionary = {
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  submit: string;
  submitting: string;
  signup: string;
  signingUp: string;
  toggleToSignup: string;
  toggleToLogin: string;
  success: string;
  signupSuccess: string;
  errors: {
    userSyncFailed: string;
    unexpected: string;
  };
};

type LoginFormProps = {
  dictionary: LoginFormDictionary;
};

export function LoginForm({ dictionary }: LoginFormProps) {
  const auth = getFirebaseClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        const credential =
          mode === "signup"
            ? await createUserWithEmailAndPassword(auth, email, password)
            : await signInWithEmailAndPassword(auth, email, password);
        const idToken = await credential.user.getIdToken(true);
        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (!response.ok) {
          throw new Error(dictionary.errors.userSyncFailed);
        }
        toast.success(mode === "signup" ? dictionary.signupSuccess : dictionary.success);
        setEmail("");
        setPassword("");
      } catch (error) {
        const message = error instanceof Error ? error.message : dictionary.errors.unexpected;
        toast.error(message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-2">
        <Label htmlFor="email">{dictionary.emailLabel}</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={dictionary.emailPlaceholder}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">{dictionary.passwordLabel}</Label>
        <Input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={dictionary.passwordPlaceholder}
        />
      </div>
      <div className="space-y-3">
        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending
            ? mode === "signup"
              ? dictionary.signingUp
              : dictionary.submitting
            : mode === "signup"
              ? dictionary.signup
              : dictionary.submit}
        </Button>
        <button
          type="button"
          onClick={() => setMode((current) => (current === "login" ? "signup" : "login"))}
          className="w-full text-sm font-medium text-emerald-600 transition hover:text-emerald-700"
        >
          {mode === "login" ? dictionary.toggleToSignup : dictionary.toggleToLogin}
        </button>
      </div>
    </form>
  );
}
