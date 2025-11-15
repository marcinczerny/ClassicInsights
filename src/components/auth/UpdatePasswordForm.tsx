import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const UpdatePasswordSchema = z
  .object({
    password: z.string().min(8, { message: "Hasło musi mieć co najmniej 8 znaków." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być takie same.",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof UpdatePasswordSchema>;

export function UpdatePasswordForm() {
  const [formData, setFormData] = useState<Partial<FormData>>({});
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

    const validationResult = UpdatePasswordSchema.safeParse(formData);
    if (!validationResult.success) {
      setErrors(validationResult.error.issues);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: validationResult.data.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nie udało się zaktualizować hasła. Spróbuj ponownie.");
      }

      toast.success("Hasło zostało pomyślnie zaktualizowane!");
      window.location.href = "/login";
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
        <CardTitle>Ustaw nowe hasło</CardTitle>
        <CardDescription>
          Wprowadź swoje nowe hasło. Po zatwierdzeniu zostaniesz przekierowany do strony logowania.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nowe hasło</Label>
            <Input
              id="password"
              type="password"
              required
              onChange={handleInputChange}
              disabled={isLoading}
            />
            {getErrorForField("password") && (
              <p className="text-sm text-red-500">{getErrorForField("password")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Powtórz nowe hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              onChange={handleInputChange}
              disabled={isLoading}
            />
            {getErrorForField("confirmPassword") && (
              <p className="text-sm text-red-500">{getErrorForField("confirmPassword")}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zapisz nowe hasło
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
