import { PropsWithChildren } from "react";

import { PrivateLayout } from "@/app/(private)/(dashboard)/PrivateLayout";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authoptions";
import { redirect } from "next/navigation";
import React from "react";

export const revalidate = 0;

export default async function Layout(props: PropsWithChildren) {
  const session = await getServerSession(authOptions);
  if (!session || !session?.user.id) {
    return redirect("/login");
  }

  return <PrivateLayout>{props.children}</PrivateLayout>;
}
