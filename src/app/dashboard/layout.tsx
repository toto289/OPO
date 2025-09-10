
"use client";

import * as React from "react";
import Header from "@/components/layout/header";
import BottomNav from "@/components/bottom-nav";
import SideNav from "@/components/layout/sidenav";
import { getUserById } from "@/lib/actions";
import type { User } from "@/lib/types";

// For this demo, we'll hardcode the user ID. 
// In a real app, you'd get this from the session.
const USER_ID = "user-1"; 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    async function fetchUser() {
      const fetchedUser = await getUserById(USER_ID);
      if (fetchedUser) {
        setUser(fetchedUser);
      }
    }
    fetchUser();
  }, []);

  return (
     <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <SideNav />
      <div className="flex flex-col">
        <Header user={user} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
