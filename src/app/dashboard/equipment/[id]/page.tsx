

import { notFound } from "next/navigation";
import { getEquipmentById, getStores } from "@/lib/api";
import { EquipmentDetailForm } from "./_components/equipment-detail-form";


export default async function EquipmentDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [equipment, stores] = await Promise.all([
    getEquipmentById(id),
    getStores()
  ]);

  if (!equipment) {
    notFound();
  }

  return (
    <div className="space-y-6">
       <EquipmentDetailForm equipment={equipment} stores={stores} />
    </div>
  );
}
