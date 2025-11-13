import { createSupabaseServerInstance } from "../db/supabase.client";
import { defineMiddleware } from "astro:middleware";

const PROTECTED_PATHS = ["/", "/dashboard", "/notes", "/entities"];
const PUBLIC_AUTH_PATHS = ["/login", "/register"];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    locals.user = {
      email: user.email,
      id: user.id,
    };

    // Redirect logged-in users from login/register pages
    if (PUBLIC_AUTH_PATHS.includes(url.pathname)) {
      return redirect("/");
    }
  } else {
    // Redirect unauthenticated users from protected pages
    if (
      PROTECTED_PATHS.some((path) => {
        if (path === "/") {
          return url.pathname === "/";
        }
        return url.pathname.startsWith(path);
      })
    ) {
      return redirect("/login");
    }
  }

  return next();
});
