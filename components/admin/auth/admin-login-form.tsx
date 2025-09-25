"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFirebaseClient } from "@/lib/firebase-client";

export function AdminLoginForm() {
  const router = useRouter();
  const auth = getFirebaseClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await credential.user.getIdToken();
        const response = await fetch("/api/admin/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
          const message = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(message?.error ?? "Unable to sign in");
        }

        toast.success("Welcome back, admin");
        setEmail("");
        setPassword("");
        router.replace("/admin");
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Something went wrong";
        toast.error(message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2 text-left">
        <Label htmlFor="admin-email">Work email</Label>
        <Input
          id="admin-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@example.com"
        />
      </div>
      <div className="grid gap-2 text-left">
        <Label htmlFor="admin-password">Password</Label>
        <Input
          id="admin-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

