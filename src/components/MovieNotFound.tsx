import { ArrowLeft, Film } from "lucide-react";
import { Link } from "react-router";


export function MovieNotFound() {
  return (
    <div className="flex flex-col items-center py-24 gap-3">
      <Film className="h-16 w-16" />
        <h1 className="text-2xl font-semibold">Movie Not Found</h1>
      <Link
        to="/"
        className="flex gap-2 text-primary hover:underline"
      >
        <ArrowLeft />
        Back to Movies
      </Link>
    </div>
  );
}

