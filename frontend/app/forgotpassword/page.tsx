"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Page() {
  const [username, setUsername] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { push } = useRouter();

  async function resetPassword(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    setIsSubmitted(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (
      username.length <= 0 ||
      recoveryCode.length <= 0 ||
      newPassword.length < 6 ||
      newPassword !== confirmPassword
    ) {
      return;
    }

    try {
      await axios.post("http://localhost:8000/forgot-password", {
        username,
        recovery_code: recoveryCode,
        new_password: newPassword,
      });

      setSuccessMessage("Password reset successfully. You can now log in.");
    } catch (error) {
      console.error(error);
      setErrorMessage("Invalid username or recovery code.");
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card className="bg-orange-100">
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>
              Enter your recovery code and choose a new password.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  className="border-gray-300"
                  type="text"
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value);
                    setErrorMessage("");
                  }}
                  required
                />
                {isSubmitted && username.length <= 0 && (
                  <FieldError>Username is required!</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="recovery-code">Recovery Code</FieldLabel>
                <Input
                  id="recovery-code"
                  className="border-gray-300"
                  type="text"
                  value={recoveryCode}
                  onChange={e => {
                    setRecoveryCode(e.target.value);
                    setErrorMessage("");
                  }}
                  required
                />
                {isSubmitted && recoveryCode.length <= 0 && (
                  <FieldError>Recovery code is required!</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="new-password">New Password</FieldLabel>
                <Input
                  id="new-password"
                  className="border-gray-300"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
                {newPassword.length > 0 && newPassword.length < 6 ? (
                  <FieldError>Password must be at least 6 characters!</FieldError>
                ) : (
                  <FieldDescription>Must be at least 6 characters long.</FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="confirm-password">
                  Confirm New Password
                </FieldLabel>
                <Input
                  id="confirm-password"
                  className="border-gray-300"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
                {newPassword !== confirmPassword && confirmPassword.length > 0 ? (
                  <FieldError>Passwords don&apos;t match!</FieldError>
                ) : (
                  <FieldDescription>Please confirm your new password.</FieldDescription>
                )}
              </Field>

              {errorMessage && (
                <div className="animate-in fade-in slide-in-from-top-2 rounded-md border border-red-400 bg-red-100 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="animate-in fade-in slide-in-from-top-2 rounded-md border border-green-400 bg-green-100 px-4 py-3 text-sm text-green-700">
                  {successMessage}
                </div>
              )}

              <Field>
                <Button
                  className="bg-orange-400 hover:bg-orange-800"
                  type="button"
                  onClick={resetPassword}
                >
                  Reset Password
                </Button>

                {successMessage && (
                  <Button
                    className="bg-transparent border-orange-400"
                    variant="outline"
                    type="button"
                    onClick={() => push("/login")}
                  >
                    Go to Login
                  </Button>
                )}

                <FieldDescription className="text-center text-orange-400">
                  Remember your password?{" "}
                  <Link href="/login" className="font-bold">
                    Sign in
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}