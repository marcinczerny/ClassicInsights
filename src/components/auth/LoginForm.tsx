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

export function LoginForm() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Logowanie</CardTitle>
        <CardDescription>
          Zaloguj się na swoje konto, aby kontynuować.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="email@example.com" required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Hasło</Label>
            <a href="/reset-password" className="text-sm underline">
              Zapomniałeś hasła?
            </a>
          </div>
          <Input id="password" type="password" required />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch">
        <Button type="submit">Zaloguj się</Button>
        <div className="mt-4 text-center text-sm">
          Nie masz jeszcze konta?{" "}
          <a href="/register" className="underline">
            Zarejestruj się
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
