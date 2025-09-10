
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { EquipmentLocation } from "@/lib/types";
import { MapPin, LocateFixed, Save } from "lucide-react";

interface LocationTrackerProps {
  location: EquipmentLocation;
  onLocationChange: (newLocation: EquipmentLocation) => void;
}

export default function LocationTracker({ location: initialLocation, onLocationChange }: LocationTrackerProps) {
  const { toast } = useToast();
  const [location, setLocation] = useState<EquipmentLocation>(initialLocation || {});
  const [isLocating, setIsLocating] = useState(false);

  const handleManualAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocation = { ...location, manualAddress: e.target.value };
    setLocation(newLocation);
    onLocationChange(newLocation);
  };
  
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocalização não suportada",
        description: "Seu navegador não suporta geolocalização.",
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { latitude, longitude, manualAddress: `Coord: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` };
        setLocation(newLocation);
        onLocationChange(newLocation);
        toast({ title: "Localização obtida com sucesso!" });
        setIsLocating(false);
      },
      () => {
        toast({
          variant: "destructive",
          title: "Falha ao obter localização",
          description: "Não foi possível obter sua localização. Verifique as permissões.",
        });
        setIsLocating(false);
      }
    );
  };
  
  const displayLocation = location.manualAddress || (location.latitude && `Lat: ${location.latitude.toFixed(4)}, Lon: ${location.longitude.toFixed(4)}`) || "Nenhuma localização definida";


  return (
    <Card>
      <CardHeader>
        <CardTitle>Localização</CardTitle>
        <CardDescription>Rastreie a localização do equipamento.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 rounded-md border p-3">
          <MapPin className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
          <div>
            <p className="font-semibold">Localização Atual</p>
            <p className="text-sm text-muted-foreground break-words">{displayLocation}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Input 
            placeholder="Ou digite o endereço manualmente" 
            value={location.manualAddress || ''}
            onChange={handleManualAddressChange}
          />
           <Button onClick={handleGetLocation} disabled={isLocating} variant="outline" className="w-full">
            <LocateFixed className="mr-2 h-4 w-4" />
            {isLocating ? "Obtendo..." : "Obter Localização GPS"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

