import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Zresetuj hasło</CardTitle>
        <CardDescription>Podaj swój adres email, aby otrzymać link do zresetowania hasła.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="email@example.com" required />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch">
        <Button type="submit">Wyślij link</Button>
        <div className="mt-4 text-center text-sm">
          <a href="/login" className="underline">
            Wróć do logowania
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
