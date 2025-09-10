
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import jsQR from "jsqr";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, CameraOff, ScanLine } from "lucide-react";
import { validateQrCode } from "@/lib/actions";

export default function ScanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isEquipmentFound, setIsEquipmentFound] = useState<boolean | null>(null);
  const animationFrameId = useRef<number>();

  const stopScan = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = undefined;
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const tick = useCallback(async () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          setScanResult(code.data);
          // Use the server action to validate the QR code
          const result = await validateQrCode(code.data);
          
          if (result.success && result.equipment) {
            setIsEquipmentFound(true);
            stopScan();
            toast({
              title: "Equipamento Encontrado!",
              description: `Redirecionando para a página de ${result.equipment.name}.`,
            });
            router.push(`/dashboard/equipment/${result.equipment.id}`);
          } else {
             setIsEquipmentFound(false);
             setTimeout(() => {
                setScanResult(null);
                setIsEquipmentFound(null);
             }, 2000); 
          }
           return; 
        }
      }
    }
    if (animationFrameId.current !== undefined) {
        animationFrameId.current = requestAnimationFrame(tick);
    }
  }, [router, stopScan, toast]);


  useEffect(() => {
    let isMounted = true;
    const startScan = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (isMounted) {
            setHasCameraPermission(true);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play(); 
                animationFrameId.current = requestAnimationFrame(tick);
            }
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        if (isMounted) {
            setHasCameraPermission(false);
            toast({
              variant: "destructive",
              title: "Acesso à Câmera Negado",
              description: "Por favor, habilite a permissão da câmera nas configurações do seu navegador.",
            });
        }
      }
    };

    startScan();

    return () => {
      isMounted = false;
      stopScan();
    };
  }, [toast, stopScan, tick]);


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <div>
           <h1 className="text-2xl font-bold tracking-tight font-headline">Escanear QR Code</h1>
           <p className="text-muted-foreground">Aponte a câmera para o QR Code do equipamento para ver seus detalhes.</p>
        </div>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Aponte para o QR Code</CardTitle>
          <CardDescription className="text-center">Centralize o código na área demarcada.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-square w-full rounded-md overflow-hidden bg-muted border">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-4 border-dashed border-primary/50 rounded-lg" />
            </div>
            {hasCameraPermission && <ScanLine className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 text-primary/30 animate-pulse" />}
            
            {scanResult && (
                 <div className="absolute bottom-4 left-4 right-4">
                    <Alert variant={isEquipmentFound ? "default" : "destructive"}>
                      <AlertTitle>{isEquipmentFound ? "Código Válido" : "Código Inválido"}</AlertTitle>
                      <AlertDescription className="truncate">
                         {isEquipmentFound ? `ID: ${scanResult}` : "Este QR code não corresponde a nenhum equipamento."}
                      </AlertDescription>
                    </Alert>
                </div>
            )}
          </div>
          
          {hasCameraPermission === false && (
             <Alert variant="destructive" className="mt-4">
                <CameraOff className="h-4 w-4" />
                <AlertTitle>Câmera Indisponível</AlertTitle>
                <AlertDescription>
                  Não foi possível acessar a câmera. Por favor, verifique as permissões no seu navegador e tente novamente.
                </AlertDescription>
            </Alert>
          )}

           {hasCameraPermission === null && (
             <div className="text-center text-muted-foreground p-4">
                Solicitando acesso à câmera...
             </div>
           )}

        </CardContent>
      </Card>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
