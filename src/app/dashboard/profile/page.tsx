

import { notFound } from "next/navigation";
import { getUserById } from "@/lib/actions";
import { ProfileForm } from "./_components/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// For this demo, we'll hardcode the user ID. 
// In a real app, you'd get this from the session.
const USER_ID = "user-1"; 

export default async function ProfilePage() {
  const user = await getUserById(USER_ID);

  if (!user) {
    notFound();
  }
  
  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Meu Perfil</h1>
          <p className="text-muted-foreground">Atualize suas informações pessoais e foto de perfil.</p>
        </div>
       <Card>
        <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
            <CardDescription>Atualize seu nome, cargo e foto de perfil aqui.</CardDescription>
        </CardHeader>
        <CardContent>
             <ProfileForm user={user} />
        </CardContent>
       </Card>
    </div>
  );
}
