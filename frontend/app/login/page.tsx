"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from "next/link";

// Export the default page component
export default function Page() {
  // Create useState 
  const [username, setUsername] = useState("");  // State variable for storing the username input value, start at an empty string
  const [password, setPassword] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false); // State variable to track if the form is submitted.

  // Destructure the push function from useRouter to allow navigating to other pages
  const { push } = useRouter();
  const searchParams = useSearchParams();

  const [errorMessage, setErrorMessage] = useState("");

  const rawNext = searchParams.get("next");
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/";

  // The login function runs when the login button is clicked
  async function login(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();   // prevent the default browser behavior on button click
    setIsSubmitted(true);
    setErrorMessage("");

    if (username.length <= 0 || password.length <= 0) {
      return;
    }

    try {
      //Send a POST request to the local backend login endpoint with username and password
      const response = await axios.post("http://localhost:8000/login", new URLSearchParams({
        username,
        password,
      }));

      // Log the server response data to the browser console for debugging
      console.log(response.data);
      // Store the access token in localStorage
      localStorage.setItem("accessToken", response.data.access_token);
      localStorage.setItem("refreshToken", response.data.refresh_token);
      // Navigate the user to the home page when successful login
      push(next);
    } catch (error) {
      console.error(error);
      setErrorMessage("Incorrect username or password.");
    }
  }


  // Return or render block to define the login page UI
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="bg-orange-100">
            <CardHeader>
              <CardTitle>Login to your account</CardTitle>
              <CardDescription>
                Enter username and password to login
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                {/* Username field*/}
                <Field>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input id="username"
                    className="border-gray-300"
                    type="username"
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value);
                      setErrorMessage("");
                    }}
                    required
                  />
                  {isSubmitted && username.length <= 0 && (<FieldError>Username is required!</FieldError>)}
                </Field>

                {/* Password field*/}
                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Link
                      href="/forgotpassword"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline text-orange-400 font-bold"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <Input id="password"
                    className="border-gray-300"
                    type="password"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      setErrorMessage("");
                    }}
                    required
                  />
                  {isSubmitted && password.length <= 0 && (<FieldError>Password is required!</FieldError>)}
                  {errorMessage && (
                    <div className="animate-in fade-in slide-in-from-top-2 rounded-md border border-red-400 bg-red-100 px-4 py-3 text-sm text-red-700">
                      {errorMessage}
                    </div>
                  )}
                </Field>

                {/* Action field contains the submit and cancel buttons and signup link*/}
                <Field>
                  <Button className="bg-orange-400 hover:bg-orange-800" type="button" onClick={login}>Login</Button>
                  <Button
                    className="bg-transparent border-orange-400"
                    variant="outline"
                    type="button"
                    onClick={() => push(next)}
                  >
                    Cancel
                  </Button>
                  <FieldDescription className="text-center text-orange-400">
                    Don&apos;t have an account? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-bold">
                      Sign up
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
