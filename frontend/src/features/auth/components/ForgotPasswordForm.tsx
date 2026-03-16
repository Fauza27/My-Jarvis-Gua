"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2, Mail, Send } from "lucide-react";
import { ForgotPasswordInput, forgotPasswordSchema } from "../validations/authSchema";
import { forgotPassword } from "../api/authApi";
import { mapServerError } from "../utils";

type FormState = "idle" | "loading" | "error" | "success";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setFormState("loading");
    setServerError(null);

    try {
      await forgotPassword(data.email);
      setFormState("success");
    } catch (error) {
      setFormState("error");
      const errorMessage = error instanceof Error ? mapServerError(error.message) : "An unexpected error occurred. Please try again.";
      setServerError(errorMessage);
      setFormState("idle");
    }
  };

  const isLoading = formState === "loading" || isSubmitting;
  const isSuccess = formState === "success";
  const isDisabled = isLoading || isSuccess;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 bg-card text-card-foreground">
      {serverError && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-3 p-4 rounded-lg
            bg-red-50 border border-red-200
            text-sm text-red-700
            animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
          <div className="space-y-1">
            <p className="font-medium">Request Failed</p>
            <p className="text-red-600">{serverError}</p>
          </div>
        </div>
      )}

      {isSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 p-4 rounded-lg
            bg-green-50 border border-green-200
            text-sm text-green-700
            animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 text-green-500" />
          <div className="space-y-1">
            <p className="font-medium">Email Sent!</p>
            <p className="text-green-600">We&apos;ve sent a password reset link to your email. Please check your inbox and follow the instructions.</p>
          </div>
        </div>
      )}

      {!isSuccess && (
        <>
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email Address
            </label>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
              <input
                {...register("email")}
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="email@gmail.com"
                disabled={isDisabled}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`
                  w-full h-11 pl-10 pr-3.5 rounded-lg border text-sm
                  text-foreground placeholder:text-muted-foreground
                  transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-offset-1
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${errors.email ? "border-red-400 bg-red-50 focus:ring-red-500 focus:border-red-400" : "border-input bg-background focus:ring-ring focus:border-primary"}
                `}
              />
            </div>

            {errors.email && (
              <p id="email-error" role="alert" className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isDisabled}
            className="
              relative w-full h-11 px-4 rounded-lg
              bg-primary hover:bg-primary/90 active:bg-primary/80
              text-primary-foreground text-sm font-semibold
              transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>Send Reset Link</span>
              </>
            )}
          </button>
        </>
      )}

      {isSuccess && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="
              relative w-full h-11 px-4 rounded-lg
              bg-primary hover:bg-primary/90 active:bg-primary/80
              text-primary-foreground text-sm font-semibold
              transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              flex items-center justify-center gap-2
            "
          >
            Back to Login
          </button>

          <button
            type="button"
            onClick={() => {
              setFormState("idle");
              setServerError(null);
            }}
            className="
              relative w-full h-11 px-4 rounded-lg
              border border-border bg-background
              text-foreground text-sm font-medium
              hover:bg-muted active:bg-muted/80
              transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
              flex items-center justify-center gap-2
            "
          >
            Send Another Email
          </button>
        </div>
      )}
    </form>
  );
}
