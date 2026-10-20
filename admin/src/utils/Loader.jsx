import { BrandLoader } from "../components/ui/Feedback";

/** Full-screen "checking session" loader. */
const Loader = () => (
  <div className="grid min-h-dvh place-items-center bg-canvas">
    <div className="text-center">
      <BrandLoader className="min-h-0" />
      <p className="mt-4 text-sm text-fg-subtle">Checking authentication…</p>
    </div>
  </div>
);
export default Loader;
