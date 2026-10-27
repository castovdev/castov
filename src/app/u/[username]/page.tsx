import { redirect } from "next/navigation";

interface ShortProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ShortProfilePage({ params }: ShortProfilePageProps) {
  const { username } = await params;
  redirect(`/user/${username}`);
}
