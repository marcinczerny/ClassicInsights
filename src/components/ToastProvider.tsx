/**
 * ToastProvider component
 *
 * Wrapper for Sonner Toaster to be used in Astro layouts
 */

import { Toaster } from "@/components/ui/sonner";

export function ToastProvider() {
  return <Toaster />;
}
