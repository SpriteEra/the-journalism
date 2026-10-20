import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import usePermission from "../hooks/usePermission";
import { BrandLoader } from "../components/ui/Feedback";

/** "/" → the dashboard when signed in, the login page otherwise. */
const Home = () => {
  const { user } = useSelector((s) => s.user);
  const { can } = usePermission();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
    else navigate(can("analytics.view") ? "/dashboard" : "/dashboard/news", { replace: true });
  }, [user, navigate, can]);
  return <div className="grid min-h-dvh place-items-center bg-canvas"><BrandLoader /></div>;
};

export default Home;
