"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getUserProfileById } from '@/app/users/actions';
import { saveBrandingSettings, getBrandingSettings } from './actions';
import type { BrandingSettings } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Settings, Upload, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

const FILE_SIZE_LIMIT_MB = 1;

const LogoUploader = ({ title, currentLogo, onSave }: { title: string, currentLogo: string | null, onSave: (dataUrl: string) => Promise<void> }) => {
    const { toast } = useToast();
    const [logoPreview, setLogoPreview] = useState<string | null>(currentLogo);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setLogoPreview(currentLogo);
    }, [currentLogo]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > FILE_SIZE_LIMIT_MB * 1024 * 1024) {
                toast({ variant: 'destructive', title: 'Archivo demasiado grande', description: `Por favor, selecciona un archivo de menos de ${FILE_SIZE_LIMIT_MB}MB.` });
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
    
    const handleSaveClick = async () => {
        if (!logoPreview || !selectedFile) {
            toast({ variant: 'destructive', title: 'No hay imagen', description: 'Por favor, selecciona una imagen para subir.' });
            return;
        }
        setIsSaving(true);
        await onSave(logoPreview);
        setIsSaving(false);
    }
    
    return (
        <div className="p-4 border rounded-lg space-y-4">
            <h3 className="font-semibold">{title}</h3>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-48 h-24 p-2 border rounded-md flex items-center justify-center bg-muted/50 shrink-0">
                    {logoPreview ? (
                        <Image src={logoPreview} alt={`Vista previa de ${title}`} width={150} height={80} style={{ objectFit: 'contain' }}/>
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <ImageIcon className="mx-auto h-8 w-8" />
                            <p className="text-xs">Sin logo</p>
                        </div>
                    )}
                </div>
                <div className="w-full space-y-2">
                    <Label htmlFor={`logo-upload-${title.toLowerCase().replace(' ', '-')}`}>Subir nuevo logo</Label>
                    <Input id={`logo-upload-${title.toLowerCase().replace(' ', '-')}`} type="file" accept="image/*" onChange={handleFileChange} />
                </div>
            </div>
             <Button onClick={handleSaveClick} disabled={isSaving || !selectedFile}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>}
                {isSaving ? 'Guardando...' : `Guardar ${title}`}
            </Button>
        </div>
    );
};

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [pageState, setPageState] = useState<'loading' | 'error' | 'success'>('loading');
    const [error, setError] = useState<string | null>(null);
    
    const [settings, setSettings] = useState<BrandingSettings>({});
    const [isSavingAppName, setIsSavingAppName] = useState(false);

    const loadSettings = useCallback(async () => {
        try {
            const fetchedSettings = await getBrandingSettings();
            setSettings(fetchedSettings);
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
    
    const handleSaveSetting = async (setting: Partial<BrandingSettings>) => {
        const result = await saveBrandingSettings(setting);
        if (result.success) {
            toast({ title: 'Ajustes guardados', description: 'La configuración de la marca ha sido actualizada.' });
            await loadSettings();
            // Force a full reload to make sure the new branding is applied everywhere (e.g., header)
            window.location.reload();
        } else {
            toast({ variant: 'destructive', title: 'Error al guardar', description: result.error });
        }
    };

    const handleAppNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({...prev, appName: e.target.value}));
    }

    const handleSaveAppName = async () => {
        setIsSavingAppName(true);
        await handleSaveSetting({ appName: settings.appName });
        setIsSavingAppName(false);
    }
    
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
                    <CardDescription>Personaliza el nombre y los logotipos de la aplicación en diferentes vistas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 border rounded-lg space-y-2">
                         <Label htmlFor="app-name">Nombre de la Aplicación</Label>
                         <div className="flex items-center gap-2">
                             <Input id="app-name" value={settings.appName || ''} onChange={handleAppNameChange} placeholder="Hoop Control"/>
                             <Button onClick={handleSaveAppName} disabled={isSavingAppName}>
                                 {isSavingAppName && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                 Guardar Nombre
                             </Button>
                         </div>
                    </div>

                    <LogoUploader title="Logo de la Cabecera" currentLogo={settings.logoHeaderUrl || null} onSave={(dataUrl) => handleSaveSetting({ logoHeaderUrl: dataUrl })} />
                    <LogoUploader title="Logo de Inicio de Sesión" currentLogo={settings.logoLoginUrl || null} onSave={(dataUrl) => handleSaveSetting({ logoLoginUrl: dataUrl })} />
                    <LogoUploader title="Logo de la Página Principal" currentLogo={settings.logoHeroUrl || null} onSave={(dataUrl) => handleSaveSetting({ logoHeroUrl: dataUrl })} />
                </CardContent>
            </Card>
        </div>
    );
}
