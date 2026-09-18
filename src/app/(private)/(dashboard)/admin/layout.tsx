import { redirect } from "next/navigation";

import { getAuthSubject } from "@/lib/authorization/subject";

/** Defense en profondeur : le nav masque deja ces pages aux non-admins. */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const subject = await getAuthSubject();
  if (!subject) redirect("/login");
  if (!subject.isAdmin) redirect("/dashboard");
  return <>{children}</>;
}
