"use client";

import { FormEvent, useState, useTransition } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
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
  success: string;
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
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await credential.user.getIdToken(true);
        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (!response.ok) {
          throw new Error(dictionary.errors.userSyncFailed);
        }
        toast.success(dictionary.success);
        setEmail("");
        setPassword("");
      } catch (error) {
        const message = error instanceof Error ? error.message : dictionary.errors.unexpected;
        toast.error(message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? dictionary.submitting : dictionary.submit}
      </Button>
    </form>
  );
}
