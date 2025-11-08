import { useEffect } from "react";
import { BookOpen } from "lucide-react";
import { NavLinks } from "./NavLinks";
import { GraphControls } from "./GraphControls";
import { ThemeToggle } from "./ThemeToggle";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { $user } from "@/stores/app-store";

// Temporary user type for layout purposes
// Will be replaced with proper auth implementation later
interface User {
  email?: string;
  id: string;
}

interface TopNavigationBarProps {
  user: User | null;
  currentPath: string;
}

export function TopNavigationBar({ user, currentPath }: TopNavigationBarProps) {
  const isAuthenticated = user !== null;

  // Hydrate global state with user session on mount
  useEffect(() => {
    $user.set(user);
  }, [user]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 w-full items-center px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="font-bold text-base sm:text-lg">ClassicInsights</span>
          </a>
        </div>

        {/* Navigation Links - only for authenticated users */}
        {isAuthenticated && (
          <div className="ml-6 sm:ml-8 hidden sm:block">
            <NavLinks currentPath={currentPath} />
          </div>
        )}

        {/* Spacer - pushes right-side elements to the end */}
        <div className="flex-1" />

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Graph Controls - only for authenticated users */}
          {isAuthenticated && <GraphControls />}

          {/* Theme Toggle - always visible */}
          <ThemeToggle />

          {/* User Profile Dropdown - only for authenticated users */}
          {isAuthenticated && <UserProfileDropdown user={user} />}
        </div>
      </div>
    </header>
  );
}
