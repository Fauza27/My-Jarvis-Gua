"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RegisterInput, registerSchema } from "../validations/authSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
    1: { label: "Very Weak", color: "bg-red-500" },
    2: { label: "Weak", color: "bg-orange-500" },
    3: { label: "Moderate", color: "bg-yellow-500" },
    4: { label: "Strong", color: "bg-green-500" },
    5: { label: "Very Strong", color: "bg-green-700" },
  };

  const config = strengthConfig[strength as keyof typeof strengthConfig];

  return (
    <div className="space-y-2 mt-2">
      {/* Bar kekuatan */}
      <div className="flex gap-1 items-center">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300
              ${strength >= level ? config.color : "bg-muted"}`}
          />
        ))}
        <span className={`text-xs ml-2 font-medium ${strength === 1 || strength === 2 ? "text-red-600" : strength === 3 ? "text-yellow-600" : strength >= 4 ? "text-green-600" : "text-muted-foreground"}`}>{config.label}</span>
      </div>

      {/* Checklist requirements */}
      <ul className="space-y-1">
        {requirements.map((req) => (
          <li key={req.label} className="flex items-center gap-1.5 text-xs">
            {req.met ? <Check className="w-3 h-3 text-green-500 shrink-0" /> : <X className="w-3 h-3 text-muted-foreground shrink-0" />}
            <span className={req.met ? "text-green-700" : "text-muted-foreground"}>{req.label}</span>
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
  const [isEmailSent, setIsEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
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

  const passwordValue = watch("password", "");

  const onSubmit = async (data: RegisterInput) => {
    setFormState("loading");
    setServerError(null);

    try {
      const response = await registerUser(data.email, data.password);
      setFormState("success");
      setIsEmailSent(true);
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
            bg-red-50 border border-red-200
            text-sm text-red-700
            animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
          <div className="space-y-1">
            <p className="font-medium">Registration Failed</p>
            <p className="text-red-600">{serverError}</p>
          </div>
        </div>
      )}

      {isSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 p-4 rounded-lg
            bg-green-50 border border-green-200
            text-sm text-green-700
            animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
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
              ${errors.password ? "border-red-400 bg-red-50 focus:ring-red-500 focus:border-red-400" : "border-input bg-background focus:ring-ring focus:border-primary"}
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
          <p id="password-error" role="alert" className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errors.password.message}
          </p>
        )}

        {/* Password Strength Indicator */}
        <div id="password-strength">
          <PasswordStrengthBar password={passwordValue} />
        </div>
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
              w-full h-11 pl-10 pr-3.5 rounded-lg border text-sm
              text-foreground placeholder:text-muted-foreground
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-offset-1
              disabled:opacity-50 disabled:cursor-not-allowed
              ${errors.confirmPassword ? "border-red-400 bg-red-50 focus:ring-red-500 focus:border-red-400" : "border-input bg-background focus:ring-ring focus:border-primary"}
            `}
          />
        </div>
        {errors.confirmPassword && (
          <p id="confirmPassword-error" role="alert" className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
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
