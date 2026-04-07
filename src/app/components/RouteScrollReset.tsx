import { useEffect } from "react";
import { useLocation } from "react-router";

export function RouteScrollReset() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  return null;
}
