"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { AvatarDropDown, DEFAULT_AVATARS } from "@/components/ui/avatarDropDown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";
import Link from "next/link";

// Default export - the main component rendered at the /signup route
export default function Page() {
  // Create useState
  const [firstName, setFirstName] = useState("");     //stores the value typed into the first name input field, starts as empty string
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);    //tracks if the user clicks create account at least once
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const [usernameError, setUsernameError] = useState("");

  const [recoveryCode, setRecoveryCode] = useState("");

  // avatars
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(DEFAULT_AVATARS[0]);

  // Destructure push from the Next.js router to automatically navigate to  a new page
  const { push } = useRouter();

  const searchParams = useSearchParams();

  const rawNext = searchParams.get("next");
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/";

  // Signup function runs when the Create Account button is clicked
  async function signup(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    if (isCreatingAccount) return;
    // activates validation error visibility across all fields
    setIsSubmitted(true);

    setUsernameError("");

    // Validate passwords 
    if (password !== confirmPassword || password.length < 6) {
      return;
    }

    try {
      setIsCreatingAccount(true);
      // Send a POST request to the backend /signup endpoint with all form data as a JSON body
      const response = await axios.post("http://localhost:8000/signup", {
        username,
        password,
        firstName,
        lastName,
        avatar: selectedAvatar,
      });
      // Save the access token returned by the server into localStorage.
      localStorage.setItem("accessToken", response.data.access_token);

      localStorage.setItem("refreshToken", response.data.refresh_token);
      // Navigate the user to the home page after successful signup
      setRecoveryCode(response.data.recovery_code);
    } catch (error: any) {
      console.error(error);

      if (error.response?.status === 400) {
        setUsernameError("Username already taken.");
      } else {
        setUsernameError("Something went wrong. Try again.");
      }
    } finally {
      setIsCreatingAccount(false);
    }
  }


  if (recoveryCode) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card className="bg-orange-100">
            <CardHeader>
              <CardTitle>Save your recovery code</CardTitle>
              <CardDescription>
                You will need this code if you forget your password. Save it somewhere safe.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-orange-400 bg-white p-4 text-center font-mono text-lg">
                {recoveryCode}
              </div>

              <Button
                className="mt-6 w-full bg-orange-400 hover:bg-orange-800"
                type="button"
                onClick={() => push(next)}
              >
                I saved my code
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Return or render block to define the signup page UI
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card className="bg-orange-100">
          <CardHeader>
            <CardTitle>Create an account</CardTitle>
            <CardDescription>
              Enter your information below to create your account. You do not have to put your legal name.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {/* First name field */}
              <Field>
                <FieldLabel htmlFor="name">First Name</FieldLabel>
                <Input id="name"
                  className="border-gray-300"
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                />
                {/* Show the error message only if the user attempt to submit and the field is empty */}
                {isSubmitted && firstName.length <= 0 && (<FieldError>First name is required!</FieldError>)}
              </Field>

              {/* Last name field */}
              <Field>
                <FieldLabel htmlFor="name">Last Name</FieldLabel>
                <Input id="name"
                  className="border-gray-300"
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                />
                {/* Show error only after first submission attempt if the field is still empty */}
                {isSubmitted && lastName.length <= 0 && (<FieldError>Last name is required!</FieldError>)}
              </Field>

              {/* Username field */}
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  className="border-gray-300"
                  type="text"
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value);
                    setUsernameError("");
                  }}
                  required
                />
                {/* Show error only after first submission attempt if the field is still empty */}
                {isSubmitted && username.length <= 0 && (<FieldError>Username is required!</FieldError>)}

                {usernameError && (
                  <div className="animate-in fade-in slide-in-from-top-2 mt-2 rounded-md border border-red-400 bg-red-100 px-4 py-2 text-sm text-red-700">
                    {usernameError}
                  </div>
                )}
              </Field>

              {/* Password field */}
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input id="password"
                  className="border-gray-300"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                {/* Live validation: if password has less than 6 characters, show error. Otherwise, show a hint */}
                {password.length > 0 && password.length < 6
                  ? (<FieldError>Password must be at least 6 characters!</FieldError>)
                  : (<FieldDescription>Must be at least 6 characters long.</FieldDescription>)
                }
              </Field>

              {/* Confirm password field */}
              <Field>
                <FieldLabel htmlFor="confirm-password">
                  Confirm Password
                </FieldLabel>
                <Input id="confirm-password"
                  className="border-gray-300"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
                {/* Live validation: if the 2 password don't match and the field is not empty, show the error. Otherwise, show a hint */}
                {password !== confirmPassword && confirmPassword.length > 0
                  ? (<FieldError>Passwords don&apos;t match!</FieldError>)
                  : (<FieldDescription>Please confirm your password.</FieldDescription>)
                }
              </Field>

              {/* Avatar field */}
              <Field>
                <FieldLabel>Avatar</FieldLabel>
                <AvatarDropDown selected={selectedAvatar} setSelected={setSelectedAvatar} />
              </Field>

              {/* Profile preview */}
              <section className="rounded-xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <div className="h-24 w-24 overflow-hidden rounded-full border border-orange-300 bg-orange-100">
                    {selectedAvatar ? (
                      <Image
                        src={selectedAvatar}
                        alt="Selected avatar"
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-700">
                        {(username || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <h2 className="mt-4 text-xl font-bold text-gray-900">
                    {firstName || lastName
                      ? `${firstName} ${lastName}`.trim()
                      : "Your Name"}
                  </h2>

                  <div className="mt-1 text-gray-600">
                    @{username || "username"}
                  </div>
                </div>
              </section>

              {/* Action buttons */}
              <FieldGroup>
                <Field>
                  <Button
                    className="bg-orange-400 hover:bg-orange-800 disabled:opacity-60"
                    type="button"
                    onClick={e => signup(e)}
                    disabled={isCreatingAccount}
                  >
                    {isCreatingAccount ? "Creating account..." : "Create Account"}
                  </Button>
                  <Button
                    className="bg-transparent border-orange-400"
                    variant="outline"
                    type="button"
                    onClick={() => push(next)}
                  >
                    Cancel
                  </Button>
                  <FieldDescription className="px-6 text-center text-orange-400">
                    Already have an account?{" "}
                    <Link
                      className="font-bold"
                      href={`/login?next=${encodeURIComponent(next)}`}
                    >
                      Sign in
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
