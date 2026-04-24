"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RegisterInput, registerSchema } from "../validations/authSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { register as registerUser } from "../api/authApi";
import { mapServerError } from "../utils";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, UserPlus, Mail, Lock, Check, X } from "lucide-react";

type FormState = "idle" | "loading" | "error" | "success";

function getPasswordRequirements(password: string) {
  return [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "At least one uppercase letter", met: /[A-Z]/.test(password) },
    { label: "At least one lowercase letter", met: /[a-z]/.test(password) },
    { label: "At least one number", met: /\d/.test(password) },
    { label: "At least one special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
}

function getPasswordStrength(password: string): number {
  if (!password) return 0;
  const requirements = getPasswordRequirements(password);
  return requirements.filter((r) => r.met).length;
}

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  const requirements = getPasswordRequirements(password);

  if (!password) return null;

  const strengthConfig = {
    0: { label: "", color: "" },
    1: { label: "Very Weak", color: "bg-destructive" },
    2: { label: "Weak", color: "bg-warning/80" },
    3: { label: "Moderate", color: "bg-warning" },
    4: { label: "Strong", color: "bg-success/80" },
    5: { label: "Very Strong", color: "bg-success" },
  };

  const config = strengthConfig[strength as keyof typeof strengthConfig];

  return (
    <div className="space-y-1 mt-1">
      {/* Bar kekuatan */}
      <div className="flex gap-1 items-center">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-0.5 flex-1 rounded-full transition-colors duration-300
              ${strength >= level ? config.color : "bg-muted"}`}
          />
        ))}
        <span className={`text-[10px] ml-1.5 font-medium ${strength === 1 ? "text-destructive" : strength === 2 || strength === 3 ? "text-warning" : strength >= 4 ? "text-success" : "text-muted-foreground"}`}>{config.label}</span>
      </div>

      {/* Checklist requirements - ultra compact */}
      <ul className="space-y-0">
        {requirements.map((req) => (
          <li key={req.label} className="flex items-center gap-1 text-[10px]">
            {req.met ? <Check className="w-2.5 h-2.5 text-success shrink-0" /> : <X className="w-2.5 h-2.5 text-muted-foreground shrink-0" />}
            <span className={req.met ? "text-success" : "text-muted-foreground"}>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formState, setFormState] = useState<FormState>("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = useWatch({
    control,
    name: "password",
    defaultValue: "",
  });

  const onSubmit = async (data: RegisterInput) => {
    setFormState("loading");
    setServerError(null);

    try {
      await registerUser(data.email, data.password);
      setFormState("success");
      await new Promise((resolve) => setTimeout(resolve, 800));
      router.push("/login");
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
            bg-destructive/10 border border-destructive/20
            text-sm text-destructive
            animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
          <div className="space-y-1">
            <p className="font-medium">Registration Failed</p>
            <p className="text-destructive/90">{serverError}</p>
          </div>
        </div>
      )}

      {isSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 p-4 rounded-lg
            bg-success/10 border border-success/20
            text-sm text-success
            animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />
          <p>Registration successful! Redirecting to login...</p>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email
        </label>

        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <input
            {...register("email")}
            id="email"
            type="email"
            autoComplete="email"
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
              ${errors.email ? "border-destructive bg-destructive/5 focus:ring-destructive focus:border-destructive" : "border-input bg-background focus:ring-ring focus:border-primary"}
            `}
          />
        </div>

        {errors.email && (
          <p id="email-error" role="alert" className="flex items-center gap-1.5 text-xs text-destructive mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <input
            {...register("password")}
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create a strong password"
            disabled={isDisabled}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : "password-strength"}
            className={`
              w-full h-11 pl-10 pr-11 rounded-lg border text-sm
              text-foreground placeholder:text-muted-foreground
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-offset-1
              disabled:opacity-50 disabled:cursor-not-allowed
              ${errors.password ? "border-destructive bg-destructive/5 focus:ring-destructive focus:border-destructive" : "border-input bg-background focus:ring-ring focus:border-primary"}
            `}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isDisabled}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="
              absolute right-3 top-1/2 -translate-y-1/2
              p-1 rounded text-foreground
              hover:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
              disabled:opacity-50
              transition-colors duration-150
            "
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {errors.password && (
          <p id="password-error" role="alert" className="flex items-center gap-1.5 text-xs text-destructive mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errors.password.message}
          </p>
        )}

        {/* Password Strength Indicator - Compact version */}
        {!errors.password && passwordValue && (
          <div id="password-strength" className="pt-1">
            <PasswordStrengthBar password={passwordValue} />
          </div>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <input
            {...register("confirmPassword")}
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Confirm your password"
            disabled={isDisabled}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
            className={`
              w-full h-11 pl-10 pr-11 rounded-lg border text-sm
              text-foreground placeholder:text-muted-foreground
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-offset-1
              disabled:opacity-50 disabled:cursor-not-allowed
              ${errors.confirmPassword ? "border-destructive bg-destructive/5 focus:ring-destructive focus:border-destructive" : "border-input bg-background focus:ring-ring focus:border-primary"}
            `}
          />
        </div>
        {errors.confirmPassword && (
          <p id="confirmPassword-error" role="alert" className="flex items-center gap-1.5 text-xs text-destructive mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
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
            <span>Creating Account...</span>
          </>
        ) : isSuccess ? (
          <>
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            <span>Success!</span>
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            <span>Create Account</span>
          </>
        )}
      </button>
    </form>
  );
}
