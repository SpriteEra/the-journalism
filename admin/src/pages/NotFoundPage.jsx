import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { buttonStyles } from "../components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas p-6 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary-soft text-primary"><Compass className="size-8" /></span>
        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-accent">Error 404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg">This page doesn't exist</h1>
        <p className="mt-2 text-fg-subtle">The link may be old, or you may not have access to it.</p>
        <Link to="/dashboard" className={`${buttonStyles({ size: "lg" })} mt-8`}>Back to dashboard</Link>
      </div>
    </div>
  );
}
