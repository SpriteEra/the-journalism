import { useEffect } from "react";
import toast from "react-hot-toast";
import { Navigate, useLocation } from "react-router-dom";
import usePermission from "../hooks/usePermission";

/**
 * <ProtectedRoute component={Page} />                      logged-in users
 * <ProtectedRoute component={Page} permission="news.view.all" />     needs that permission (string, or array = any of them)
 * <ProtectedRoute component={Page} isAdmin />               legacy: super admin only
 */
const ProtectedRoute = ({ component: Component, isAdmin = false, permission, ...rest }) => {
  const { user, isSuper, canAny } = usePermission();
  const location = useLocation();

  const allowed = !user ? false : isAdmin ? isSuper : permission ? canAny(Array.isArray(permission) ? permission : [permission]) : true;

  useEffect(() => {
    if (!user) toast.error("Please login to access this page", { id: "auth" });
    else if (!allowed) toast.error("You are not authorized to access this page", { id: "auth" });
  }, [user, allowed]);

  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (!allowed) return <Navigate to="/dashboard" replace />;
  return <Component {...rest} />;
};

export default ProtectedRoute;
