import React, { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ResetPasswordDTO } from "@/types";

const ResetPasswordSchema = z.object({
  email: z.string().email({ message: "Proszę podać prawidłowy adres e-mail." }),
});

const ResetPasswordForm = () => {
  const [formData, setFormData] = useState<ResetPasswordDTO>({ email: "" });
  const [errors, setErrors] = useState<z.ZodIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);

    const validationResult = ResetPasswordSchema.safeParse(formData);
    if (!validationResult.success) {
      setErrors(validationResult.error.issues);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.");
      }

      toast.success(data.message || "Link do resetowania hasła został wysłany.");
      setFormData({ email: "" }); // Reset form
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił nieznany błąd.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorForField = (field: keyof ResetPasswordDTO) => {
    return errors.find((error) => error.path[0] === field)?.message;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">Reset Your Password</CardTitle>
        <CardDescription className="mt-2">
          Enter your email and we'll send you a link to get back into your account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              required
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            {getErrorForField("email") && <p className="text-sm text-red-500">{getErrorForField("email")}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Wyślij link
          </Button>
          <div className="mt-4 text-center text-sm">
            <a href="/login" className="underline">
              Wróć do logowania
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ResetPasswordForm;
