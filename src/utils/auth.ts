// utils/auth.ts

import { toast } from "react-toastify";

/**
 * Clears localStorage tokens and optionally notifies user and redirects.
 */
export const logoutUser = (message?: string, redirectPath: string = "/") => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");

  if (message) {
    toast.warning(message);
  }

  window.location.href = redirectPath;
};
