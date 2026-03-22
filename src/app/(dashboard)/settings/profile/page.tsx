"use client";

import LoadingScreen from "@/components/LoadingScreen";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useUser, useClerk } from "@clerk/nextjs";
import { toast } from "@/lib/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { useEdgeConfig } from "@/providers/EdgeConfigProvider";

const formSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: "First name is required" })
    .max(20, { message: "First name must be less than 20 characters" }),
  lastName: z
    .string()
    .min(1, { message: "Last name is required" })
    .max(20, { message: "Last name must be less than 20 characters" }),
  email: z.email({ message: "Invalid email address" }),
});

type FormSchema = z.infer<typeof formSchema>;
export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const enableAccountDeletion = useEdgeConfig<boolean>(
    `accountDeletion_${process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "development"}`,
    false,
  );

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  useEffect(() => {
    if (isLoaded && user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
      });
    }
  }, [isLoaded, user, form]);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Failed to delete account");
      }
      await signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  const onSubmit = async (data: FormSchema) => {
    if (!user) return;

    try {
      await user.update({
        firstName: data.firstName,
        lastName: data.lastName,
      });
      toast.success("Profile has been updated successfully.");
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
      console.error(error);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
      <div className="space-y-6">
        {/* Page Title */}
        <div className="space-y-1">
          <h1 className="text-xl font-medium tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Update your profile information and preferences.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="profile-first-name">Name</FieldLabel>
                <Input
                  id="profile-first-name"
                  placeholder="John"
                  type="text"
                  {...form.register("firstName")}
                />
                {form.formState.errors.firstName && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="profile-last-name">Last Name</FieldLabel>
                <Input
                  id="profile-last-name"
                  placeholder="Doe"
                  type="text"
                  {...form.register("lastName")}
                />
                {form.formState.errors.lastName && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="profile-email">Email</FieldLabel>
                <Input
                  id="profile-email"
                  disabled
                  placeholder="email@example.com"
                  type="email"
                  {...form.register("email")}
                />
                <FieldDescription>
                  We&apos;ll use this email for account notifications.
                </FieldDescription>
                {form.formState.errors.email && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </Field>
            </FieldGroup>
          </FieldSet>
          <Field orientation="horizontal">
            <Button
              variant="default"
              type="submit"
              size="sm"
              className="cursor-pointer"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Saving..." : "Save"}
            </Button>
          </Field>
        </FieldGroup>
      </form>

        {enableAccountDeletion && (
          <>
            <div className="border border-destructive rounded-md bg-destructive/5 p-4 space-y-3">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-destructive">
                  Delete your account
                </h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete account
              </Button>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to permanently delete your account? All your data and subscriptions will be removed. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  );

  /*   return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl mx-auto lg:mx-0">
        <UserProfile
          routing="hash"
          appearance={{
            variables: {
              colorPrimary: "var(--primary)",
              borderRadius: "0px",
              colorBorder: "transparent",
              colorShadow: "none",
              colorBackground: "var(--background)",
              colorText: "var(--foreground)",
            },
            elements: {
              rootBox: {
                width: "100%",
                maxWidth: "100%",
              },
              card: {
                width: "100%",
                maxWidth: "100%",
                boxShadow: "none",
              },
              navbar: {
                display: "none",
              },
              footer: {
                display: "none",
              },
              footerAction: {
                display: "none",
              },
              pageScrollBox: {
                padding: "0",
              },
              formFieldInput: {
                borderRadius: "8px",
                fontSize: "16px", // Prevents iOS zoom
              },
              button: {
                borderRadius: "8px",
              },
              buttonPrimary: {
                borderRadius: "8px",
              },
              buttonSecondary: {
                borderRadius: "8px",
              },
            },
          }}
        />
      </div>
    </div>
  ); */
}
