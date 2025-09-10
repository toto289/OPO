
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Save, Upload, Loader2 } from "lucide-react";
import type { User } from "@/lib/types";
import { updateUser } from "@/lib/actions";
import { getInitials } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  cargo: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user: initialUser }: ProfileFormProps) {
  const { toast } = useToast();
  const [user, setUser] = useState<User>(initialUser);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
      cargo: user.cargo || "",
    },
  });

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser({ ...user, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSaving(true);
    const updatedUserData: Partial<User> = { 
        name: data.name,
        cargo: data.cargo,
        avatarUrl: user.avatarUrl 
    };

    const result = await updateUser(user.id, updatedUserData);
    setIsSaving(false);

    if (result.success && result.data) {
      setUser(result.data);
      setValue("name", result.data.name);
      setValue("cargo", result.data.cargo || "");
      toast({
        title: "Perfil Atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: result.error || "Não foi possível atualizar o perfil.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 flex flex-col items-center text-center gap-4">
            <Avatar className="h-32 w-32">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
              <AvatarFallback className="text-3xl">
                {user.name ? getInitials(user.name) : <UserIcon className="h-16 w-16" />}
              </AvatarFallback>
            </Avatar>
            <Label htmlFor="avatar-upload" className="cursor-pointer w-full">
              <Button asChild variant="outline" className="w-full">
                <div>
                  <Upload className="mr-2 h-4 w-4" />
                  Mudar Foto
                </div>
              </Button>
            </Label>
            <Input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarUpload} 
                className="hidden" 
            />
        </div>

        <div className="md:col-span-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input id="cargo" {...register("cargo")} placeholder="Ex: Técnico Eletromecânico" />
              {errors.cargo && <p className="text-sm text-destructive">{errors.cargo.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Papel no Sistema (Permissões)</Label>
              <Input id="role" value={user.role || "Não definido"} disabled />
            </div>
             <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user.email} disabled />
            </div>
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  );
}

    
