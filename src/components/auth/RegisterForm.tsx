import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema } from "@/lib/validation";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type FormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    aiConsent: false,
  });
  const [errors, setErrors] = useState<z.ZodIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, aiConsent: checked }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);

    const validationResult = registerSchema.safeParse(formData);
    if (!validationResult.success) {
      setErrors(validationResult.error.issues);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Błąd rejestracji. Spróbuj ponownie.');
      }

      const { message, session } = await response.json();
      toast.success(message);

      // If user is automatically logged in (no email confirmation required)
      if (session) {
        window.location.href = '/';
      } else {
        // If email confirmation is required, redirect to login page
        window.location.href = '/login';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Wystąpił nieznany błąd.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorForField = (field: keyof FormData) => {
    return errors.find((error) => error.path[0] === field)?.message;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Rejestracja</CardTitle>
        <CardDescription>
          Załóż nowe konto, aby zacząć korzystać z aplikacji.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
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
            {getErrorForField('email') && (
              <p className="text-sm text-red-500">{getErrorForField('email')}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            {getErrorForField('password') && (
              <p className="text-sm text-red-500">{getErrorForField('password')}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Powtórz hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            {getErrorForField('confirmPassword') && (
              <p className="text-sm text-red-500">{getErrorForField('confirmPassword')}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="aiConsent"
              checked={formData.aiConsent}
              onCheckedChange={handleCheckboxChange}
              disabled={isLoading}
            />
            <Label htmlFor="aiConsent" className="text-sm font-normal">
              Wyrażam zgodę na analizę moich notatek przez AI.
            </Label>
          </div>
          {getErrorForField('aiConsent') && (
            <p className="text-sm text-red-500">{getErrorForField('aiConsent')}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zarejestruj się
          </Button>
          <div className="mt-4 text-center text-sm">
            Masz już konto?{" "}
            <a href="/login" className="underline">
              Zaloguj się
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
