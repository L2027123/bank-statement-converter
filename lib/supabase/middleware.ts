import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const isDemo =
    request.nextUrl.searchParams.get("demo") === "true" ||
    request.cookies.get("demo_mode")?.value === "true";

  const { pathname } = request.nextUrl;
  const isProtected =
    pathname.startsWith("/upload") || pathname.startsWith("/dashboard");

  if (isDemo && isProtected) {
    supabaseResponse = NextResponse.next({ request });
    supabaseResponse.cookies.set("demo_mode", "true");
    supabaseResponse.headers.set("x-demo-user-id", DEMO_USER_ID);
    return supabaseResponse;
  }

  if (!isDemo && request.cookies.get("demo_mode")?.value === "true" && !isProtected) {
    supabaseResponse.cookies.delete("demo_mode");
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export { DEMO_USER_ID };
