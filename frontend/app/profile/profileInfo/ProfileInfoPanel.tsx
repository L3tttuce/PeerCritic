"use client";

import { useEffect, useState } from "react";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AvatarDropDown, DEFAULT_AVATARS } from "@/components/ui/avatarDropDown";
import { AnimatePresence, motion } from "framer-motion";

import type { UserProfile } from "./types";
import { fetchCurrentUserProfile, updateUserProfile, generateRecoveryCode } from "./api";

/**
 * Responsibilities:
 * - Fetching current user's profile
 * - Managing profile form
 * - Submitting changes to backend
 */

export default function ProfileInfoPanel() {
  const [user, setUser] = useState<UserProfile | null>(null);

  // Editable form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string | null>(DEFAULT_AVATARS[0]);

  // UI state
  const [updated, setUpdated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [recoveryCode, setRecoveryCode] = useState("");
  const [generatingCode, setGeneratingCode] = useState(false);
  const [showSecurityPanel, setShowSecurityPanel] = useState(false);
  const [copied, setCopied] = useState(false);

  const [copySuccess, setCopySuccess] = useState("");

  async function load() {
    setLoading(true);
    try {
      const u = await fetchCurrentUserProfile();
      setUser(u);
      setFirstName(u.firstName ?? "");
      setLastName(u.lastName ?? "");
      setEmail(u.email ?? "");
      setAvatar(u.avatar ?? DEFAULT_AVATARS[0]);
      setUpdated(false);
    } catch (e) {
      console.error("Failed to load profile", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Profile update submission
  async function onUpdate(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const updatedUser = await updateUserProfile(user.userId, {
        firstName,
        lastName,
        email,
        avatar,
      });
      setUser(updatedUser);
      setUpdated(true);
    } catch (e) {
      console.error("Failed to update profile", e);
    } finally {
      setSaving(false);
    }
  }

  async function onGenerateRecoveryCode(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    const confirmed = window.confirm(
      "Generating a new recovery code will replace your old one. Continue?"
    );

    if (!confirmed) return;

    setGeneratingCode(true);

    try {
      const code = await generateRecoveryCode();
      setRecoveryCode(code);
    } catch (e) {
      console.error("Failed to generate recovery code", e);
    } finally {
      setGeneratingCode(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <FieldGroup>
        <FieldSet>
          <FieldGroup>
            {/*First Name*/}
            <Field>
              <FieldLabel htmlFor="firstname">First Name</FieldLabel>
              <Input
                id="firstname"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setUpdated(false);
                }}
                required
                disabled={loading}
              />
            </Field>

            {/*Last Name*/}
            <Field>
              <FieldLabel htmlFor="lastname">Last Name</FieldLabel>
              <Input
                id="lastname"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setUpdated(false);
                }}
                required
                disabled={loading}
              />
            </Field>

            {/*Email*/}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setUpdated(false);
                }}
                disabled={loading}
              />
            </Field>

            {/*Avatar Selection*/}
            <Field>
              <FieldLabel>Avatar</FieldLabel>
              <AvatarDropDown
                selected={avatar}
                setSelected={(v) => {
                  setAvatar(v);
                  setUpdated(false);
                }}
              />
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          {updated ? (
            <FieldLegend>
              <span className="text-red-500">Profile is updated!</span>
            </FieldLegend>
          ) : (
            <FieldLegend />
          )}
        </FieldSet>

        {/*Actions*/}
        <Field orientation="horizontal">
          <Button type="button" onClick={onUpdate} disabled={loading || saving}>
            {saving ? "Updating..." : "Update"}
          </Button>

          <Button variant="outline" type="button" disabled={loading} onClick={load}>
            Reset
          </Button>
        </Field>

        <FieldSet>
          <FieldLegend>Account Security</FieldLegend>

          {!showSecurityPanel ? (
            <div className="flex">
              <Button
                type="button"
                onClick={() => setShowSecurityPanel(true)}
                className="inline-flex w-fit max-w-fit self-start rounded-md border border-orange-200 bg-orange-100 px-4 py-2 text-black hover:bg-orange-200"
              >
                Manage
              </Button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-top-2 rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
              <p className="text-sm text-gray-600">
                Generate a recovery code to reset your password if you forget it.
                Generating a new code will replace your old one.
              </p>

              <div className="mt-4 flex gap-2">
                <Button
                  className="bg-orange-400 hover:bg-orange-800"
                  type="button"
                  onClick={onGenerateRecoveryCode}
                  disabled={loading || generatingCode}
                >
                  {generatingCode ? "Generating..." : "Generate Recovery Code"}
                </Button>

                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setShowSecurityPanel(false);
                    setRecoveryCode("");
                  }}
                >
                  Close
                </Button>
              </div>

              {recoveryCode && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 rounded-md border border-orange-400 bg-white p-4 text-center font-mono text-lg">

                  <div className="flex items-center justify-center gap-3">
                    <span>{recoveryCode}</span>

                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(recoveryCode);
                        setCopySuccess("Recovery code copied!");

                        setTimeout(() => {
                          setCopySuccess("");
                        }, 2500);
                      }}
                    >
                      Copy
                    </Button>
                  </div>

                  {copied && (
                    <div className="mt-2 text-sm text-green-600">
                      Copied!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </FieldSet>

      </FieldGroup>

      <AnimatePresence>
        {copySuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50 rounded-xl border border-green-200 bg-green-50 px-6 py-4 text-base font-semibold text-green-700 shadow-lg"
          >
            {copySuccess}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}