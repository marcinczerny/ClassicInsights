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

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [aiConsent, setAiConsent] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const doPasswordsMatch = password === confirmPassword;
    setPasswordsMatch(doPasswordsMatch);

    const isEmailValid = email.trim() !== "";
    const arePasswordsValid = password.trim() !== "" && confirmPassword.trim() !== "" && doPasswordsMatch;
    
    setIsFormValid(isEmailValid && arePasswordsValid && aiConsent);
  }, [email, password, confirmPassword, aiConsent]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Rejestracja</CardTitle>
        <CardDescription>
          Załóż nowe konto, aby zacząć korzystać z aplikacji.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="email@example.com" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Hasło</Label>
          <Input 
            id="password" 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Powtórz hasło</Label>
          <Input 
            id="confirmPassword" 
            type="password" 
            required 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={!passwordsMatch ? "border-destructive" : ""}
          />
          {!passwordsMatch && (
            <p className="text-sm text-destructive">Hasła nie są takie same.</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="aiConsent"
            checked={aiConsent}
            onCheckedChange={(checked) => setAiConsent(checked as boolean)}
          />
          <Label htmlFor="aiConsent" className="text-sm font-normal">
            Wyrażam zgodę na analizę moich notatek przez AI.
          </Label>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch">
        <Button type="submit" disabled={!isFormValid}>Zarejestruj się</Button>
        <div className="mt-4 text-center text-sm">
          Masz już konto?{" "}
          <a href="/login" className="underline">
            Zaloguj się
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
