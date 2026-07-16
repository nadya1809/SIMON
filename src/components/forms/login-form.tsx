"use client";

import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/ui/section-card";
import { normalizeCallbackPath } from "@/lib/auth-callback";
import {
  EMAIL_FORMAT_MESSAGE,
  emailPattern
} from "@/lib/input-rules";

type LoginFormProps = {
  callbackUrl: string;
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!emailPattern.test(normalizedEmail)) {
      setEmailError(EMAIL_FORMAT_MESSAGE);
      setError("");
      return;
    }

    setIsLoading(true);
    setError("");
    setEmailError("");

    const safeCallbackUrl = normalizeCallbackPath(callbackUrl, "/dashboard");
    const absoluteCallbackUrl = new URL(
      safeCallbackUrl,
      window.location.origin
    ).toString();
    const result = await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false,
      callbackUrl: absoluteCallbackUrl
    });

    if (result?.error) {
      setIsLoading(false);
      setError("Email atau password tidak valid, atau akun sedang nonaktif.");
      return;
    }

    if (result?.url) {
      window.location.assign(normalizeCallbackPath(result.url, safeCallbackUrl));
      return;
    }

    window.location.assign(safeCallbackUrl);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <FormField label="Email" error={emailError}>
        <Input
          type="text"
          value={email}
          onChange={(event) => {
            const nextValue = event.target.value;
            setEmail(nextValue);
            if (!nextValue || emailPattern.test(nextValue.trim().toLowerCase())) {
              setEmailError("");
            }
          }}
          placeholder="admin@simon.local"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={120}
          required
        />
      </FormField>

      <FormField label="Password">
        <div className="relative">
          <Input
            type={isPasswordVisible ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Masukkan password"
            minLength={8}
            maxLength={100}
            className="pr-12"
            required
          />
          <button
            type="button"
            aria-label={
              isPasswordVisible ? "Sembunyikan password" : "Tampilkan password"
            }
            title={
              isPasswordVisible ? "Sembunyikan password" : "Tampilkan password"
            }
            onClick={() => setIsPasswordVisible((current) => !current)}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[var(--radius-control)] text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--accent)]"
          >
            <FontAwesomeIcon
              icon={isPasswordVisible ? faEyeSlash : faEye}
              className="h-4 w-4"
            />
          </button>
        </div>
      </FormField>

      {error ? (
        <SectionCard className="border-[color:var(--danger-bg)] bg-[linear-gradient(180deg,var(--danger-bg),var(--card))] px-4 py-3 shadow-none">
          <p className="text-sm text-[var(--danger-fg)]">{error}</p>
        </SectionCard>
      ) : null}

      <Button
        className="w-full"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? "Sedang masuk..." : "Masuk"}
      </Button>
    </form>
  );
}
