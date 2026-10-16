import { PropsWithChildren } from "react";

import { PrivateLayout } from "@/app/(private)/(dashboard)/PrivateLayout";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authoptions";
import { redirect } from "next/navigation";
import React from "react";
// legacy-email-login: remove with src/lib/auth/legacyEmailLogin
import { LegacyEmailLoginNotice } from "@/components/LegacyEmailLogin/LegacyEmailLoginNotice";

export const revalidate = 0;

export default async function Layout(props: PropsWithChildren) {
  const session = await getServerSession(authOptions);
  if (!session || !session?.user.id) {
    return redirect("/login");
  }

  return (
    <PrivateLayout>
      {/* legacy-email-login: remove with src/lib/auth/legacyEmailLogin */}
      <LegacyEmailLoginNotice />
      {props.children}
    </PrivateLayout>
  );
}
