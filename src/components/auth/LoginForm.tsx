import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/lib/validation";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type FormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
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

    const validationResult = loginSchema.safeParse(formData);
    if (!validationResult.success) {
      setErrors(validationResult.error.issues);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Błąd logowania. Spróbuj ponownie.");
      }

      toast.success("Zalogowano pomyślnie!");
      window.location.href = "/";
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił nieznany błąd.";
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
        <CardTitle data-testid="login-header">Logowanie</CardTitle>
        <CardDescription>Zaloguj się na swoje konto, aby kontynuować.</CardDescription>
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
              data-testid="login-email-input"
            />
            {getErrorForField("email") && (
              <p className="text-sm text-red-500">{getErrorForField("email")}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Hasło</Label>
              <a href="/reset-password" className="text-sm underline">
                Zapomniałeś hasła?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
              data-testid="login-password-input"
            />
            {getErrorForField("password") && (
              <p className="text-sm text-red-500">{getErrorForField("password")}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch">
          <Button type="submit" disabled={isLoading} data-testid="login-submit-button">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zaloguj się
          </Button>
          <div className="mt-4 text-center text-sm">
            Nie masz jeszcze konta?{" "}
            <a href="/register" className="underline">
              Zarejestruj się
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
