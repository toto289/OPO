
import { addStore, deleteStore, updateStore } from "@/lib/actions";
import { getStores } from "@/lib/api";
import { AddStore, EditStore, DeleteStore } from "./_components/store-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { revalidatePath } from "next/cache";


export default async function StoresPage() {
  const stores = await getStores();

  const handleAdd = async (name: string) => {
    "use server";
    await addStore({ name });
    revalidatePath("/dashboard/stores");
    revalidatePath("/dashboard/equipment/new"); // Revalidate to update store list in new equipment page
  }

  const handleDelete = async (id: string) => {
    "use server";
    const result = await deleteStore(id);
    revalidatePath("/dashboard/stores");
    revalidatePath("/dashboard/equipment/new");
    return result;
  }
  
  const handleUpdate = async (id: string, name: string) => {
    "use server";
    await updateStore(id, { name });
    revalidatePath("/dashboard/stores");
    revalidatePath("/dashboard/equipment/new");
  }

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Gerenciar Unidades (Lojas)</h1>
          <p className="text-muted-foreground">Adicione, edite ou remova as unidades (lojas) do sistema.</p>
        </div>

      <AddStore onAdd={handleAdd} />

      <Card>
        <CardHeader>
          <CardTitle>Unidades Cadastradas</CardTitle>
          <CardDescription>
            Visualize, edite ou remova as unidades existentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID da Unidade</TableHead>
                  <TableHead>Nome da Unidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.length > 0 ? (
                  stores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell className="font-mono">{store.id}</TableCell>
                      <TableCell className="font-medium">{store.name}</TableCell>
                      <TableCell className="text-right">
                          <EditStore store={store} onUpdate={handleUpdate} />
                          <DeleteStore store={store} onDelete={handleDelete} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      Nenhuma unidade encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
