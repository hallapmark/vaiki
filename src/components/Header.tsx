import { Link } from "react-router";
import { Film } from "lucide-react";

export function Header() {
  return (
    <header className="top-0 z-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex h-16 items-center">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        >
          <Film className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Retro films</span>
        </Link>
      </div>
    </header>
  );
}
