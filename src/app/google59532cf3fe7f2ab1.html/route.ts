export const dynamic = "force-static";

export async function GET() {
  return new Response("google-site-verification: google59532cf3fe7f2ab1.html", {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
