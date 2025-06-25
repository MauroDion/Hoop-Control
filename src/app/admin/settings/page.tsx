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
import type { BrandingSettings } from '@/types';

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [pageState, setPageState] = useState<'loading' | 'error' | 'success'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // States for Logo
    const [currentLogo, setCurrentLogo] = useState<string | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
    
    // States for Home Page Image
    const [currentHomePageImage, setCurrentHomePageImage] = useState<string | null>(null);
    const [homePageImagePreview, setHomePageImagePreview] = useState<string | null>(null);
    const [selectedHomePageFile, setSelectedHomePageFile] = useState<File | null>(null);

    // States for Dashboard Avatar
    const [currentDashboardAvatar, setCurrentDashboardAvatar] = useState<string | null>(null);
    const [dashboardAvatarPreview, setDashboardAvatarPreview] = useState<string | null>(null);
    const [selectedDashboardAvatarFile, setSelectedDashboardAvatarFile] = useState<File | null>(null);

    const loadSettings = useCallback(async () => {
        try {
            const settings = await getBrandingSettings();
            if (settings.logoDataUrl) setCurrentLogo(settings.logoDataUrl);
            if (settings.homePageImageUrl) setCurrentHomePageImage(settings.homePageImageUrl);
            if (settings.dashboardAvatarUrl) setCurrentDashboardAvatar(settings.dashboardAvatarUrl);
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
                loadSettings().then(() => setPageState('success'));
            } else {
                setError('Acceso Denegado. Debes ser Super Admin para ver esta página.');
                setPageState('error');
            }
        }).catch(() => {
            setError('Error al verificar permisos.');
            setPageState('error');
        });

    }, [user, authLoading, router, loadSettings]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'home' | 'dashboard') => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB limit
                toast({ variant: 'destructive', title: 'Archivo demasiado grande', description: 'Por favor, selecciona un archivo de menos de 1MB.' });
                return;
            }
            
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (type === 'logo') {
                    setSelectedLogoFile(file);
                    setLogoPreview(result);
                } else if (type === 'home') {
                    setSelectedHomePageFile(file);
                    setHomePageImagePreview(result);
                } else if (type === 'dashboard') {
                    setSelectedDashboardAvatarFile(file);
                    setDashboardAvatarPreview(result);
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSave = async () => {
        setIsSaving(true);
        const settingsToSave: BrandingSettings = {};

        if (selectedLogoFile && logoPreview) settingsToSave.logoDataUrl = logoPreview;
        if (selectedHomePageFile && homePageImagePreview) settingsToSave.homePageImageUrl = homePageImagePreview;
        if (selectedDashboardAvatarFile && dashboardAvatarPreview) settingsToSave.dashboardAvatarUrl = dashboardAvatarPreview;
        
        if (Object.keys(settingsToSave).length === 0) {
            toast({ title: 'Nada que guardar', description: 'No has seleccionado nuevos archivos para subir.' });
            setIsSaving(false);
            return;
        }

        const result = await saveBrandingSettings(settingsToSave);
        setIsSaving(false);

        if (result.success) {
            toast({ title: 'Ajustes guardados', description: 'Las imágenes de la marca han sido actualizadas. La página se recargará.' });
            setTimeout(() => window.location.reload(), 2000);
        } else {
            toast({ variant: 'destructive', title: 'Error al guardar', description: result.error });
        }
    };
    
    const renderUploadSection = (
        title: string,
        description: string,
        currentImageUrl: string | null,
        previewImageUrl: string | null,
        onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
        inputId: string
    ) => (
        <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                 <div>
                    <Label>Imagen Actual</Label>
                    <div className="mt-2 w-full h-32 p-2 border rounded-md flex items-center justify-center bg-muted/50">
                        {currentImageUrl ? (
                            <Image src={currentImageUrl} alt="Imagen actual" width={150} height={120} style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%' }}/>
                        ) : (
                            <p className="text-sm text-muted-foreground">No hay imagen</p>
                        )}
                    </div>
                </div>
                 <div>
                    <Label>Vista Previa</Label>
                    <div className="mt-2 w-full h-32 p-2 border rounded-md flex items-center justify-center bg-muted/50">
                        {previewImageUrl ? (
                            <Image src={previewImageUrl} alt="Vista previa" width={150} height={120} style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%' }}/>
                        ) : (
                            <p className="text-sm text-muted-foreground">Sube una imagen para ver la vista previa</p>
                        )}
                    </div>
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor={inputId}>Subir nueva imagen (JPG, PNG, SVG)</Label>
                <Input id={inputId} type="file" accept="image/jpeg,image/png,image/svg+xml,image/bmp,image/webp" onChange={onFileChange} />
                <p className="text-xs text-muted-foreground">Límite de tamaño: 1MB.</p>
            </div>
        </div>
    );
    
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
                    <CardDescription>Sube imágenes personalizadas para diferentes partes de la aplicación.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {renderUploadSection("Logotipo de la Aplicación", "Aparece en la cabecera y en la página de inicio de sesión.", currentLogo, logoPreview, (e) => handleFileChange(e, 'logo'), 'logo-upload')}
                    {renderUploadSection("Imagen de la Página de Inicio", "Imagen principal en la página de bienvenida para usuarios no autenticados.", currentHomePageImage, homePageImagePreview, (e) => handleFileChange(e, 'home'), 'home-page-image-upload')}
                    {renderUploadSection("Avatar del Panel de Control", "Imagen decorativa junto al saludo de bienvenida en el panel.", currentDashboardAvatar, dashboardAvatarPreview, (e) => handleFileChange(e, 'dashboard'), 'dashboard-avatar-upload')}

                    <Button onClick={handleSave} disabled={isSaving || (!selectedLogoFile && !selectedHomePageFile && !selectedDashboardAvatarFile)}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>}
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
