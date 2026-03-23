import { Outlet } from "react-router";
import { AdminAuthProvider } from "../context/AdminAuthContext";

export function AdminAuthRoot() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  );
}
