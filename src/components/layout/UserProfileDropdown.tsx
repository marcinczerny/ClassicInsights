import { LogOut, UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// Temporary user type for layout purposes
// Will be replaced with proper auth implementation later
interface User {
  email?: string;
  id: string;
}

interface UserProfileDropdownProps {
  user: User;
}

export function UserProfileDropdown({ user }: UserProfileDropdownProps) {
  // Get user initials from email
  const getInitials = (email?: string): string => {
    if (!email) {
      return "U";
    }

    const parts = email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    return email.substring(0, 2).toUpperCase();
  };

  // Placeholder for sign out - will be implemented with proper auth later
  const handleSignOut = () => {
    console.log("Sign out clicked - auth implementation pending");
    // TODO: Implement actual sign out logic
    // window.location.href = "/sign-in";
  };

  // Placeholder for profile navigation
  const handleProfileClick = () => {
    console.log("Profile clicked - navigation pending");
    // TODO: Implement actual profile navigation
    // window.location.href = "/profile";
  };

  const initials = getInitials(user.email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-full"
          aria-label="Menu użytkownika"
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-sm font-medium">{initials}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-xs font-medium">{initials}</span>
          </div>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.email}</p>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Profil</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Wyloguj się</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
