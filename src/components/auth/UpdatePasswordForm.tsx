import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UpdatePasswordForm() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Ustaw nowe hasło</CardTitle>
        <CardDescription>
          Wprowadź swoje nowe hasło. Po zatwierdzeniu zostaniesz przekierowany do strony logowania.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nowe hasło</Label>
          <Input id="password" type="password" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Powtórz nowe hasło</Label>
          <Input id="confirmPassword" type="password" required />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch">
        <Button type="submit">Zapisz nowe hasło</Button>
      </CardFooter>
    </Card>
  );
}
