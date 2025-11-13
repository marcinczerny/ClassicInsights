export function NavLinks({ currentPath }: { currentPath: string }) {
  const links = [
    { href: "/", label: "Notes" },
    { href: "/entities", label: "Entities" },
  ];

  return (
    <nav className="flex items-center gap-6">
      {links.map((link) => {
        const isActive = currentPath === link.href;

        return (
          <a
            key={link.href}
            href={link.href}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {link.label}
          </a>
        );
      })}
    </nav>
  );
}
