import { Link } from "react-router";
import { Film } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex h-16 items-center bg-primary/15 rounded-2xl">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md transition-colors hover:text-primary"
        >
          <Film className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Vaikifilm</span>
        </Link>
      </div>
    </header>
  );
}
