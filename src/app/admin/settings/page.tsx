"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getUserProfileById } from '@/app/users/actions';
import { saveBrandingSettings, getBrandingSettings } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Settings, Upload } from 'lucide-react';
import Image from 'next/image';

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [pageState, setPageState] = useState<'loading' | 'error' | 'success'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [currentLogo, setCurrentLogo] = useState<string | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const loadSettings = useCallback(async () => {
        try {
            const settings = await getBrandingSettings();
            if (settings.logoDataUrl) {
                setCurrentLogo(settings.logoDataUrl);
                setLogoPreview(settings.logoDataUrl);
            }
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los ajustes actuales.' });
        }
    }, [toast]);
    
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace('/login?redirect=/admin/settings');
            return;
        }
        
        getUserProfileById(user.uid).then(profile => {
            if (profile?.profileTypeId === 'super_admin') {
                setPageState('success');
                loadSettings();
            } else {
                setError('Acceso Denegado. Debes ser Super Admin para ver esta página.');
                setPageState('error');
            }
        }).catch(() => {
            setError('Error al verificar permisos.');
            setPageState('error');
        });

    }, [user, authLoading, router, loadSettings]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB limit check
                toast({ variant: 'destructive', title: 'Archivo demasiado grande', description: 'Por favor, selecciona un archivo de menos de 1MB.' });
                return;
            }
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSave = async () => {
        if (!logoPreview || !selectedFile) {
            toast({ variant: 'destructive', title: 'No hay imagen', description: 'Por favor, selecciona una imagen para subir.' });
            return;
        }

        setIsSaving(true);
        const result = await saveBrandingSettings({ logoDataUrl: logoPreview });
        setIsSaving(false);

        if (result.success) {
            toast({ title: 'Ajustes guardados', description: 'El nuevo logotipo ha sido guardado.' });
            setCurrentLogo(logoPreview);
            window.location.reload();
        } else {
            toast({ variant: 'destructive', title: 'Error al guardar', description: result.error });
        }
    };
    
    if (pageState === 'loading') {
         return (
            <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4">Cargando ajustes...</p>
            </div>
         );
    }
    
    if (pageState === 'error') {
         return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl font-semibold text-destructive">Error</h1>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => router.push('/dashboard')} className="mt-4">Ir al Panel</Button>
            </div>
         );
    }

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
                <Settings className="mr-3 h-10 w-10" /> Ajustes Generales
            </h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Personalización de la Marca</CardTitle>
                    <CardDescription>Cambia el logotipo de la aplicación. El logo aparecerá en la cabecera.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label>Logotipo Actual</Label>
                        <div className="mt-2 w-48 h-24 p-4 border rounded-md flex items-center justify-center bg-muted/50">
                            {currentLogo ? (
                                <Image src={currentLogo} alt="Logotipo actual" width={150} height={80} style={{ objectFit: 'contain' }}/>
                            ) : (
                                <p className="text-sm text-muted-foreground">No hay logo</p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="logo-upload">Subir nuevo logotipo (JPG, PNG, SVG)</Label>
                        <Input id="logo-upload" type="file" accept="image/jpeg,image/png,image/svg+xml,image/bmp" onChange={handleFileChange} />
                        <p className="text-xs text-muted-foreground">Recomendado: Fondo transparente. Límite de tamaño: 1MB.</p>
                    </div>

                    {logoPreview && (
                        <div className="space-y-2">
                            <Label>Vista Previa</Label>
                             <div className="mt-2 w-48 h-24 p-4 border rounded-md flex items-center justify-center bg-muted/50">
                                <Image src={logoPreview} alt="Vista previa del logo" width={150} height={80} style={{ objectFit: 'contain' }}/>
                            </div>
                        </div>
                    )}
                    
                    <Button onClick={handleSave} disabled={isSaving || !selectedFile}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>}
                        {isSaving ? 'Guardando...' : 'Guardar Logotipo'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
