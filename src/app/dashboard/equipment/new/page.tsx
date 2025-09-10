
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ImageIcon, Sparkles, PackageSearch, Loader2, PlusCircle, Trash2, Search, PackagePlus, DollarSign, CheckCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateImprovedDescription, generateImprovedName, getEquipmentComponents, getEquipmentModels, getEquipmentInsumos, addEquipment, searchWarehouseComponents } from "@/lib/actions";
import type { Component, Insumo, Store, WarehouseComponent } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStores } from "@/lib/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const formSchema = z.object({
  id: z.string().min(1, "O número de patrimônio é obrigatório."),
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  storeId: z.string().min(1, "Selecione uma unidade."),
  model: z.string().optional(),
  value: z.coerce.number().min(0, "O valor não pode ser negativo.").optional(),
});

export default function NewEquipmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [stores, setStores] = useState<Store[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isFindingComponents, setIsFindingComponents] = useState(false);
  const [isFindingModels, setIsFindingModels] = useState(false);
  const [isFindingInsumos, setIsFindingInsumos] = useState(false);
  const [components, setComponents] = useState<Component[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [foundModels, setFoundModels] = useState<string[]>([]);

  // States for component search
  const [componentSearch, setComponentSearch] = useState("");
  const [suggestions, setSuggestions] = useState<WarehouseComponent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<string | null>(null);


  useEffect(() => {
    async function fetchStores() {
        const fetchedStores = await getStores();
        setStores(fetchedStores);
    }
    fetchStores();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
      name: "",
      description: "",
      storeId: "",
      model: "",
      value: 0,
    },
  });
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateName = async () => {
    const { name } = form.getValues();
    if (!name) {
      toast({
        variant: "destructive",
        title: "Campo Obrigatório",
        description: "Por favor, preencha o nome antes de gerar com IA.",
      });
      return;
    }
    setIsGeneratingName(true);
    const result = await generateImprovedName({ currentName: name });
    setIsGeneratingName(false);

    if (result.success && result.data) {
      form.setValue("name", result.data.improvedName);
      toast({
        title: "Nome Melhorado!",
        description: "A IA gerou um novo nome para o equipamento.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erro na Geração",
        description: result.error || "Não foi possível melhorar o nome.",
      });
    }
  };

  const handleGenerateDescription = async () => {
    const { name, description } = form.getValues();
    if (!name || !description) {
      toast({
        variant: "destructive",
        title: "Campos Obrigatórios",
        description: "Por favor, preencha o nome e a descrição antes de gerar com IA.",
      });
      return;
    }
    setIsGeneratingDesc(true);
    const result = await generateImprovedDescription({
      equipmentName: name,
      currentDescription: description,
    });
    setIsGeneratingDesc(false);

    if (result.success && result.data) {
      form.setValue("description", result.data.improvedDescription);
      toast({
        title: "Descrição Melhorada!",
        description: "A IA gerou uma nova descrição para o equipamento.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erro na Geração",
        description: result.error || "Não foi possível melhorar a descrição.",
      });
    }
  };
  
    const handleFindModels = async () => {
    const { name } = form.getValues();
    if (!name) {
      toast({
        variant: "destructive",
        title: "Campo Obrigatório",
        description: "Por favor, preencha o nome do equipamento para buscar modelos.",
      });
      return;
    }
    setIsFindingModels(true);
    setFoundModels([]);
    const result = await getEquipmentModels({ equipmentName: name });
    setIsFindingModels(false);

    if (result.success && result.data?.models) {
      setFoundModels(result.data.models);
      toast({
        title: "Modelos Encontrados!",
        description: `A IA encontrou ${result.data.models.length} ${result.data.models.length > 1 ? "modelos sugeridos" : "modelo sugerido"}.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erro na Busca",
        description: result.error || "Não foi possível encontrar modelos.",
      });
    }
  };

  const handleSelectModel = (model: string) => {
    form.setValue("model", model);
    toast({
        title: "Modelo Selecionado",
        description: `"${model}" foi definido como o modelo do equipamento.`,
    });
  };

  const handleFindComponents = async () => {
    const { name, model } = form.getValues();
    if (!name || !model) {
      toast({
        variant: "destructive",
        title: "Campos Obrigatórios",
        description: "Por favor, preencha o nome e o modelo do equipamento antes de buscar componentes.",
      });
      return;
    }
    setIsFindingComponents(true);
    const result = await getEquipmentComponents({
      equipmentName: name,
      model: model,
    });
    setIsFindingComponents(false);

    if (result.success && result.data?.components) {
        setComponents([...components, ...result.data.components]);
      toast({
        title: "Componentes Encontrados!",
        description: `A IA encontrou ${result.data.components.length} ${result.data.components.length > 1 ? "componentes para este modelo" : "componente para este modelo"}.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erro na Busca",
        description: result.error || "Não foi possível encontrar os componentes.",
      });
    }
  };

  const handleFindInsumos = async () => {
    const { name, model } = form.getValues();
    if (!name || !model) {
      toast({
        variant: "destructive",
        title: "Campos Obrigatórios",
        description: "Por favor, preencha o nome e o modelo do equipamento antes de buscar insumos.",
      });
      return;
    }
    setIsFindingInsumos(true);
    const result = await getEquipmentInsumos({
      equipmentName: name,
      model: model,
    });
    setIsFindingInsumos(false);

    if (result.success && result.data?.insumos) {
      setInsumos([...insumos, ...result.data.insumos]);
      toast({
        title: "Insumos Encontrados!",
        description: `A IA encontrou ${result.data.insumos.length} ${result.data.insumos.length > 1 ? "novos insumos para este modelo" : "novo insumo para este modelo"}.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erro na Busca",
        description: result.error || "Não foi possível encontrar os insumos.",
      });
    }
  };

  const handleAddComponentManually = () => {
    setComponents([
      ...components,
      { id: `manual-comp-${Date.now()}`, name: "", partNumber: "", description: "" },
    ]);
  };

  const handleRemoveComponent = (id: string) => {
    setComponents(components.filter((c) => c.id !== id));
  };
  
  const handleComponentChange = (id: string, field: keyof Component, value: string) => {
    setComponents(
      components.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
     // Trigger search on name change
    if (field === "name") {
      setActiveSuggestionIndex(id);
      handleSearchComponent(value);
    }
  };

  const handleSearchComponent = useDebouncedCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    const results = await searchWarehouseComponents(query);
    setSuggestions(results);
    setIsSearching(false);
  }, 300);

  const handleSelectSuggestion = (componentId: string, suggestion: WarehouseComponent) => {
     setComponents(
      components.map((c) =>
        c.id === componentId
          ? {
              ...c,
              name: suggestion.name,
              partNumber: suggestion.partNumber,
              description: suggestion.description,
            }
          : c
      )
    );
    setActiveSuggestionIndex(null); // Close popover
    setSuggestions([]);
  };

  const handleAddInsumoManually = () => {
    setInsumos([
      ...insumos,
      { id: `manual-ins-${Date.now()}`, name: "", type: "", description: "" },
    ]);
  };

  const handleRemoveInsumo = (id: string) => {
    setInsumos(insumos.filter((i) => i.id !== id));
  };
  
  const handleInsumoChange = (id: string, field: keyof Insumo, value: string) => {
    setInsumos(
      insumos.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const newItemData = {
      ...values,
      model: values.model || '',
      value: values.value || 0,
      components: components,
      insumos: insumos,
      imageUrl: imageUrl || '',
      imageHint: values.name.split(' ').slice(0, 2).join(' '),
      maintenanceHistory: [],
    };

    const result = await addEquipment(newItemData);

    if (!result.success) {
        form.setError("id", {
            type: "manual",
            message: result.error,
        });
        setIsSubmitting(false);
        return;
    }

    toast({
      title: "Equipamento Adicionado!",
      description: `O equipamento "${values.name}" foi registrado com sucesso.`,
    });
    router.push(`/dashboard/equipment/${result.data?.id}`);
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard/equipment">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Registrar Novo Equipamento</h1>
          <p className="text-muted-foreground">Preencha os detalhes e adicione uma imagem para o novo ativo.</p>
        </div>
      </div>
      
       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                  <CardHeader>
                     <CardTitle>1. Detalhes do Equipamento</CardTitle>
                     <CardDescription>Forneça as informações básicas sobre o ativo. Use a IA para refinar os nomes e descrições.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nº de Patrimônio</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: EQ-00123" {...field} />
                          </FormControl>
                          <FormDescription>
                            Este é o identificador único do equipamento.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>Nome do Equipamento</FormLabel>
                            <Button type="button" variant="ghost" size="sm" onClick={handleGenerateName} disabled={isGeneratingName || !field.value}>
                              <Sparkles className="mr-2 h-4 w-4" />
                              {isGeneratingName ? "Gerando..." : "Gerar com IA"}
                            </Button>
                          </div>
                          <FormControl>
                            <Input placeholder="Ex: Furadeira de Impacto" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>Descrição</FormLabel>
                            <Button type="button" variant="ghost" size="sm" onClick={handleGenerateDescription} disabled={isGeneratingDesc || !form.getValues("name") || !field.value}>
                              <Sparkles className="mr-2 h-4 w-4" />
                              {isGeneratingDesc ? "Gerando..." : "Gerar com IA"}
                            </Button>
                          </div>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva o equipamento, incluindo marca, potência, etc."
                              className="h-24 resize-y"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                        control={form.control}
                        name="storeId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Unidade (Loja)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a unidade do ativo" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {stores.map(store => (
                                    <SelectItem key={store.id} value={store.id}>{`${store.id}: ${store.name}`}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                A unidade ajuda a organizar onde cada ativo se encontra.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Valor do Ativo (R$)</FormLabel>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <FormControl>
                                        <Input
                                        type="number"
                                        placeholder="Ex: 1250.00"
                                        className="pl-9"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                </div>
                                <FormDescription>Custo de aquisição do equipamento.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                         />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                      <CardTitle>2. Modelo e Componentes</CardTitle>
                      <CardDescription>
                        Use a IA para buscar modelos e componentes com base no nome do equipamento ou adicione-os manualmente.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4 rounded-lg border p-4">
                            <Label className="font-semibold">Buscar Modelos com IA</Label>
                             <FormDescription>
                                Com base no nome do equipamento, a IA pode sugerir modelos comuns.
                            </FormDescription>
                            <div className="flex items-end gap-2">
                                <div className="flex-grow">
                                     <Button type="button" onClick={handleFindModels} disabled={isFindingModels || !form.getValues("name")} className="w-full sm:w-auto">
                                        <Search className="mr-2 h-4 w-4" />
                                        {isFindingModels ? "Buscando..." : "Buscar Modelos"}
                                    </Button>
                                </div>
                            </div>
                             {isFindingModels && (
                                <div className="text-center py-4">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                </div>
                            )}
                            {foundModels.length > 0 && (
                                <div className="space-y-2 pt-4">
                                    <p className="text-sm font-medium">Modelos sugeridos:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {foundModels.map(model => (
                                            <Button key={model} type="button" variant="outline" size="sm" onClick={() => handleSelectModel(model)}>
                                                {model}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                         <div className="space-y-4 rounded-lg border p-4">
                             <Label className="font-semibold">Modelo do Equipamento</Label>
                              <FormDescription>
                                Digite o modelo ou selecione um dos sugeridos pela IA.
                            </FormDescription>
                            <FormField
                              control={form.control}
                              name="model"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Ex: G. Paniz ME-50" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </div>
                        
                        <div className="space-y-4">
                             <div className="flex flex-wrap gap-2">
                                 <Button type="button" size="sm" onClick={handleFindComponents} disabled={isFindingComponents || !form.getValues("model")}>
                                    <PackageSearch className="mr-2 h-4 w-4" />
                                    {isFindingComponents ? "Buscando..." : "Adicionar Componente (com IA)"}
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddInsumoManually}>
                                   <PlusCircle className="mr-2 h-4 w-4"/> Adicionar Manualmente
                                </Button>
                            </div>
                            
                            {isFindingComponents && (
                                <div className="text-center py-8">
                                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                                    <p className="mt-2 text-muted-foreground">A IA está buscando os componentes...</p>
                                </div>
                            )}
                            
                             {components.length > 0 && (
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[30%]">Componente</TableHead>
                                                <TableHead className="w-[30%]">Part Number</TableHead>
                                                <TableHead>Descrição</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {components.map((component) => (
                                                <TableRow key={component.id}>
                                                    <TableCell>
                                                        <Popover open={activeSuggestionIndex === component.id && suggestions.length > 0} onOpenChange={(open) => !open && setActiveSuggestionIndex(null)}>
                                                            <PopoverTrigger asChild>
                                                                <Input 
                                                                    value={component.name} 
                                                                    onChange={(e) => handleComponentChange(component.id, 'name', e.target.value)} 
                                                                    placeholder="Nome do componente"
                                                                />
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                                <div className="flex flex-col space-y-1 p-1">
                                                                    <p className="p-2 text-xs font-semibold text-muted-foreground">Sugestões do Estoque</p>
                                                                    {isSearching && <div className="p-2 text-sm text-center">Buscando...</div>}
                                                                    {!isSearching && suggestions.length > 0 && suggestions.map(suggestion => (
                                                                        <Button
                                                                            key={suggestion.partNumber}
                                                                            variant="ghost"
                                                                            className="h-auto justify-between"
                                                                            onClick={() => handleSelectSuggestion(component.id, suggestion)}
                                                                        >
                                                                            <div className="text-left">
                                                                                <p>{suggestion.name}</p>
                                                                                <p className="text-xs text-muted-foreground">{suggestion.partNumber}</p>
                                                                            </div>
                                                                            <CheckCircle className="h-4 w-4 text-primary" />
                                                                        </Button>
                                                                    ))}
                                                                    {!isSearching && suggestions.length === 0 && <p className="p-2 text-xs text-center text-muted-foreground">Nenhuma sugestão encontrada.</p>}
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input value={component.partNumber} onChange={(e) => handleComponentChange(component.id, 'partNumber', e.target.value)} placeholder="Número da peça"/>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input value={component.description || ''} onChange={(e) => handleComponentChange(component.id, 'description', e.target.value)} placeholder="Descrição"/>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveComponent(component.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    </CardContent>
                  </Card>
                   <Card>
                    <CardHeader>
                      <CardTitle>3. Insumos para Manutenção</CardTitle>
                      <CardDescription>
                        Liste os insumos como óleos, graxas e filtros necessários para a manutenção preventiva.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                             <Button type="button" size="sm" onClick={handleFindInsumos} disabled={isFindingInsumos || !form.getValues("model")}>
                                <PackageSearch className="mr-2 h-4 w-4" />
                                {isFindingInsumos ? "Buscando..." : "Adicionar Insumo (com IA)"}
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddInsumoManually}>
                               <PackagePlus className="mr-2 h-4 w-4"/> Adicionar Manualmente
                            </Button>
                        </div>
                        {isFindingInsumos && (
                            <div className="text-center py-8">
                                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                                <p className="mt-2 text-muted-foreground">A IA está buscando novos insumos...</p>
                            </div>
                        )}
                         {insumos.length > 0 && (
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[30%]">Insumo</TableHead>
                                            <TableHead className="w-[20%]">Tipo</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {insumos.map((insumo) => (
                                            <TableRow key={insumo.id}>
                                                <TableCell>
                                                    <Input value={insumo.name} onChange={(e) => handleInsumoChange(insumo.id, 'name', e.target.value)} placeholder="Nome do insumo"/>
                                                </TableCell>
                                                <TableCell>
                                                    <Input value={insumo.type} onChange={(e) => handleInsumoChange(insumo.id, 'type', e.target.value)} placeholder="Ex: Lubrificante"/>
                                                </TableCell>
                                                <TableCell>
                                                    <Input value={insumo.description || ''} onChange={(e) => handleInsumoChange(insumo.id, 'description', e.target.value)} placeholder="Descrição"/>
                                                </TableCell>
                                                <TableCell>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveInsumo(insumo.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                  </Card>
            </div>
            <div className="lg:col-span-1 space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>4. Imagem do Equipamento</CardTitle>
                    <CardDescription>Faça o upload de uma imagem.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={form.getValues("name")}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                          <ImageIcon className="h-12 w-12" />
                          <p className="mt-2 text-sm">A imagem aparecerá aqui.</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="equipment-image">Selecione uma Imagem</Label>
                        <Input id="equipment-image" type="file" accept="image/*" onChange={handleImageUpload} />
                    </div>
                  </CardContent>
                </Card>
            </div>
          </div>
          
          <div className="flex justify-end">
             <Button type="submit" disabled={isSubmitting} size="lg">
              {isSubmitting ? "Salvando..." : "Salvar Equipamento"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
