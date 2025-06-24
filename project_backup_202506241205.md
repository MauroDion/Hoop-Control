# Backup del Proyecto BCSJD Web App (2025-06-24 12:05)

Este archivo contiene una copia de seguridad del código fuente del proyecto en el estado actual.

---

## .vscode/settings.json
```json
{
    "IDX.aI.enableInlineCompletion": true,
    "IDX.aI.enableCodebaseIndexing": true
}
```

---

## README.md
```md
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
```

---

## apphosting.yaml
```yaml
# Settings to manage and configure a Firebase App Hosting backend.
# https://firebase.google.com/docs/app-hosting/configure

runConfig:
  # Increase this value if you'd like to automatically spin up
  # more instances in response to increased traffic.
  maxInstances: 1
```

---

## components.json
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

---

## next.config.js
```js

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
        ],
    },
    webpack: (config, { isServer }) => {
        // This is to polyfill `process` which is not available in the browser.
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                process: require.resolve('process/browser'),
            };

            config.plugins.push(
                new (require('webpack').ProvidePlugin)({
                    process: 'process/browser',
                })
            );
        }
        
        // Exclude server-side packages from the bundle for both client and server.
        // This prevents Webpack from trying to parse native Node.js addons like `farmhash.node`
        // which are dependencies of `firebase-admin`.
        config.externals.push('firebase-admin', 'farmhash');
        
        return config;
    },
};

module.exports = nextConfig;
```

---

## package.json
```json
{
  "name": "nextn",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@hookform/resolvers": "4.1.0",
    "@radix-ui/react-accordion": "1.2.0",
    "@radix-ui/react-alert-dialog": "1.1.0",
    "@radix-ui/react-avatar": "1.1.0",
    "@radix-ui/react-checkbox": "1.1.0",
    "@radix-ui/react-collapsible": "1.1.0",
    "@radix-ui/react-dialog": "1.1.0",
    "@radix-ui/react-dropdown-menu": "2.1.0",
    "@radix-ui/react-label": "2.1.0",
    "@radix-ui/react-menubar": "1.1.0",
    "@radix-ui/react-popover": "1.1.0",
    "@radix-ui/react-progress": "1.1.0",
    "@radix-ui/react-radio-group": "1.2.0",
    "@radix-ui/react-scroll-area": "1.2.0",
    "@radix-ui/react-select": "2.1.0",
    "@radix-ui/react-separator": "1.1.0",
    "@radix-ui/react-slider": "1.2.0",
    "@radix-ui/react-slot": "1.0.2",
    "@radix-ui/react-switch": "1.1.0",
    "@radix-ui/react-tabs": "1.1.0",
    "@radix-ui/react-toast": "1.2.0",
    "@radix-ui/react-tooltip": "1.1.0",
    "class-variance-authority": "0.7.0",
    "clsx": "2.1.0",
    "date-fns": "3.5.0",
    "firebase": "10.12.2",
    "firebase-admin": "12.1.1",
    "lucide-react": "0.395.0",
    "next": "14.2.4",
    "process": "^0.11.10",
    "react": "18.3.1",
    "react-day-picker": "8.10.0",
    "react-dom": "18.3.1",
    "recharts": "2.14.0",
    "tailwind-merge": "2.3.0",
    "tailwindcss-animate": "1.0.6",
    "zod": "3.24.0"
  },
  "devDependencies": {
    "@types/node": "20.12.5",
    "@types/react": "18.2.0",
    "@types/react-dom": "18.2.0",
    "postcss": "^8",
    "tailwindcss": "3.4.1",
    "typescript": "5.3.3"
  }
}
```

---

## src/ai/dev.ts
```ts
// Genkit configuration has been temporarily removed to stabilize the server.
```

---

## src/ai/genkit.ts
```ts
// Genkit configuration has been temporarily removed to stabilize the server.
```

---

## src/app/admin/competition-categories/page.tsx
```tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getUserProfileById } from '@/app/users/actions';
import { getCompetitionCategories, deleteCompetitionCategory } from '@/app/competition-categories/actions';
import { getGameFormats } from '@/app/game-formats/actions';
import type { CompetitionCategory, GameFormat } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Tag, PlusCircle, Trash2, Edit } from 'lucide-react';
import { CompetitionCategoryForm } from '@/components/competition-categories/CompetitionCategoryForm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function ManageCategoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CompetitionCategory[]>([]);
  const [gameFormats, setGameFormats] = useState<GameFormat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CompetitionCategory | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        if (!user) throw new Error("Autenticación requerida.");
        
      const profile = await getUserProfileById(user.uid);
      if (profile?.profileTypeId !== 'super_admin') {
        throw new Error('Acceso Denegado. Debes ser Super Admin para ver esta página.');
      }

      const [fetchedCategories, fetchedGameFormats] = await Promise.all([
          getCompetitionCategories(),
          getGameFormats()
      ]);
      setCategories(fetchedCategories);
      setGameFormats(fetchedGameFormats);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/admin/competition-categories');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router, fetchData]);
  
  const handleEdit = (category: CompetitionCategory) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };
  
  const handleCreateNew = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  }

  const handleDelete = async (categoryId: string, categoryName: string) => {
    const result = await deleteCompetitionCategory(categoryId);
    if (result.success) {
        toast({ title: "Categoría Eliminada", description: `La categoría "${categoryName}" ha sido eliminada.`});
        fetchData();
    } else {
        toast({ variant: "destructive", title: "Error al Eliminar", description: result.error });
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Cargando datos de categorías...</p>
      </div>
    );
  }

  if (error) {
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
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingCategory ? "Editar Categoría" : "Crear Nueva Categoría"}</DialogTitle>
                <DialogDescription>
                  {editingCategory ? `Actualiza los detalles de ${editingCategory.name}.` : "Rellena los detalles para registrar una nueva categoría."}
                </DialogDescription>
            </DialogHeader>
            <CompetitionCategoryForm
              onFormSubmit={() => {
                setIsFormOpen(false);
                fetchData();
              }}
              gameFormats={gameFormats}
              category={editingCategory}
            />
        </DialogContent>
      </Dialog>
      
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
          <Tag className="mr-3 h-10 w-10" /> Gestionar Categorías de Competición
        </h1>
        <Button onClick={handleCreateNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Nueva Categoría
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Todas las Categorías</CardTitle>
          <CardDescription>
            A continuación se muestra una lista de todas las categorías de competición en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No se Encontraron Categorías</h2>
                <p className="text-muted-foreground">Crea una para empezar.</p>
            </div>
          ) : (
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre de Categoría</TableHead>
                    <TableHead>Formato por Defecto</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Fecha de Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell>
                        {gameFormats.find(f => f.id === cat.gameFormatId)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{cat.level || 'N/A'}</TableCell>
                      <TableCell>{cat.createdAt ? format(cat.createdAt, 'PPP', { locale: es }) : 'N/A'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(cat)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la categoría "{cat.name}".</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(cat.id, cat.name)} className="bg-destructive hover:bg-destructive/80">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/admin/game-formats/page.tsx
```tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getUserProfileById } from '@/app/users/actions';
import { getGameFormats, deleteGameFormat } from '@/app/game-formats/actions';
import type { GameFormat } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, ListOrdered, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { GameFormatForm } from '@/components/game-formats/GameFormatForm';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


export default function ManageGameFormatsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [formats, setFormats] = useState<GameFormat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFormat, setEditingFormat] = useState<GameFormat | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        if (!user) throw new Error("Autenticación requerida.");
        
      const profile = await getUserProfileById(user.uid);
      if (profile?.profileTypeId !== 'super_admin') {
        throw new Error('Acceso Denegado. Debes ser Super Admin para ver esta página.');
      }

      const fetchedFormats = await getGameFormats();
      setFormats(fetchedFormats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/admin/game-formats');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router, fetchData]);
  
  const handleEdit = (format: GameFormat) => {
    setEditingFormat(format);
    setIsFormOpen(true);
  };
  
  const handleCreateNew = () => {
    setEditingFormat(null);
    setIsFormOpen(true);
  }

  const handleDelete = async (formatId: string, formatName: string) => {
    const result = await deleteGameFormat(formatId);
    if (result.success) {
        toast({ title: "Formato Eliminado", description: `El formato "${formatName}" ha sido eliminado.`});
        fetchData();
    } else {
        toast({ variant: "destructive", title: "Error al Eliminar", description: result.error });
    }
  }


  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Cargando datos de formatos de partido...</p>
      </div>
    );
  }

  if (error) {
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
       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingFormat ? "Editar Formato" : "Crear Nuevo Formato"}</DialogTitle>
                <DialogDescription>
                  {editingFormat ? `Actualiza los detalles de ${editingFormat.name}.` : "Rellena los detalles para registrar un nuevo formato."}
                </DialogDescription>
            </DialogHeader>
            <GameFormatForm
              onFormSubmit={() => {
                setIsFormOpen(false);
                fetchData();
              }}
              format={editingFormat}
            />
        </DialogContent>
      </Dialog>
      
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
          <ListOrdered className="mr-3 h-10 w-10" /> Gestionar Formatos de Partido
        </h1>
        <Button onClick={handleCreateNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Formato
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Todos los Formatos de Partido</CardTitle>
          <CardDescription>A continuación se muestra una lista de todos los formatos de partido en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {formats.length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <ListOrdered className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No se Encontraron Formatos</h2>
                <p className="text-muted-foreground">Crea uno para empezar.</p>
            </div>
          ) : (
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Formato</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Períodos</TableHead>
                    <TableHead>Duración (min)</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formats.map((format) => (
                    <TableRow key={format.id}>
                      <TableCell className="font-medium">{format.name}</TableCell>
                      <TableCell>{format.description || 'N/A'}</TableCell>
                      <TableCell>{format.numPeriods ?? 'N/A'}</TableCell>
                      <TableCell>{format.periodDurationMinutes ?? 'N/A'}</TableCell>
                       <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(format)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el formato "{format.name}".</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(format.id, format.name)} className="bg-destructive hover:bg-destructive/80">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/admin/seeder/actions.ts
```ts
'use server';

import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';

// Helper function to delete all documents in a collection
async function deleteCollection(collectionPath: string, batchSize: number = 100) {
    if (!adminDb) return;
    const collectionRef = adminDb.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(query: admin.firestore.Query, resolve: (value: unknown) => void) {
    if (!adminDb) return;
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        resolve(true);
        return;
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(query, resolve);
    });
}

// --- Data for Seeder ---
const firstNamesMasculine = ["Hugo", "Lucas", "Mateo", "Leo", "Daniel", "Pablo", "Álvaro", "Adrián", "Manuel", "Enzo", "Martín", "Javier", "Marcos", "Alejandro", "David"];
const firstNamesFeminine = ["Lucía", "Sofía", "Martina", "María", "Julia", "Paula", "Valeria", "Emma", "Daniela", "Carla", "Alba", "Noa", "Olivia", "Sara", "Carmen"];
const lastNames = ["García", "Rodríguez", "González", "Fernández", "López", "Martínez", "Sánchez", "Pérez", "Gómez", "Martín", "Jiménez", "Ruiz", "Hernández", "Díaz", "Moreno", "Álvarez", "Romero"];

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generatePlayerName(isFeminine: boolean) {
    const firstName = isFeminine ? getRandomItem(firstNamesFeminine) : getRandomItem(firstNamesMasculine);
    return {
        firstName,
        lastName: `${getRandomItem(lastNames)} ${getRandomItem(lastNames)}`
    }
}


export async function seedDatabase(): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) {
        return { success: false, error: 'La base de datos del admin no está inicializada.' };
    }

    try {
        console.log('Iniciando el proceso de borrado de datos existentes...');
        // WARNING: This will delete all users, teams, players etc.
        const collectionsToDelete = ['gameFormats', 'competitionCategories', 'clubs', 'user_profiles', 'teams', 'players', 'seasons'];
        for (const collection of collectionsToDelete) {
            console.log(`Borrando colección: ${collection}...`);
            await deleteCollection(collection);
            console.log(`Colección ${collection} borrada.`);
        }
        
        console.log('Proceso de borrado completado. Iniciando la carga de nuevos datos...');

        const batch = adminDb.batch();
        const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

        // --- 1. Game Formats ---
        const gameFormat5v5 = { id: '5v5-standard', name: 'Estándar 5v5', numPeriods: 4, periodDurationMinutes: 10, defaultTotalTimeouts: 4 };
        const gameFormat3v3 = { id: '3v3-half', name: '3v3 Media Pista', numPeriods: 1, periodDurationMinutes: 15, defaultTotalTimeouts: 2 };
        batch.set(adminDb.collection('gameFormats').doc(gameFormat5v5.id), gameFormat5v5);
        batch.set(adminDb.collection('gameFormats').doc(gameFormat3v3.id), gameFormat3v3);

        // --- 2. Competition Categories ---
        const categories = [
            { id: 'u10-mixto', name: 'U10 Mixto', level: 10, gameFormatId: gameFormat5v5.id, isFeminine: false },
            { id: 'u12-masculino', name: 'U12 Masculino', level: 12, gameFormatId: gameFormat5v5.id, isFeminine: false },
            { id: 'u14-femenino', name: 'U14 Femenino', level: 14, gameFormatId: gameFormat5v5.id, isFeminine: true },
            { id: 'u16-masculino', name: 'U16 Masculino', level: 16, gameFormatId: gameFormat5v5.id, isFeminine: false },
            { id: 'senior-femenino', name: 'Senior Femenino', level: 99, gameFormatId: gameFormat5v5.id, isFeminine: true },
        ];
        categories.forEach(cat => batch.set(adminDb.collection('competitionCategories').doc(cat.id), {name: cat.name, level: cat.level, gameFormatId: cat.gameFormatId}));

        // --- 3. Clubs ---
        const clubs = [
            { id: 'club-estudiantes', name: 'Club Estudiantes Madrid', shortName: 'ESTU', city_name: 'Madrid', province_name: 'Madrid' },
            { id: 'club-valencia', name: 'Valencia Basket Club', shortName: 'VBC', city_name: 'Valencia', province_name: 'Valencia' },
            { id: 'club-baskonia', name: 'Saski Baskonia', shortName: 'BKN', city_name: 'Vitoria-Gasteiz', province_name: 'Álava' },
            { id: 'club-joventut', name: 'Club Joventut Badalona', shortName: 'CJB', city_name: 'Badalona', province_name: 'Barcelona' },
            { id: 'club-unicaja', name: 'Unicaja Málaga', shortName: 'UNI', city_name: 'Málaga', province_name: 'Málaga' },
        ];
        clubs.forEach(club => batch.set(adminDb.collection('clubs').doc(club.id), {...club, approved: true, createdAt: serverTimestamp}));

        const allTeamsData = [];

        // --- 4. Users, Teams, Players ---
        let userCounter = 1;
        for (const club of clubs) {
            // Create 1 Coordinator per Club
            const coordName = `${getRandomItem(firstNamesMasculine)} ${getRandomItem(lastNames)}`;
            const coordId = `user-coord-${userCounter}`;
            const coordinator = {
                uid: coordId,
                displayName: coordName,
                email: `${coordName.toLowerCase().replace(/\s/g, '.')}@example.com`,
                profileTypeId: 'coordinator',
                clubId: club.id,
                status: 'approved',
                createdAt: serverTimestamp,
                updatedAt: serverTimestamp,
            };
            batch.set(adminDb.collection('user_profiles').doc(coordId), coordinator);
            userCounter++;
            
            for(const category of categories) {
                 // Create 1-2 Coaches per Team
                const coachIds = [];
                const numCoaches = 1 + Math.floor(Math.random() * 2); // 1 or 2
                 for (let i = 0; i < numCoaches; i++) {
                    const coachName = `${getRandomItem(firstNamesFeminine)} ${getRandomItem(lastNames)}`;
                    const coachId = `user-coach-${userCounter}`;
                    coachIds.push(coachId);
                    const coach = {
                        uid: coachId,
                        displayName: coachName,
                        email: `${coachName.toLowerCase().replace(/\s/g, '.')}@example.com`,
                        profileTypeId: 'coach',
                        clubId: club.id,
                        status: 'approved',
                        createdAt: serverTimestamp,
                        updatedAt: serverTimestamp,
                    };
                    batch.set(adminDb.collection('user_profiles').doc(coachId), coach);
                    userCounter++;
                 }

                // Create 1 Team per Category per Club
                const teamId = `${club.shortName?.toLowerCase()}-${category.id}`;
                const team = {
                    id: teamId,
                    name: `${club.name} ${category.name}`,
                    clubId: club.id,
                    competitionCategoryId: category.id,
                    coachIds: coachIds,
                    coordinatorIds: [coordId],
                    createdAt: serverTimestamp,
                    updatedAt: serverTimestamp
                };
                batch.set(adminDb.collection('teams').doc(team.id), team);
                allTeamsData.push(team);

                // Create 8-9 Players per Team
                const numPlayers = 8 + Math.floor(Math.random() * 2);
                for (let p = 0; p < numPlayers; p++) {
                    const playerName = generatePlayerName(category.isFeminine);
                    const player = {
                        ...playerName,
                        jerseyNumber: 4 + p,
                        position: ['Base', 'Escolta', 'Alero', 'Ala-Pívot', 'Pívot'][p % 5],
                        teamId: team.id,
                        createdAt: serverTimestamp
                    };
                    batch.set(adminDb.collection('players').doc(), player);
                }
            }
        }

        // --- 5. Season ---
        const season2425 = {
            name: 'Temporada 2024-2025',
            status: 'active',
            competitions: categories.map(category => {
                return {
                    competitionCategoryId: category.id,
                    teamIds: allTeamsData.filter(t => t.competitionCategoryId === category.id).map(t => t.id)
                }
            })
        };
        batch.set(adminDb.collection('seasons').doc('season-24-25'), season2425);
        
        await batch.commit();

        console.log('Base de datos poblada con éxito.');
        return { success: true };
    } catch (error: any) {
        console.error('Error al poblar la base de datos:', error);
        return { success: false, error: `Se ha producido un error en el servidor: ${error.message}` };
    }
}
```

---

## src/app/admin/seeder/page.tsx
```tsx
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Database, Wand2 } from 'lucide-react';
import { seedDatabase } from './actions';
import { useToast } from '@/hooks/use-toast';
import { getUserProfileById } from '@/app/users/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SeederPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [verifying, setVerifying] = useState(true);

  React.useEffect(() => {
    if (!authLoading && user) {
      getUserProfileById(user.uid)
        .then(profile => {
          if (profile?.profileTypeId !== 'super_admin') {
            setError('Acceso Denegado. Solo los Super Admins pueden poblar la base de datos.');
          } else {
            setIsSuperAdmin(true);
          }
        })
        .finally(() => setVerifying(false));
    } else if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const handleSeedDatabase = async () => {
    setLoading(true);
    setError(null);
    const result = await seedDatabase();
    if (result.success) {
      toast({
        title: '¡Base de Datos Poblada!',
        description: 'Se han añadido los datos de ejemplo correctamente. Refresca las otras páginas para ver los cambios.',
        duration: 7000,
      });
    } else {
      setError(result.error || 'Ha ocurrido un error desconocido.');
      toast({
        variant: 'destructive',
        title: 'Error al Poblar la Base de Datos',
        description: result.error,
      });
    }
    setLoading(false);
  };
  
  if (authLoading || verifying) {
    return (
       <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Verificando permisos...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <Database className="mr-3 h-8 w-8 text-primary" />
            Poblador de Base de Datos (Seeder)
          </CardTitle>
          <CardDescription>
            Herramienta de desarrollo para llenar Firestore con un conjunto completo de datos de prueba.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex flex-col items-center justify-center text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold text-destructive">Error</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
          )}
          
          {isSuperAdmin && !error && (
            <div className="text-center p-6 border-2 border-dashed rounded-lg">
                <Wand2 className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
                <h3 className="text-xl font-semibold">¿Listo para empezar?</h3>
                <p className="text-muted-foreground my-2">
                    Hacer clic en el botón de abajo borrará las colecciones existentes (incluyendo **todos los perfiles de usuario**) y las llenará con un nuevo conjunto de datos de prueba: 5 clubs, 5 categorías por club, 25 equipos, ~200 jugadores y 1 temporada activa.
                </p>
                <p className="text-sm font-bold text-destructive my-4">
                    <AlertTriangle className="inline-block h-4 w-4 mr-1" />
                    ¡Esta acción no se puede deshacer!
                </p>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button disabled={loading} size="lg" variant="destructive">
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Database className="mr-2 h-5 w-5" />}
                        {loading ? 'Poblando...' : 'Poblar Base de Datos de Prueba'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción es irreversible. Se borrarán permanentemente las colecciones de usuarios, clubs, equipos, jugadores y temporadas, y se reemplazarán con datos de prueba.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSeedDatabase}
                        className="bg-destructive hover:bg-destructive/80"
                      >
                        Sí, poblar la base de datos
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/admin/user-management/actions.ts
```ts
'use server';

import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import type { UserFirestoreProfile, UserProfileStatus } from '@/types';
import { revalidatePath } from 'next/cache';

// IMPORTANT: These actions now use the Admin SDK, bypassing Firestore rules.
// Access to the page invoking these actions must be strictly controlled.

export async function getAllUserProfiles(): Promise<UserFirestoreProfile[]> {
  console.log("AdminUserManagementActions: Attempting to fetch all user profiles from 'user_profiles' using Admin SDK.");

  if (!adminDb) {
    console.error("AdminUserManagementActions: Firebase Admin SDK is not initialized. Cannot fetch user profiles.");
    return [];
  }

  try {
    const usersCollectionRef = adminDb.collection('user_profiles');
    // Order by creation date, newest first. This may require an index in Firestore.
    const q = usersCollectionRef.orderBy('createdAt', 'desc');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.warn("AdminUserManagementActions: No documents found in 'user_profiles' collection.");
      return [];
    }
    
    console.log(`AdminUserManagementActions: Found ${querySnapshot.docs.length} user profiles.`);
    
    const allProfiles = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Timestamps to serializable JS Date objects
      return {
        uid: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as UserFirestoreProfile;
    });
    
    console.log("AdminUserManagementActions: Successfully fetched all user profiles.");
    return allProfiles;
  } catch (error: any) {
    console.error('AdminUserManagementActions: Error fetching all user profiles with Admin SDK:', error.message, error.stack);
    if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("AdminUserManagementActions: Firestore query failed. This is likely due to a missing Firestore index. Please create an index on the 'createdAt' field (descending) for the 'user_profiles' collection in your Firebase console.");
    }
    return []; // Return empty array on error
  }
}

export async function updateUserProfileStatus(
  uid: string,
  status: UserProfileStatus
): Promise<{ success: boolean; error?: string }> {
  console.log(`AdminUserManagementActions: Attempting to update status for UID: ${uid} to '${status}'.`);
  if (!uid || !status) {
    return { success: false, error: 'UID and new status are required.' };
  }

  if (!adminDb) {
    console.error("AdminUserManagementActions: Firebase Admin SDK is not initialized. Cannot update user profile.");
    return { success: false, error: 'Server configuration error.' };
  }

  try {
    const userProfileRef = adminDb.collection('user_profiles').doc(uid);
    await userProfileRef.update({
      status: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`AdminUserManagementActions: Successfully updated status for UID: ${uid} to '${status}'.`);
    revalidatePath('/admin/user-management'); // Revalidate the admin page to show updated data
    return { success: true };
  } catch (error: any) {
    console.error(`AdminUserManagementActions: Error updating status for UID ${uid}:`, error.message, error.stack);
    return { success: false, error: error.message || 'Failed to update user status.' };
  }
}
```

---

## src/app/admin/user-management/page.tsx
```tsx
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getAllUserProfiles, updateUserProfileStatus } from './actions';
import { getUserProfileById } from '@/app/users/actions';
import { getApprovedClubs } from '@/app/clubs/actions';
import { getProfileTypeOptions } from '@/app/profile-types/actions';
import type { UserFirestoreProfile, UserProfileAdminView, Club, ProfileTypeOption, UserProfileStatus } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Users, ShieldCheck, ShieldX, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function UserManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(true);
  const [profiles, setProfiles] = useState<UserProfileAdminView[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [profileTypes, setProfileTypes] = useState<ProfileTypeOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPageData = async () => {
    setLoadingData(true);
    setError(null);
    try {
      const [fetchedProfiles, fetchedClubs, fetchedProfileTypes] = await Promise.all([
        getAllUserProfiles(),
        getApprovedClubs(),
        getProfileTypeOptions(),
      ]);
      
      setProfiles(fetchedProfiles);
      setClubs(fetchedClubs);
      setProfileTypes(fetchedProfileTypes);

    } catch (err: any) {
      setError(err.message || "Fallo al cargar los datos. Revisa las reglas de Firestore y los logs del servidor.");
      toast({ variant: "destructive", title: "Error al Cargar Datos", description: err.message || "No se pudieron cargar los datos necesarios." });
    } finally {
      setLoadingData(false);
    }
  };
  
  useEffect(() => {
    const checkPermissionsAndFetchData = async () => {
      if (!user) {
        router.replace('/login?redirect=/admin/user-management');
        return;
      }
      
      setIsVerifyingAdmin(true);
      setLoadingData(true);
      setError(null);

      try {
        const profile = await getUserProfileById(user.uid);

        if (profile && profile.profileTypeId === 'super_admin') {
          setIsAdmin(true);
          await fetchPageData();
        } else {
          setIsAdmin(false);
          setError("Acceso Denegado. Debes ser Super Admin para ver esta página.");
        }
      } catch (err: any) {
        setError("No se pudo verificar el estado de administrador. Revisa la consola para más detalles.");
        setIsAdmin(false);
      } finally {
        setIsVerifyingAdmin(false);
        setLoadingData(false);
      }
    };

    if (!authLoading) {
      checkPermissionsAndFetchData();
    }
  }, [user, authLoading, router]);


  const handleStatusUpdate = async (uid: string, newStatus: UserProfileStatus, displayName: string | null) => {
    const result = await updateUserProfileStatus(uid, newStatus);
    if (result.success) {
      toast({ title: "Estado Actualizado", description: `El estado del usuario ${displayName || uid} cambió a ${newStatus}.` });
      fetchPageData(); // Refresh data
    } else {
      toast({ variant: "destructive", title: "Fallo al Actualizar", description: result.error });
    }
  };

  const displayProfiles = useMemo(() => {
    return profiles.map(profile => {
      const club = clubs.find(c => c.id === profile.clubId);
      const profileType = profileTypes.find(pt => pt.id === profile.profileTypeId);
      return {
        ...profile,
        clubName: club?.name || profile.clubId,
        profileTypeLabel: profileType?.label || profile.profileTypeId,
      };
    });
  }, [profiles, clubs, profileTypes]);


  if (authLoading || isVerifyingAdmin || loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">
          {authLoading ? "Autenticando..." : isVerifyingAdmin ? "Verificando estado de admin..." : "Cargando datos de usuario..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-headline font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        {!isAdmin && error.startsWith("Acceso Denegado") && (
             <Button onClick={() => router.push('/dashboard')}>Ir al Panel</Button>
        )}
      </div>
    );
  }
  
  if (!isAdmin) {
      return (
           <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl font-headline font-semibold text-destructive">Acceso Denegado</h1>
                <p className="text-muted-foreground mb-4">No tienes permiso para ver esta página.</p>
                <Button onClick={() => router.push('/dashboard')}>Ir al Panel</Button>
            </div>
      )
  }

  const getStatusBadgeVariant = (status: UserProfileStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'approved': return 'default'; 
      case 'pending_approval': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
            <Users className="mr-3 h-10 w-10" /> Gestión de Usuarios
          </h1>
          <p className="text-lg text-muted-foreground mt-1">Aprobar o rechazar nuevos registros de usuarios.</p>
        </div>
        <Button onClick={fetchPageData} disabled={loadingData} variant="outline" className="mt-4 sm:mt-0">
          <RefreshCw className={`mr-2 h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} />
          Actualizar Lista
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Registros de Usuarios</CardTitle>
          <CardDescription>
            Revisa los perfiles pendientes y gestiona su acceso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayProfiles.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No se Encontraron Perfiles de Usuario</h2>
                <p className="text-muted-foreground">No hay perfiles de usuario para mostrar en este momento.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Tipo de Perfil</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayProfiles.map((profile) => (
                    <TableRow key={profile.uid} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{profile.displayName || 'N/A'}</TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>{profile.clubName}</TableCell>
                      <TableCell>{profile.profileTypeLabel}</TableCell>
                      <TableCell>{profile.createdAt ? format(profile.createdAt, 'PPpp', { locale: es }) : 'Fecha inválida'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(profile.status)} className="capitalize">
                          {profile.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {profile.status === 'pending_approval' && (
                          <>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                                  <ShieldCheck className="mr-1 h-4 w-4" /> Aprobar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Aprobar Usuario?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Estás seguro de que quieres aprobar al usuario {profile.displayName || profile.email}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleStatusUpdate(profile.uid, 'approved', profile.displayName)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Aprobar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <ShieldX className="mr-1 h-4 w-4" /> Denegar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Denegar Acceso al Usuario?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Estás seguro de que quieres denegar el acceso a {profile.displayName || profile.email}? Su estado será cambiado a 'rechazado'.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleStatusUpdate(profile.uid, 'rejected', profile.displayName)}
                                    className="bg-destructive hover:bg-destructive/80"
                                  >
                                    Denegar Acceso
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                        {profile.status === 'approved' && (
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <ShieldX className="mr-1 h-4 w-4" /> Rechazar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Rechazar Usuario Aprobado?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Seguro que quieres cambiar el estado de {profile.displayName || profile.email} a 'rechazado'?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleStatusUpdate(profile.uid, 'rejected', profile.displayName)}
                                     className="bg-destructive hover:bg-destructive/80"
                                  >
                                    Rechazar Usuario
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        )}
                         {profile.status === 'rejected' && (
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                                  <ShieldCheck className="mr-1 h-4 w-4" /> Re-aprobar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Re-aprobar Usuario?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Seguro que quieres cambiar el estado de {profile.displayName || profile.email} a 'aprobado'?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleStatusUpdate(profile.uid, 'approved', profile.displayName)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Re-aprobar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        )}
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
  );
}
```

---

## src/app/api/auth/session-login/route.ts
```ts
import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminInitError } from '@/lib/firebase/admin'; // Import adminInitError
import { getUserProfileById } from '@/app/users/actions';

export async function POST(request: NextRequest) {
  // Add a defensive check right at the beginning
  if (!adminAuth) {
    const detailedError = `Server authentication is not configured correctly. Reason: ${adminInitError || 'Unknown initialization error. Check server startup logs for details.'}`;
    console.warn(`API (session-login): CRITICAL WARNING - Firebase Admin SDK is not initialized. Details: ${adminInitError}`);
    return NextResponse.json({ error: detailedError }, { status: 500 });
  }

  try {
    const { idToken, rememberMe } = await request.json(); // Read rememberMe flag
    if (!idToken) {
      console.log("API (session-login): Request failed because ID token is missing.");
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }
    
    console.log(`API (session-login): Received ID token, verifying and checking profile status...`);

    // Verify the token to get the user's UID
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    console.log(`API (session-login): ID token verified for UID: ${uid}.`);
    
    // Check the user's profile status in Firestore.
    const userProfile = await getUserProfileById(uid);

    // Only create a session if the user's profile is found and status is 'approved'
    if (userProfile && userProfile.status === 'approved') {
      console.log(`API (session-login): Profile status for UID ${uid} is 'approved'. Proceeding to create session cookie.`);
      
      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
      
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      
      // Options are now dynamic based on the rememberMe flag
      const options: any = {
        name: 'session',
        value: sessionCookie,
        httpOnly: true,
        secure: true,
        path: '/',
        sameSite: 'none' as const,
      };

      if (rememberMe) {
        options.maxAge = expiresIn / 1000; // Set maxAge for persistent cookie
      }
      // If rememberMe is false, maxAge is not set, making it a session cookie

      const response = NextResponse.json({ status: 'success', message: 'Session cookie created.' }, { status: 200 });
      response.cookies.set(options);
      
      console.log(`API (session-login): Session cookie successfully created (persistent: ${!!rememberMe}).`);
      return response;

    } else {
      const reason = userProfile ? `status is '${userProfile.status}'` : 'profile not found';
      console.warn(`API (session-login): Session creation DENIED for UID: ${uid} because ${reason}.`);
      
      return NextResponse.json({ 
          error: 'User account not active.',
          reason: userProfile?.status || 'not_found'
      }, { status: 403 });
    }

  } catch (error: any) {
    console.error('API (session-login): CRITICAL ERROR processing login. Full error object:', error);
    
    let errorMessage = 'Failed to create session.';
    if (error.code === 'auth/id-token-expired') {
        errorMessage = 'Firebase ID token has expired. Please re-authenticate.';
    } else if (error.code === 'auth/invalid-id-token') {
        errorMessage = 'Firebase ID token is invalid. Please re-authenticate.';
    } else if (error.message) {
        errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 401 });
  }
}
```

---

## src/app/api/auth/session-logout/route.ts
```ts
import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminInitError } from '@/lib/firebase/admin'; // Use admin SDK

export async function POST(request: NextRequest) {
  // Add a defensive check right at the beginning
  if (!adminAuth) {
    const detailedError = `Server authentication is not configured correctly. Reason: ${adminInitError || 'Unknown initialization error. Check server startup logs for details.'}`;
    console.warn(`API (session-logout): CRITICAL WARNING - Firebase Admin SDK is not initialized. Details: ${adminInitError}`);
    // Still attempt to clear the client-side cookie even if server auth is down
  }

  try {
    const sessionCookie = request.cookies.get('session')?.value;
    if (sessionCookie && adminAuth) { // Only attempt verification if adminAuth is available
      console.log("API (session-logout): Found session cookie, attempting to revoke tokens.");
      // Verify the session cookie. This is important to prevent CSRF attacks.
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true /** checkRevoked */)
        .catch(error => {
          console.warn("API (session-logout): Error verifying session cookie during logout (possibly expired/revoked):", error.message);
          return null; // Treat as if cookie wasn't valid or present
        });

      if (decodedClaims) {
        await adminAuth.revokeRefreshTokens(decodedClaims.sub); // Revoke refresh tokens for the user
        console.log(`API (session-logout): Successfully revoked refresh tokens for UID: ${decodedClaims.sub}`);
      } else {
        console.log("API (session-logout): Could not decode session cookie, skipping token revocation.");
      }
    } else if (sessionCookie && !adminAuth) {
        console.warn("API (session-logout): Firebase Admin not initialized. Cannot revoke tokens. Proceeding to clear cookie.");
    } else {
        console.log("API (session-logout): No session cookie found to revoke.");
    }
    
    // Always clear the session cookie by setting its Max-Age to 0
    const response = NextResponse.json({ status: 'success', message: 'Session cookie cleared.' }, { status: 200 });
    response.cookies.set({
      name: 'session',
      value: '',
      maxAge: 0,
      httpOnly: true,
      secure: true, // Must be true for SameSite=None
      path: '/',
      sameSite: 'none',
    });

    console.log("API (session-logout): Session cookie successfully cleared from response with SameSite=None.");
    return response;

  } catch (error: any)
{
    console.error('API (session-logout): Error during logout process:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to clear session.', details: error.message }, { status: 500 });
  }
}
```

---

## src/app/api/auth/verify-session/route.ts
```ts
import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminInitError } from '@/lib/firebase/admin';
import { getUserProfileById } from '@/app/users/actions';

export async function POST(request: NextRequest) {
  // Add a defensive check right at the beginning
  if (!adminAuth) {
    const detailedError = `Server authentication is not configured correctly. Reason: ${adminInitError || 'Unknown initialization error. Check server startup logs for details.'}`;
    console.warn(`API (verify-session): CRITICAL WARNING - Firebase Admin SDK is not initialized. Details: ${adminInitError}`);
    return NextResponse.json({ isAuthenticated: false, error: detailedError }, { status: 500 });
  }

  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    console.log("API (verify-session): Request received, but 'session' cookie was not found.");
    return NextResponse.json({ isAuthenticated: false, error: 'Session cookie not found.' }, { status: 401 });
  }
  console.log("API (verify-session): Request received with a 'session' cookie. Attempting to verify...");

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true /* checkRevoked */);
    console.log(`API (verify-session): Cookie verification SUCCESS for UID: ${decodedClaims.uid}. Now checking profile status...`);

    // --- NEW LOGIC: Check Firestore profile status ---
    const userProfile = await getUserProfileById(decodedClaims.uid);

    if (userProfile && userProfile.status === 'approved') {
      console.log(`API (verify-session): Profile status is 'approved' for UID: ${decodedClaims.uid}. Authentication successful.`);
      return NextResponse.json({ isAuthenticated: true, uid: decodedClaims.uid, email: decodedClaims.email }, { status: 200 });
    } else {
      const reason = userProfile ? `status is '${userProfile.status}'` : 'profile not found';
      console.warn(`API (verify-session): Authentication FAILED for UID: ${decodedClaims.uid} because ${reason}.`);
      // User is not approved or doesn't have a profile. Send back a structured error.
      return NextResponse.json({ 
          isAuthenticated: false, 
          error: 'User account not active.', 
          reason: userProfile?.status || 'not_found' // e.g., 'pending_approval', 'rejected'
        }, { status: 403 }); // 403 Forbidden is appropriate for a valid user who lacks rights
    }

  } catch (error: any) {
    console.warn(`API (verify-session): Cookie verification FAILED. Error Code: ${error.code}. Message: ${error.message}`);
    // This catches invalid/expired cookies.
    return NextResponse.json({ 
        isAuthenticated: false, 
        error: 'Invalid session cookie.', 
        reason: 'invalid_cookie',
        details: `Code: ${error.code}, Message: ${error.message}` 
    }, { status: 401 });
  }
}
```

---

## src/app/bcsjd-api-data/page.tsx
```tsx
"use client"; // This page needs to be a client component for useEffect and useState

import React, { useEffect, useState } from 'react';
import { getBcsjdKeyMetrics } from '@/lib/bcsjdApi';
import type { BcsjdApiDataItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, AlertTriangle, Loader2, RefreshCw, HelpCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BcsjdApiDataPage() {
  const [data, setData] = useState<BcsjdApiDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbiddenError, setIsForbiddenError] = useState(false);
  const [isMockData, setIsMockData] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setIsForbiddenError(false);
    setIsMockData(false);
    try {
      const result = await getBcsjdKeyMetrics();
      setData(result.data);
      setIsMockData(result.isMock);
      if (result.isMock) {
         // This is not a critical error, just a state to show info to the user.
         console.warn("Displaying mock data because the real API call failed.");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Fallo al obtener datos de la API de BCSJD.";
      setError(errorMessage);
      if (errorMessage.includes('403') || errorMessage.toLowerCase().includes('forbidden')) {
        setIsForbiddenError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Cargando datos de la API de BCSJD...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10 bg-destructive/10 border border-destructive rounded-lg p-6">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold text-destructive">Error al Obtener Datos</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          {isForbiddenError && (
            <div className="mt-4 mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 text-sm text-left">
              <div className="flex">
                <div className="py-1"><HelpCircle className="h-5 w-5 text-yellow-500 mr-3" /></div>
                <div>
                  Un error <strong>403 Prohibido</strong> significa que el servidor está denegando el acceso.
                  Razones comunes para esto al acceder a la API de BCSJD incluyen:
                  <ul className="list-disc list-inside mt-2">
                    <li>La clave de API (<code>NEXT_PUBLIC_BCSJD_API_KEY</code>) podría ser incorrecta, faltar o no estar autorizada para esta acción.</li>
                    <li>El servidor de la API de BCSJD podría tener restricciones de IP u otras medidas de seguridad.</li>
                  </ul>
                  <p className="mt-2">Por favor, revisa tu archivo <code>.env.local</code> para la clave de API y consulta la documentación o al administrador de la API de BCSJD.</p>
                </div>
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground mb-4">
            Consejo: Abre las Herramientas de Desarrollador de tu navegador (F12), ve a la pestaña "Red" y actualiza. Busca las solicitudes fallidas (a menudo en rojo) para ver más detalles sobre el error y la URL específica que falló.
          </p>
          <Button onClick={fetchData} variant="destructive">
            <RefreshCw className="mr-2 h-4 w-4" /> Intentar de Nuevo
          </Button>
        </div>
      );
    }
    
    if (data.length === 0) {
        return (
             <div className="text-center py-10 border-2 border-dashed rounded-lg p-6">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No Hay Datos Disponibles</h2>
                <p className="text-muted-foreground mb-4">No se pudo obtener ningún dato de la API de BCSJD en este momento.</p>
                <Button onClick={fetchData}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Actualizar Datos
                </Button>
            </div>
        );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre de Métrica</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Última Actualización</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.value.toString()}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>{format(new Date(item.lastUpdated), 'PPpp', { locale: es })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
            <BarChart3 className="mr-3 h-10 w-10" /> Datos de la API de BCSJD
          </h1>
          <p className="text-lg text-muted-foreground mt-1">Datos en vivo del sistema externo de BCSJD.</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" className="mt-4 sm:mt-0">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar Datos
        </Button>
      </div>
      
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Resumen de Métricas Clave</CardTitle>
          <CardDescription>
            Mostrando información importante recuperada directamente de la API de BCSJD.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMockData && !error && (
             <Alert className="mb-6 border-yellow-500 text-yellow-800">
                <Info className="h-4 w-4 text-yellow-600" />
                <AlertTitle>Modo de Demostración</AlertTitle>
                <AlertDescription>
                  Actualmente estás viendo datos de ejemplo. La conexión con la API real de BCSJD no se pudo establecer. Para conectar con datos reales, asegúrate de que las variables <code>NEXT_PUBLIC_BCSJD_API_BASE_URL</code> y <code>NEXT_PUBLIC_BCSJD_API_KEY</code> están configuradas correctamente en tu entorno.
                </AlertDescription>
            </Alert>
          )}
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/clubs/[clubId]/page.tsx
```tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

// Actions
import { getUserProfileById } from '@/app/users/actions';
import { getClubById } from '@/app/clubs/actions';
import { getTeamsByClubId } from '@/app/teams/actions';
import { getCompetitionCategories } from '@/app/competition-categories/actions';

// Types
import type { Club, Team, UserFirestoreProfile, CompetitionCategory } from '@/types';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, ChevronLeft, Building, Users, PlusCircle, Shield, Settings } from 'lucide-react';

export default function ClubManagementPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    
    const clubId = typeof params.clubId === 'string' ? params.clubId : '';

    const [club, setClub] = useState<Club | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [userProfile, setUserProfile] = useState<UserFirestoreProfile | null>(null);
    const [competitionCategories, setCompetitionCategories] = useState<CompetitionCategory[]>([]);
    const [hasPermission, setHasPermission] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPageData = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            if (!clubId) {
                throw new Error("Club ID is missing from the URL.");
            }
            
            const profile = await getUserProfileById(userId);
            setUserProfile(profile);

            const isSuperAdmin = profile?.profileTypeId === 'super_admin';
            const isClubAdmin = profile?.profileTypeId === 'club_admin' && profile.clubId === clubId;

            if (!isSuperAdmin && !isClubAdmin) {
                throw new Error("Access Denied. You do not have permission to manage this club.");
            }
            setHasPermission(true);

            // Fetch club, team, and category data in parallel
            const [clubData, teamsData, categoriesData] = await Promise.all([
                getClubById(clubId),
                getTeamsByClubId(clubId),
                getCompetitionCategories()
            ]);

            if (!clubData) {
                throw new Error("Club not found.");
            }
            
            setClub(clubData);
            setTeams(teamsData);
            setCompetitionCategories(categoriesData);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [clubId]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace(`/login?redirect=/clubs/${clubId}`);
            return;
        }
        loadPageData(user.uid);
    }, [clubId, user, authLoading, router, loadPageData]);
    
    if (authLoading || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Loading club details...</p>
            </div>
        );
    }
    
    if (error || !hasPermission) {
         return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl font-headline font-semibold text-destructive">Error</h1>
                <p className="text-muted-foreground mb-4">{error || "An unknown error occurred."}</p>
                 <Button asChild variant="outline">
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
        );
    }

    if (!club) {
        return null; // Should be covered by error state
    }

    return (
        <div className="space-y-8">
            <Button variant="outline" size="sm" asChild>
                <Link href="/clubs">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to All Clubs
                </Link>
            </Button>

            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-4xl font-headline font-bold text-primary flex items-center">
                       <Building className="mr-4 h-10 w-10"/> {club.name}
                    </CardTitle>
                    <CardDescription className="text-lg">
                       {club.city_name}, {club.province_name}
                    </CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center"><Users className="mr-3 h-6 w-6"/>Club Teams</CardTitle>
                        <CardDescription>
                            Manage the teams associated with this club.
                        </CardDescription>
                    </div>
                     <Button asChild>
                        <Link href={`/clubs/${clubId}/teams/new`}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create New Team
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {teams.length === 0 ? (
                         <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold">No Teams Found</h2>
                            <p className="text-muted-foreground">This club doesn't have any teams yet.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Team Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teams.map(team => (
                                    <TableRow key={team.id}>
                                        <TableCell className="font-medium">{team.name}</TableCell>
                                        <TableCell>
                                            {competitionCategories.find(c => c.id === team.competitionCategoryId)?.name || team.competitionCategoryId || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                             <Button asChild size="sm" variant="outline">
                                                <Link href={`/clubs/${clubId}/teams/${team.id}`}>
                                                   <Settings className="mr-2 h-4 w-4" /> Manage Team
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
```

---

## src/app/clubs/[clubId]/teams/[teamId]/page.tsx
```tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

// Actions
import { getUserProfileById, getUsersByProfileTypeAndClub } from '@/app/users/actions';
import { getTeamById } from '@/app/teams/actions';
import { getPlayersByTeamId, deletePlayer } from '@/app/players/actions';
import { getCompetitionCategories } from '@/app/competition-categories/actions';
import { getGameFormats } from '@/app/game-formats/actions';


// Types
import type { Team, UserFirestoreProfile, Player, CompetitionCategory, GameFormat } from '@/types';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, ChevronLeft, Users, UserPlus, Home, Settings, Trash2, Edit } from 'lucide-react';
import { PlayerForm } from '@/components/players/PlayerForm';
import { TeamForm } from '@/components/teams/TeamForm';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TeamManagementPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const clubId = typeof params.clubId === 'string' ? params.clubId : '';
    const teamId = typeof params.teamId === 'string' ? params.teamId : '';

    const [team, setTeam] = useState<Team | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [coaches, setCoaches] = useState<UserFirestoreProfile[]>([]);
    const [coordinators, setCoordinators] = useState<UserFirestoreProfile[]>([]);
    const [competitionCategories, setCompetitionCategories] = useState<CompetitionCategory[]>([]);
    const [gameFormats, setGameFormats] = useState<GameFormat[]>([]);
    const [hasPermission, setHasPermission] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);

    const loadPageData = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            if (!clubId || !teamId) throw new Error("Falta el ID del club o del equipo.");
            
            const [profile, teamData, playersData, clubCoaches, clubCoordinators, cats, formats] = await Promise.all([
                getUserProfileById(userId),
                getTeamById(teamId),
                getPlayersByTeamId(teamId),
                getUsersByProfileTypeAndClub('coach', clubId),
                getUsersByProfileTypeAndClub('coordinator', clubId),
                getCompetitionCategories(),
                getGameFormats(),
            ]);

            if (!teamData) throw new Error("Equipo no encontrado.");
            if (teamData.clubId !== clubId) throw new Error("El equipo no pertenece a este club.");
            
            const isSuperAdmin = profile?.profileTypeId === 'super_admin';
            const isClubAdmin = profile?.profileTypeId === 'club_admin' && profile.clubId === clubId;
            const isCoach = profile?.profileTypeId === 'coach' && teamData.coachIds?.includes(userId);

            if (!isSuperAdmin && !isClubAdmin && !isCoach) {
                throw new Error("Acceso Denegado. No tienes permiso para gestionar este equipo.");
            }
            
            setHasPermission(true);
            setTeam(teamData);
            setPlayers(playersData);
            setCoaches(clubCoaches);
            setCoordinators(clubCoordinators);
            setCompetitionCategories(cats);
            setGameFormats(formats);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [clubId, teamId]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace(`/login?redirect=/clubs/${clubId}/teams/${teamId}`);
            return;
        }
        loadPageData(user.uid);
    }, [clubId, teamId, user, authLoading, router, loadPageData]);

    const handlePlayerDelete = async (player: Player) => {
        const result = await deletePlayer(player.id, clubId, teamId);
        if (result.success) {
            toast({ title: "Jugador Eliminado", description: `${player.firstName} ${player.lastName} ha sido eliminado.` });
            loadPageData(user!.uid);
        } else {
            toast({ variant: "destructive", title: "Error al Eliminar", description: result.error });
        }
    };
    
    if (authLoading || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Cargando detalles del equipo...</p>
            </div>
        );
    }
    
    if (error || !hasPermission) {
         return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl font-headline font-semibold text-destructive">Error</h1>
                <p className="text-muted-foreground mb-4">{error || "Ocurrió un error desconocido."}</p>
                 <Button asChild variant="outline">
                    <Link href="/dashboard">Volver al Panel</Link>
                </Button>
            </div>
        );
    }

    if (!team) return null;

    return (
        <div className="space-y-8">
            <nav className="flex items-center text-sm text-muted-foreground">
                <Link href={`/clubs/${clubId}`} className="hover:text-primary flex items-center"><Home className="mr-1 h-4 w-4"/>Inicio del Club</Link>
                <span className="mx-2">/</span>
                <span>Equipo: {team.name}</span>
            </nav>

            <Dialog open={!!playerToEdit} onOpenChange={(isOpen) => !isOpen && setPlayerToEdit(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Jugador</DialogTitle>
                        <DialogDescription>Actualiza los detalles de {playerToEdit?.firstName} {playerToEdit?.lastName}.</DialogDescription>
                    </DialogHeader>
                    <PlayerForm 
                        teamId={teamId}
                        clubId={clubId}
                        player={playerToEdit}
                        onFormSubmit={() => {
                            setPlayerToEdit(null);
                            loadPageData(user!.uid);
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Card className="shadow-xl">
                <CardHeader><CardTitle className="text-3xl font-headline font-bold text-primary">Gestionar Equipo: {team.name}</CardTitle></CardHeader>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Settings className="mr-3 h-6 w-6"/>Ajustes del Equipo</CardTitle>
                    <CardDescription>
                        Actualiza el nombre del equipo, la categoría y el personal asignado.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TeamForm
                        clubId={clubId}
                        team={team}
                        gameFormats={gameFormats}
                        competitionCategories={competitionCategories}
                        coaches={coaches}
                        coordinators={coordinators}
                        onFormSubmit={() => loadPageData(user!.uid)}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Users className="mr-3 h-6 w-6"/>Lista de Jugadores</CardTitle>
                    <CardDescription>
                        Lista de todos los jugadores inscritos en este equipo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {players.length === 0 ? (
                         <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold">No se encontraron jugadores</h2>
                            <p className="text-muted-foreground">Este equipo aún no tiene jugadores. Añade uno a continuación.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Apellido</TableHead>
                                    <TableHead>Dorsal #</TableHead>
                                    <TableHead>Posición</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {players.map(player => (
                                    <TableRow key={player.id}>
                                        <TableCell className="font-medium">{player.firstName}</TableCell>
                                        <TableCell>{player.lastName}</TableCell>
                                        <TableCell>{player.jerseyNumber || 'N/A'}</TableCell>
                                        <TableCell>{player.position || 'N/A'}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => setPlayerToEdit(player)}>
                                                <Edit className="mr-2 h-4 w-4" /> Editar
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                        <AlertDialogDescription>Esto eliminará permanentemente a {player.firstName} {player.lastName} de la lista.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handlePlayerDelete(player)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><UserPlus className="mr-3 h-6 w-6"/>Añadir Nuevo Jugador</CardTitle>
                    <CardDescription>
                        Rellena los datos para añadir un nuevo jugador a la plantilla del equipo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PlayerForm 
                        teamId={teamId} 
                        clubId={clubId} 
                        onFormSubmit={() => loadPageData(user!.uid)} 
                    />
                </CardContent>
            </Card>
        </div>
    );
}
```

---

## src/app/clubs/[clubId]/teams/new/page.tsx
```tsx
"use client";

import { TeamForm } from "@/components/teams/TeamForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Loader2, AlertTriangle, ChevronLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import type { GameFormat, CompetitionCategory, UserFirestoreProfile, Club } from "@/types";
import { getGameFormats } from "@/app/game-formats/actions";
import { getCompetitionCategories } from "@/app/competition-categories/actions";
import { getUserProfileById, getUsersByProfileTypeAndClub } from "@/app/users/actions";
import { getClubById } from "@/app/clubs/actions";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewTeamPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const clubId = typeof params.clubId === 'string' ? params.clubId : '';

  const [club, setClub] = useState<Club | null>(null);
  const [userProfile, setUserProfile] = useState<UserFirestoreProfile | null>(null);
  const [gameFormats, setGameFormats] = useState<GameFormat[]>([]);
  const [competitionCategories, setCompetitionCategories] = useState<CompetitionCategory[]>([]);
  const [coaches, setCoaches] = useState<UserFirestoreProfile[]>([]);
  const [coordinators, setCoordinators] = useState<UserFirestoreProfile[]>([]);
  
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?redirect=/clubs/${clubId}/teams/new`);
      return;
    }

    const loadPageData = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const [profile, fetchedClub, formats, categories, fetchedCoaches, fetchedCoordinators] = await Promise.all([
          getUserProfileById(user.uid),
          getClubById(clubId),
          getGameFormats(),
          getCompetitionCategories(),
          getUsersByProfileTypeAndClub('coach', clubId),
          getUsersByProfileTypeAndClub('coordinator', clubId)
        ]);
        
        const isSuperAdmin = profile?.profileTypeId === 'super_admin';
        const isClubAdmin = profile?.profileTypeId === 'club_admin' && profile.clubId === clubId;

        if (!isSuperAdmin && !isClubAdmin) {
            setError("Access Denied. You must be an admin for this club to create teams.");
            return;
        }

        if (!fetchedClub) {
          setError("The parent club could not be found.");
          return;
        }

        setUserProfile(profile);
        setClub(fetchedClub);
        setGameFormats(formats);
        setCompetitionCategories(categories);
        setCoaches(fetchedCoaches);
        setCoordinators(fetchedCoordinators);

      } catch (err: any) {
        console.error("Error loading new team page data:", err)
        setError("Failed to load data required for team creation.");
      } finally {
        setLoadingData(false);
      }
    };
    loadPageData();
  }, [user, authLoading, router, clubId]);
  
  if (authLoading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Loading team creator...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => router.push(`/clubs/${clubId}`)} className="mt-4">Back to Club</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href={`/clubs/${clubId}`}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Club Management
        </Link>
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <Users className="mr-3 h-8 w-8 text-primary" />
            Create New Team for {club?.name}
          </CardTitle>
          <CardDescription>Fill in the details below to register a new team under this club.</CardDescription>
        </CardHeader>
        <CardContent>
          <TeamForm 
            clubId={clubId} 
            gameFormats={gameFormats}
            competitionCategories={competitionCategories}
            coaches={coaches}
            coordinators={coordinators}
            onFormSubmit={() => {
                router.push(`/clubs/${clubId}`);
                router.refresh();
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/clubs/actions.ts
```ts
'use server';

import type { Club, ClubFormData } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

// This function will be used by the registration form to populate the clubs dropdown.
// It fetches all clubs to ensure new users can register.
export async function getApprovedClubs(): Promise<Club[]> {
  console.log("ClubActions: Attempting to fetch all clubs from Firestore using Admin SDK.");
  if (!adminDb) {
    console.warn("ClubActions (getApprovedClubs): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const clubsCollectionRef = adminDb.collection('clubs');
    // Query for all clubs and order them alphabetically by name
    const q = clubsCollectionRef.orderBy('name', 'asc');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.warn("ClubActions: No clubs found in 'clubs' collection. An index on 'name' (asc) may be required.");
      return [];
    }
    
    console.log(`ClubActions: Found ${querySnapshot.docs.length} clubs.`);
    
    const allClubs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Unnamed Club (ID: ${doc.id})`,
        shortName: data.shortName,
        province_name: data.province_name,
        city_name: data.city_name,
        logoUrl: data.logoUrl,
        approved: data.approved,
        createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
      } as Club; 
    });
    
    console.log("ClubActions: Successfully fetched and sorted all clubs using Admin SDK.");
    return allClubs;
  } catch (error: any) {
    console.error('ClubActions: Error fetching clubs with Admin SDK:', error.message, error.stack);
    if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("ClubActions: Firestore query failed. This is likely due to a missing Firestore index. Please create an index on the 'name' field (ascending) for the 'clubs' collection.");
    }
    return []; // Return empty array on error
  }
}

// Action to create a new club (likely for an admin)
export async function createClub(
  formData: ClubFormData,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  // In a real app, you would also check if the user has permission (e.g., is a super_admin)
  if (!adminDb) {
    return { success: false, error: 'Firebase Admin SDK not initialized.' };
  }
  try {
    const newClubData = {
      ...formData,
      approved: false, // New clubs should require approval
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('clubs').add(newClubData);
    revalidatePath('/clubs'); // Revalidate admin clubs page if it exists
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating club:', error);
    return { success: false, error: error.message || 'Failed to create club.' };
  }
}

// New action to update club approval status
export async function updateClubStatus(
  clubId: string,
  approved: boolean
): Promise<{ success: boolean; error?: string }> {
  console.log(`ClubActions: Attempting to update approved status for club ID: ${clubId} to '${approved}'.`);
  if (!clubId) {
    return { success: false, error: 'Club ID is required.' };
  }

  if (!adminDb) {
    console.error("ClubActions: Firebase Admin SDK is not initialized.");
    return { success: false, error: 'Server configuration error.' };
  }

  try {
    const clubRef = adminDb.collection('clubs').doc(clubId);
    await clubRef.update({
      approved: approved
    });
    console.log(`ClubActions: Successfully updated approved status for club ID: ${clubId} to '${approved}'.`);
    revalidatePath('/clubs'); // Revalidate the admin page
    revalidatePath(`/clubs/${clubId}`); // Revalidate the detail page
    return { success: true };
  } catch (error: any) {
    console.error(`ClubActions: Error updating status for club ID ${clubId}:`, error.message, error.stack);
    return { success: false, error: error.message || 'Failed to update club status.' };
  }
}

export async function getClubById(clubId: string): Promise<Club | null> {
    if (!adminDb) {
      console.error("ClubActions (getClubById): Admin SDK not initialized.");
      return null;
    }
    if (!clubId) {
      return null;
    }
    try {
        const clubDocRef = adminDb.collection('clubs').doc(clubId);
        const docSnap = await clubDocRef.get();

        if (!docSnap.exists) {
            console.warn(`ClubActions: No club found with ID: ${clubId}`);
            return null;
        }

        const data = docSnap.data()!;
        return {
            id: docSnap.id,
            name: data.name || `Unnamed Club (ID: ${docSnap.id})`,
            shortName: data.shortName,
            province_name: data.province_name,
            city_name: data.city_name,
            logoUrl: data.logoUrl,
            approved: data.approved,
            createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
        } as Club;

    } catch (error: any) {
        console.error(`ClubActions: Error fetching club by ID ${clubId}:`, error.message, error.stack);
        return null;
    }
}
```

---

## src/app/clubs/page.tsx
```tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserProfileById } from '@/app/users/actions';
import { getApprovedClubs, updateClubStatus } from '@/app/clubs/actions';
import type { Club } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Building, PlusCircle, CheckCircle, XCircle, Settings } from 'lucide-react';
import { ClubForm } from '@/components/clubs/ClubForm';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ManageClubsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user) {
        throw new Error("Authentication required.");
      }
      const profile = await getUserProfileById(user.uid);
      if (profile?.profileTypeId !== 'super_admin') {
        throw new Error('Access Denied. You must be a Super Admin to view this page.');
      }
      setIsSuperAdmin(true);

      const fetchedClubs = await getApprovedClubs(); // This now fetches all clubs
      setClubs(fetchedClubs);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/clubs');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router, fetchData]);

  const handleStatusUpdate = async (clubId: string, clubName: string, newStatus: boolean) => {
    const result = await updateClubStatus(clubId, newStatus);
    if (result.success) {
      toast({ title: "Status Updated", description: `Club ${clubName} has been ${newStatus ? 'approved' : 'un-approved'}.` });
      fetchData(); // Refresh data
    } else {
      toast({ variant: "destructive", title: "Update Failed", description: result.error });
    }
  };

  const getStatusBadgeVariant = (approved?: boolean): "default" | "destructive" | "secondary" => {
    if (approved === true) return 'default';
    if (approved === false) return 'destructive';
    return 'secondary'; // for undefined/null status
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Loading club data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
          <Building className="mr-3 h-10 w-10" /> Manage Clubs
        </h1>
        <p className="text-lg text-muted-foreground mt-1">View, approve, or create new clubs.</p>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>All Clubs</CardTitle>
          <CardDescription>
            Below is a list of all clubs in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clubs.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold">No Clubs Found</h2>
              <p className="text-muted-foreground">Create one below to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Club Name</TableHead>
                        <TableHead>Short Name</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {clubs.map((club) => (
                        <TableRow key={club.id}>
                        <TableCell className="font-medium">{club.name}</TableCell>
                        <TableCell>{club.shortName || 'N/A'}</TableCell>
                        <TableCell>{club.city_name || 'N/A'}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusBadgeVariant(club.approved)}>
                                {club.approved === true ? 'Approved' : club.approved === false ? 'Pending/Rejected' : 'Unknown'}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                             <Button asChild variant="outline" size="sm">
                                <Link href={`/clubs/${club.id}`}>
                                  <Settings className="mr-1 h-4 w-4" /> Manage
                                </Link>
                              </Button>
                             {club.approved !== true && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                                      <CheckCircle className="mr-1 h-4 w-4" /> Approve
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Approve Club?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to approve club {club.name}?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleStatusUpdate(club.id, club.name, true)}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        Approve
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            )}
                             {club.approved === true && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <XCircle className="mr-1 h-4 w-4" /> Un-Approve
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Revoke Approval?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to revoke approval for {club.name}? Users may not be able to register for this club.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleStatusUpdate(club.id, club.name, false)}
                                        className="bg-destructive hover:bg-destructive/80"
                                      >
                                        Revoke
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <PlusCircle className="mr-3 h-8 w-8 text-primary" />
            Create New Club
          </CardTitle>
          <CardDescription>Fill in the details to register a new club. It will require approval.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClubForm onFormSubmit={fetchData} />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/competition-categories/actions.ts
```ts
'use server';

import type { CompetitionCategory, CompetitionCategoryFormData } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

export async function getCompetitionCategories(): Promise<CompetitionCategory[]> {
  console.log("CompetitionCategoryActions: Attempting to fetch competition categories from Firestore using Admin SDK.");
  if (!adminDb) {
    console.warn("CompetitionCategoryActions (getCompetitionCategories): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const categoriesCollectionRef = adminDb.collection('competitionCategories');
    const querySnapshot = await categoriesCollectionRef.get();

    if (querySnapshot.empty) {
      console.warn("CompetitionCategoryActions: No documents found in 'competitionCategories' collection.");
      return [];
    }
    
    console.log(`CompetitionCategoryActions: Found ${querySnapshot.docs.length} documents in 'competitionCategories' collection.`);
    
    const allCategories = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Unnamed Category (ID: ${doc.id})`,
        description: data.description,
        level: data.level,
        gameFormatId: data.gameFormatId,
        createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
      } as CompetitionCategory; 
    });
    
    allCategories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    console.log("CompetitionCategoryActions: Successfully fetched and sorted categories using Admin SDK.");
    return allCategories;
  } catch (error: any) {
    console.error('CompetitionCategoryActions: Error fetching competition categories with Admin SDK:', error.message, error.stack);
    return [];
  }
}

export async function createCompetitionCategory(
  formData: CompetitionCategoryFormData,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  if (!adminDb) {
    return { success: false, error: 'Database not initialized.' };
  }
  try {
    const newCategoryData = {
      ...formData,
      level: Number(formData.level) || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
    };

    const docRef = await adminDb.collection('competitionCategories').add(newCategoryData);
    revalidatePath('/admin/competition-categories');
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating competition category:', error);
    return { success: false, error: error.message || 'Failed to create category.' };
  }
}

export async function updateCompetitionCategory(
    categoryId: string,
    formData: CompetitionCategoryFormData,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: 'User not authenticated.' };
    if (!adminDb) return { success: false, error: 'Database not initialized.' };
    
    try {
        const categoryRef = adminDb.collection('competitionCategories').doc(categoryId);
        const updateData = {
            ...formData,
            level: Number(formData.level) || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await categoryRef.update(updateData);
        revalidatePath('/admin/competition-categories');
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating category ${categoryId}:`, error);
        return { success: false, error: error.message || 'Failed to update category.' };
    }
}

export async function deleteCompetitionCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized.' };
    try {
        await adminDb.collection('competitionCategories').doc(categoryId).delete();
        revalidatePath('/admin/competition-categories');
        return { success: true };
    } catch (error: any) {
        console.error(`Error deleting category ${categoryId}:`, error);
        return { success: false, error: error.message || 'Failed to delete category.' };
    }
}
```

---

## src/app/dashboard/page.tsx
```tsx
"use client";

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Building, CheckSquare, Users, AlertTriangle, PlusCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUserProfileById } from '@/app/users/actions';
import type { UserFirestoreProfile } from '@/types';
import { useRouter } from 'next/navigation';

// Dummy data - replace with actual data fetching
const summaryData = {
  activeProjects: 5,
  completedTasks: 120,
  teamMembers: 15,
  alerts: 2,
};

// Placeholder for API data state
interface ApiData {
  keyMetric: string;
  value: number | string;
}
const bcsjdApiSampleData: ApiData[] = [
  { keyMetric: "Progreso General", value: "75%" },
  { keyMetric: "Uso del Presupuesto", value: "60%" },
];


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserFirestoreProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    // The middleware is now responsible for ensuring only authenticated users reach this page.
    // So, we expect the `user` object to be available shortly after `authLoading` is false.
    if (user) {
      console.log(`Dashboard: User authenticated. Fetching profile for UID: ${user.uid}`);
      setLoadingProfile(true);
      setProfileError(null);
      getUserProfileById(user.uid)
        .then(profile => {
          if (profile) {
            console.log("Dashboard: Successfully fetched profile data:", profile);
            setUserProfile(profile);
          } else {
            console.error("Dashboard: getUserProfileById returned null. This means no profile document was found for the UID in 'user_profiles' collection or there was a permission issue.");
            setProfileError("No se pudo encontrar tu perfil de usuario en la base de datos. Podría ser un problema de permisos. Por favor, contacta a un administrador.");
            setUserProfile(null);
          }
        })
        .catch(err => {
          console.error("Dashboard: An error occurred while fetching user profile:", err);
          setProfileError("Ocurrió un error al cargar tu perfil. Por favor, inténtalo de nuevo más tarde.");
          setUserProfile(null);
        })
        .finally(() => {
          console.log("Dashboard: Finished fetching profile.");
          setLoadingProfile(false);
        });
    } else if (!authLoading && !user) {
      // This is a failsafe. If for any reason an unauthenticated user gets here
      // (e.g., session expires while on page), redirect them.
      console.warn("Dashboard: Failsafe triggered. Unauthenticated user detected. Redirecting to login.");
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // A single, reliable loading state. Middleware ensures we don't need an "unauthenticated" UI here.
  // We wait for auth to be confirmed (`!authLoading && user`) before proceeding to render the dashboard.
  if (authLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-headline font-semibold">Verificando sesión...</h1>
        <p className="text-muted-foreground">Por favor, espera.</p>
      </div>
    );
  }

  const renderClubManagement = () => {
    if (loadingProfile) {
      return (
        <div className="flex items-center">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span>Cargando información de usuario...</span>
        </div>
      );
    }

    if (profileError) {
      return (
        <div className="flex items-center text-destructive p-4 bg-destructive/10 rounded-md">
          <AlertTriangle className="mr-3 h-5 w-5 flex-shrink-0" />
          <span>{profileError}</span>
        </div>
      );
    }
    
    if (userProfile?.profileTypeId === 'super_admin') {
      return (
        <>
          <p className="text-sm text-muted-foreground">
            Como Super Admin, tienes control total sobre clubs y equipos.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button asChild>
              <Link href={`/clubs`}>
                <Building className="mr-2 h-5 w-5" /> Gestionar Clubs
              </Link>
            </Button>
          </div>
        </>
      );
    }
    
    if (userProfile?.clubId) {
       return (
        <>
          <p className="text-sm text-muted-foreground">
            Puedes gestionar los equipos de tu club.
          </p>
          <Button asChild>
            <Link href={`/clubs/${userProfile.clubId}`}>
              <Users className="mr-2 h-5 w-5" /> Gestionar mi Club
            </Link>
          </Button>
        </>
      );
    }

    // Fallback for non-super-admin users without a clubId, or if profile is somehow empty but not errored.
    return (
      <div className="flex items-center text-muted-foreground">
        <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
        <span>Tu perfil no está asociado a un club. La gestión de equipos está desactivada.</span>
      </div>
    );
  };
  
  // From here on, we can safely assume `user` exists.
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-card rounded-lg shadow-lg">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary">¡Bienvenido, {user.displayName || user.email}!</h1>
          <p className="text-lg text-muted-foreground mt-1">Este es un resumen de tu espacio de trabajo en BCSJD.</p>
        </div>
        <Image 
          src="https://placehold.co/150x150.png" 
          alt="Avatar de usuario o imagen decorativa" 
          width={100} 
          height={100} 
          className="rounded-full shadow-md hidden sm:block"
          data-ai-hint="professional avatar"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <Building className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summaryData.activeProjects}</div>
            <p className="text-xs text-muted-foreground">+2 desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
            <CheckSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summaryData.completedTasks}</div>
            <p className="text-xs text-muted-foreground">+15 esta semana</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miembros del Equipo</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summaryData.teamMembers}</div>
            <p className="text-xs text-muted-foreground">Todos activos</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticas (Ejemplo)</CardTitle>
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summaryData.alerts}</div>
            <p className="text-xs text-muted-foreground">Esto es una tarjeta de ejemplo</p>
          </CardContent>
        </Card>
      </div>

      {/* Club & Team Management Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            Gestión de Club y Equipos
          </CardTitle>
          <CardDescription>Gestiona los detalles de tu club y crea nuevos equipos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderClubManagement()}
        </CardContent>
      </Card>

      {/* BCSJD API Data Section (Placeholder) */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <BarChart className="mr-3 h-6 w-6 text-accent" />
            Resumen de la API de BCSJD
          </CardTitle>
          <CardDescription>Métricas clave obtenidas de la API integrada de BCSJD.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {bcsjdApiSampleData.map((item) => (
            <div key={item.keyMetric} className="p-4 border rounded-md bg-secondary/30">
              <h3 className="text-sm font-medium text-muted-foreground">{item.keyMetric}</h3>
              <p className="text-2xl font-bold text-primary">{item.value}</p>
            </div>
          ))}
           <div className="p-4 border rounded-md bg-secondary/30 flex items-center justify-center">
             <Image 
                src="https://placehold.co/300x150.png" 
                alt="Gráfico de ejemplo" 
                width={300} 
                height={150} 
                className="rounded shadow"
                data-ai-hint="data chart"
              />
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/game-formats/actions.ts
```ts
'use server';

import type { GameFormat, GameFormatFormData } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

export async function getGameFormats(): Promise<GameFormat[]> {
  console.log("GameFormatActions: Attempting to fetch game formats from Firestore using Admin SDK.");
  if (!adminDb) {
    console.warn("GameFormatActions (getGameFormats): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const gameFormatsCollectionRef = adminDb.collection('gameFormats');
    const querySnapshot = await gameFormatsCollectionRef.get();

    if (querySnapshot.empty) {
      console.warn("GameFormatActions: No documents found in 'gameFormats' collection.");
      return [];
    }
    
    console.log(`GameFormatActions: Found ${querySnapshot.docs.length} documents in 'gameFormats' collection.`);
    
    const allGameFormats = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Unnamed Format (ID: ${doc.id})`,
        description: data.description,
        numPeriods: data.numPeriods,
        periodDurationMinutes: data.periodDurationMinutes,
        defaultTotalTimeouts: data.defaultTotalTimeouts,
        minPeriodsPlayerMustPlay: data.minPeriodsPlayerMustPlay,
        createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
      } as GameFormat; 
    });
    
    allGameFormats.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    console.log("GameFormatActions: Successfully fetched and sorted game formats using Admin SDK.");
    return allGameFormats;
  } catch (error: any) {
    console.error('GameFormatActions: Error fetching game formats with Admin SDK:', error.message, error.stack);
    return [];
  }
}

export async function getGameFormatById(formatId: string): Promise<GameFormat | null> {
    if (!adminDb) return null;
    try {
        const docRef = adminDb.collection('gameFormats').doc(formatId);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            return null;
        }
        const data = docSnap.data() as Omit<GameFormat, 'id' | 'createdAt'> & { createdAt: admin.firestore.Timestamp };
        return { 
            id: docSnap.id, 
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
        } as GameFormat;
    } catch (error) {
        console.error(`Error getting game format by id ${formatId}:`, error);
        return null;
    }
}


export async function createGameFormat(
  formData: GameFormatFormData,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  if (!adminDb) {
    return { success: false, error: 'Database not initialized.' };
  }
  try {
    const newFormatData = {
      ...formData,
      numPeriods: Number(formData.numPeriods) || null,
      periodDurationMinutes: Number(formData.periodDurationMinutes) || null,
      defaultTotalTimeouts: Number(formData.defaultTotalTimeouts) || null,
      minPeriodsPlayerMustPlay: Number(formData.minPeriodsPlayerMustPlay) || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
    };

    const docRef = await adminDb.collection('gameFormats').add(newFormatData);
    revalidatePath('/admin/game-formats');
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating game format:', error);
    return { success: false, error: error.message || 'Failed to create format.' };
  }
}

export async function updateGameFormat(
    formatId: string,
    formData: GameFormatFormData,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: 'User not authenticated.' };
    if (!adminDb) return { success: false, error: 'Database not initialized.' };
    
    try {
        const formatRef = adminDb.collection('gameFormats').doc(formatId);
        const updateData = {
            ...formData,
            numPeriods: Number(formData.numPeriods) || null,
            periodDurationMinutes: Number(formData.periodDurationMinutes) || null,
            defaultTotalTimeouts: Number(formData.defaultTotalTimeouts) || null,
            minPeriodsPlayerMustPlay: Number(formData.minPeriodsPlayerMustPlay) || null,
        };
        await formatRef.update(updateData);
        revalidatePath('/admin/game-formats');
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating format ${formatId}:`, error);
        return { success: false, error: error.message || 'Failed to update format.' };
    }
}

export async function deleteGameFormat(formatId: string): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized.' };
    try {
        await adminDb.collection('gameFormats').doc(formatId).delete();
        revalidatePath('/admin/game-formats');
        return { success: true };
    } catch (error: any) {
        console.error(`Error deleting format ${formatId}:`, error);
        return { success: false, error: error.message || 'Failed to delete format.' };
    }
}
```

---

## src/app/games/[gameId]/live/page.tsx
```tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { updateLiveGameState, recordShot, incrementGameStat } from '@/app/games/actions';
import { getGameFormatById } from '@/app/game-formats/actions';
import type { Game, GameFormat, TeamStats } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, ChevronLeft, Gamepad2, Minus, Plus, Play, Flag, Pause, TimerReset, FastForward, Timer as TimerIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const StatButton = ({ children, ...props }: React.ComponentProps<typeof Button>) => (
    <Button variant="outline" size="sm" {...props}>{children}</Button>
);

const ShotButton = ({ children, ...props }: React.ComponentProps<typeof Button>) => (
    <Button variant="secondary" className="w-full" {...props}>{children}</Button>
);

export default function LiveGamePage() {
    const params = useParams();
    const { toast } = useToast();
    const gameId = typeof params.gameId === 'string' ? params.gameId : '';
    const { user, loading: authLoading } = useAuth();

    const [game, setGame] = useState<Game | null>(null);
    const [gameFormat, setGameFormat] = useState<GameFormat | null>(null);
    const [displayTime, setDisplayTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [localTimer, setLocalTimer] = useState<NodeJS.Timeout | null>(null);

    const handleUpdate = useCallback(async (updates: Partial<Game>) => {
        const result = await updateLiveGameState(gameId, updates);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error al Actualizar', description: result.error });
        }
    }, [gameId, toast]);

    const handleToggleTimer = useCallback(() => {
        if (!game) return;
        const newIsTimerRunning = !game.isTimerRunning;
        
        // When stopping, we save the current displayed time.
        // When starting, the next onSnapshot will handle the time.
        const updates: Partial<Game> = { isTimerRunning: newIsTimerRunning };
        if (!newIsTimerRunning) {
             updates.periodTimeRemainingSeconds = displayTime;
        }

        handleUpdate(updates);
    }, [game, displayTime, handleUpdate]);


    useEffect(() => {
        if (!gameId) {
            setError("ID del partido no encontrado.");
            setLoading(false);
            return;
        }
        const gameRef = doc(db, 'games', gameId);
        const unsubscribe = onSnapshot(gameRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const gameData = { id: docSnap.id, ...data, date: data.date.toDate() } as Game;
                setGame(gameData);
                
                // Set the display time from Firestore, this is our source of truth.
                setDisplayTime(gameData.periodTimeRemainingSeconds ?? 0);

                if (!gameFormat && gameData.gameFormatId) {
                    const format = await getGameFormatById(gameData.gameFormatId);
                    setGameFormat(format);
                }
            } else {
                setError("El partido no existe o ha sido eliminado.");
            }
            setLoading(false);
        }, (err) => {
            console.error("Error en el listener del partido:", err);
            setError("No se pudo conectar para recibir actualizaciones en tiempo real.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [gameId, gameFormat]);
    
    // Effect for local countdown timer
    useEffect(() => {
       if (localTimer) {
           clearInterval(localTimer);
           setLocalTimer(null);
       }
       if (game?.isTimerRunning && displayTime > 0) {
           const timerId = setInterval(() => {
               setDisplayTime(prev => prev > 0 ? prev - 1 : 0);
           }, 1000);
           setLocalTimer(timerId);
       }
       return () => {
           if (localTimer) clearInterval(localTimer);
       };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [game?.isTimerRunning]);


    
    const handleRecordShot = async (team: 'home' | 'away', points: 1 | 2 | 3, type: 'made' | 'miss') => {
        if (!game || game.status !== 'inprogress') return;
        const result = await recordShot(gameId, team, points, type);
        if (!result.success) {
             toast({ variant: 'destructive', title: 'Error al registrar tiro', description: result.error });
        }
    };

    const handleIncrementStat = async (team: 'home' | 'away', stat: 'fouls' | 'timeouts' | 'steals', value: number) => {
         if (!game || game.status !== 'inprogress') return;
         const result = await incrementGameStat(gameId, team, stat, value);
         if (!result.success) {
             toast({ variant: 'destructive', title: `Error al registrar ${stat}`, description: result.error });
        }
    };

    const handleNextPeriod = () => {
        if (!game || !gameFormat) return;
        const currentPeriod = game.currentPeriod || 1;
        const maxPeriods = gameFormat.numPeriods || 4;
        if (currentPeriod < maxPeriods) {
            handleUpdate({
                currentPeriod: currentPeriod + 1,
                isTimerRunning: false,
                periodTimeRemainingSeconds: (gameFormat.periodDurationMinutes || 10) * 60,
            });
        }
    };

    const handleResetTimer = () => {
        if (!game || !gameFormat) return;
        handleUpdate({
            isTimerRunning: false,
            periodTimeRemainingSeconds: (gameFormat.periodDurationMinutes || 10) * 60,
        });
    };

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };
    
    if (loading || authLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Cargando datos del partido en vivo...</p>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl font-headline font-semibold text-destructive">Error</h1>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button asChild variant="outline">
                    <Link href={`/games/${gameId}`}>Volver a detalles del partido</Link>
                </Button>
            </div>
        );
    }
    
    if (!game) return null;

    const TeamPanel = ({ teamType }: { teamType: 'home' | 'away' }) => {
        const teamName = teamType === 'home' ? game.homeTeamName : game.awayTeamName;
        const teamStats = (teamType === 'home' ? game.homeTeamStats : game.awayTeamStats) || {} as TeamStats;
        const score = teamType === 'home' ? game.homeTeamScore : game.awayTeamScore;

        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="truncate">{teamName}</CardTitle>
                    <CardDescription>Equipo {teamType === 'home' ? 'Local' : 'Visitante'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-8xl font-bold text-primary text-center">{score ?? 0}</div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                        <h4 className="font-medium text-center">Registro de Tiros</h4>
                        <div className="grid grid-cols-2 gap-2">
                           <ShotButton onClick={() => handleRecordShot(teamType, 1, 'made')}>+1 Pto</ShotButton>
                           <ShotButton variant="destructive" onClick={() => handleRecordShot(teamType, 1, 'miss')}>Fallo 1 Pto</ShotButton>
                           <ShotButton onClick={() => handleRecordShot(teamType, 2, 'made')}>+2 Ptos</ShotButton>
                           <ShotButton variant="destructive" onClick={() => handleRecordShot(teamType, 2, 'miss')}>Fallo 2 Ptos</ShotButton>
                           <ShotButton onClick={() => handleRecordShot(teamType, 3, 'made')}>+3 Ptos</ShotButton>
                           <ShotButton variant="destructive" onClick={() => handleRecordShot(teamType, 3, 'miss')}>Fallo 3 Ptos</ShotButton>
                        </div>
                    </div>
                    
                    <Separator />

                    <div className="space-y-3">
                         <h4 className="font-medium text-center">Otras Estadísticas</h4>
                         <div className="flex justify-between items-center">
                            <span className="font-semibold">Faltas: {teamStats.fouls ?? 0}</span>
                            <div className="space-x-1">
                                <StatButton size="icon" onClick={() => handleIncrementStat(teamType, 'fouls', 1)}><Plus/></StatButton>
                                <StatButton size="icon" onClick={() => handleIncrementStat(teamType, 'fouls', -1)}><Minus/></StatButton>
                            </div>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="font-semibold">T. Muertos: {teamStats.timeouts ?? 0}</span>
                             <div className="space-x-1">
                                <StatButton size="icon" onClick={() => handleIncrementStat(teamType, 'timeouts', 1)}><Plus/></StatButton>
                                <StatButton size="icon" onClick={() => handleIncrementStat(teamType, 'timeouts', -1)}><Minus/></StatButton>
                            </div>
                         </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Robos: {teamStats.steals ?? 0}</span>
                             <div className="space-x-1">
                                <StatButton size="icon" onClick={() => handleIncrementStat(teamType, 'steals', 1)}><Plus/></StatButton>
                                <StatButton size="icon" onClick={() => handleIncrementStat(teamType, 'steals', -1)}><Minus/></StatButton>
                            </div>
                         </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-8">
             <Button variant="outline" size="sm" asChild>
                <Link href={`/games`}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Volver a la Lista de Partidos
                </Link>
            </Button>
            
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Control del Partido</CardTitle>
                </CardHeader>
                <CardContent>
                    {game.status === 'scheduled' && (
                        <Button size="lg" className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleUpdate({ status: 'inprogress', periodTimeRemainingSeconds: (gameFormat?.periodDurationMinutes || 10) * 60 })}>
                            <Play className="mr-2 h-5 w-5"/> Empezar Partido
                        </Button>
                    )}
                    {game.status === 'inprogress' && (
                        <Button size="lg" variant="destructive" className="w-full" onClick={() => handleUpdate({ status: 'completed', isTimerRunning: false })}>
                            <Flag className="mr-2 h-5 w-5"/> Finalizar Partido
                        </Button>
                    )}
                    {game.status === 'completed' && <p className="text-center font-bold text-lg text-green-700">Partido Finalizado</p>}
                </CardContent>
            </Card>

            {game.status !== 'scheduled' && (
                 <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2"><TimerIcon/> Tiempo y Período</CardTitle>
                        <CardDescription>Período: {game.currentPeriod || 'N/A'} de {gameFormat?.numPeriods || 'N/A'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-8xl font-mono text-center tracking-tighter py-4 bg-secondary text-secondary-foreground rounded-lg">
                            {formatTime(displayTime)}
                        </div>
                        <div className="flex justify-center gap-2">
                            <Button onClick={handleToggleTimer} disabled={game.status !== 'inprogress'} size="lg">
                                {game.isTimerRunning ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                                {game.isTimerRunning ? 'Pausar' : 'Iniciar'}
                            </Button>
                             <Button onClick={handleNextPeriod} disabled={game.status !== 'inprogress' || game.isTimerRunning || (game.currentPeriod || 0) >= (gameFormat?.numPeriods || 4)} variant="outline" size="lg">
                                <FastForward className="mr-2"/> Siguiente Per.
                            </Button>
                             <Button onClick={handleResetTimer} disabled={game.status !== 'inprogress'} variant="secondary" size="icon" aria-label="Reiniciar cronómetro"><TimerReset/></Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TeamPanel teamType="home" />
                <TeamPanel teamType="away" />
            </div>
        </div>
    )
}
```

---

## src/app/games/[gameId]/page.tsx
```tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Actions
import { getGameById, updateGameRoster } from '@/app/games/actions';
import { getPlayersByTeamId } from '@/app/players/actions';
import { getTeamsByCoach, getTeamById } from '@/app/teams/actions';
import { getUserProfileById } from '@/app/users/actions';


// Types
import type { Game, Player, Team } from '@/types';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, ChevronLeft, Users, Save, ShieldCheck, Gamepad2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


export default function ManageGamePage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const gameId = typeof params.gameId === 'string' ? params.gameId : '';

    const [game, setGame] = useState<Game | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [managedTeam, setManagedTeam] = useState<Team | null>(null);
    const [isHomeTeam, setIsHomeTeam] = useState(false);
    const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
    
    const [loadingData, setLoadingData] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPageData = useCallback(async (userId: string) => {
        setLoadingData(true);
        setError(null);
        try {
            if (!gameId) {
                throw new Error("Falta el ID del partido en la URL.");
            }
            
            const [profile, gameData] = await Promise.all([
                getUserProfileById(userId),
                getGameById(gameId)
            ]);

            if (!profile) throw new Error("No se pudo encontrar tu perfil de usuario.");
            if (!gameData) throw new Error("Partido no encontrado.");
            setGame(gameData);
            
            const coachTeams = await getTeamsByCoach(userId);
            const isCoachOfHomeTeam = coachTeams.some(t => t.id === gameData.homeTeamId);
            const isCoachOfAwayTeam = coachTeams.some(t => t.id === gameData.awayTeamId);

            const isSuperAdmin = profile.profileTypeId === 'super_admin';
            const isClubAdminForGame = (profile.profileTypeId === 'club_admin' || profile.profileTypeId === 'coordinator') && (profile.clubId === gameData.homeTeamClubId || profile.clubId === gameData.awayTeamClubId);
            
            const hasPermission = isSuperAdmin || isClubAdminForGame || isCoachOfHomeTeam || isCoachOfAwayTeam;
            
            if (!hasPermission) {
                throw new Error("No tienes permiso para gestionar este partido.");
            }

            let teamToManageId: string | null = null;
            let isHome = false;

            if (isCoachOfHomeTeam) {
                teamToManageId = gameData.homeTeamId;
                isHome = true;
            } else if (isCoachOfAwayTeam) {
                teamToManageId = gameData.awayTeamId;
                isHome = false;
            } else if ((isSuperAdmin || isClubAdminForGame) && (profile.clubId === gameData.homeTeamClubId || isSuperAdmin)) {
                teamToManageId = gameData.homeTeamId;
                isHome = true;
            } else if (isClubAdminForGame && profile.clubId === gameData.awayTeamClubId) {
                 teamToManageId = gameData.awayTeamId;
                 isHome = false;
            }

            if (!teamToManageId) {
                if(isSuperAdmin) {
                    teamToManageId = gameData.homeTeamId;
                    isHome = true;
                } else {
                    throw new Error("No se pudo determinar qué equipo gestionar.");
                }
            }
            
            setIsHomeTeam(isHome);
            
            const teamToManage = await getTeamById(teamToManageId);
            if (!teamToManage) throw new Error("No se pudieron cargar los datos del equipo a gestionar.");
            setManagedTeam(teamToManage);
            
            const teamPlayers = await getPlayersByTeamId(teamToManageId);
            setPlayers(teamPlayers);
            
            const initialSelected = isHome ? gameData.homeTeamPlayerIds : gameData.awayTeamPlayerIds;
            setSelectedPlayers(new Set(initialSelected || []));

        } catch (err: any) {
            setError(err.message || "Error al cargar los datos del partido.");
        } finally {
            setLoadingData(false);
        }
    }, [gameId]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace(`/login?redirect=/games/${gameId}`);
            return;
        }
        loadPageData(user.uid);
    }, [gameId, user, authLoading, router, loadPageData]);
    
    const handlePlayerSelection = (playerId: string) => {
        setSelectedPlayers(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(playerId)) {
                newSelection.delete(playerId);
            } else {
                newSelection.add(playerId);
            }
            return newSelection;
        });
    };

    const handleSaveRoster = async () => {
        if (!game || !managedTeam) return;
        setSaving(true);
        const result = await updateGameRoster(game.id, Array.from(selectedPlayers), isHomeTeam);
        if (result.success) {
            toast({ title: "Convocatoria Guardada", description: "La lista de jugadores ha sido actualizada para este partido." });
        } else {
            toast({ variant: "destructive", title: "Error al Guardar", description: result.error });
        }
        setSaving(false);
    };

    if (authLoading || loadingData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Cargando datos del partido...</p>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl font-headline font-semibold text-destructive">Error</h1>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button asChild variant="outline">
                    <Link href="/games">Volver a la Lista de Partidos</Link>
                </Button>
            </div>
        );
    }

    if (!game) {
        return null;
    }

    return (
        <div className="space-y-8">
            <Button variant="outline" size="sm" asChild>
                <Link href="/games">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Volver a la Lista de Partidos
                </Link>
            </Button>

            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-4xl font-headline font-bold text-primary">
                       {game.homeTeamName} vs {game.awayTeamName}
                    </CardTitle>
                    <CardDescription className="text-lg">
                       {format(game.date, 'PPPP p', { locale: es })} en {game.location}
                    </CardDescription>
                </CardHeader>
            </Card>

            {['scheduled', 'inprogress'].includes(game.status) && (
                 <Card className="shadow-xl bg-green-50 border-green-200">
                    <CardHeader>
                        <CardTitle className="flex items-center text-green-800"><Gamepad2 className="mr-3 h-6 w-6"/>Panel de Partido en Vivo</CardTitle>
                        <CardDescription className="text-green-700">
                            {game.status === 'scheduled' ? 'La convocatoria está lista. Es hora de empezar el partido.' : 'El partido está en progreso. Ve al panel para continuar.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 w-full">
                            <Link href={`/games/${game.id}/live`}>
                                {game.status === 'scheduled' ? 'Empezar Partido y Registrar Puntuación' : 'Ir al Partido en Vivo'}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center"><ShieldCheck className="mr-3 h-6 w-6"/>Convocatoria para {managedTeam?.name}</CardTitle>
                    <CardDescription>
                        Selecciona los jugadores que participarán en este partido.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {players.length === 0 ? (
                         <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold">No hay Jugadores en la Plantilla</h2>
                            <p className="text-muted-foreground">Este equipo aún no tiene jugadores. Puedes añadirlos en la página de gestión del equipo.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {players.map(player => (
                                    <div key={player.id} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50">
                                        <Checkbox 
                                            id={`player-${player.id}`}
                                            checked={selectedPlayers.has(player.id)}
                                            onCheckedChange={() => handlePlayerSelection(player.id)}
                                        />
                                        <Label htmlFor={`player-${player.id}`} className="cursor-pointer">
                                            {player.firstName} {player.lastName} (#{player.jerseyNumber || 'N/A'})
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={handleSaveRoster} disabled={saving}>
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {saving ? 'Guardando...' : 'Guardar Convocatoria'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
```

---

## src/app/games/actions.ts
```ts
'use server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Game, GameFormData, Team, TeamStats } from '@/types';
import { getTeamsByCoach as getCoachTeams } from '@/app/teams/actions';

// Action to create a new game
export async function createGame(formData: GameFormData, userId: string): Promise<{ success: boolean; error?: string; id?: string }> {
    if (!userId) return { success: false, error: "User not authenticated." };
    if (!adminDb) return { success: false, error: "Database not initialized."};

    try {
        const [homeTeamSnap, awayTeamSnap] = await Promise.all([
            adminDb.collection('teams').doc(formData.homeTeamId).get(),
            adminDb.collection('teams').doc(formData.awayTeamId).get()
        ]);

        if (!homeTeamSnap.exists || !awayTeamSnap.exists) {
            return { success: false, error: "One or both teams could not be found." };
        }
        const homeTeamData = homeTeamSnap.data() as Team;
        const awayTeamData = awayTeamSnap.data() as Team;

        const gameDateTime = new Date(`${formData.date}T${formData.time}`);
        
        const initialStats: TeamStats = {
            onePointAttempts: 0, onePointMade: 0,
            twoPointAttempts: 0, twoPointMade: 0,
            threePointAttempts: 0, threePointMade: 0,
            fouls: 0, timeouts: 0, steals: 0,
        };

        const newGameData = {
            homeTeamId: formData.homeTeamId,
            homeTeamClubId: homeTeamData.clubId,
            homeTeamName: homeTeamData.name,
            awayTeamId: formData.awayTeamId,
            awayTeamClubId: awayTeamData.clubId,
            awayTeamName: awayTeamData.name,
            date: admin.firestore.Timestamp.fromDate(gameDateTime),
            location: formData.location,
            status: 'scheduled',
            seasonId: formData.seasonId,
            competitionCategoryId: formData.competitionCategoryId,
            gameFormatId: formData.gameFormatId || null,
            createdBy: userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            homeTeamScore: 0,
            awayTeamScore: 0,
            homeTeamStats: initialStats,
            awayTeamStats: initialStats,
            currentPeriod: 1,
            isTimerRunning: false,
            periodTimeRemainingSeconds: 0,
        };

        const docRef = await adminDb.collection('games').add(newGameData);
        revalidatePath('/games');
        return { success: true, id: docRef.id };

    } catch (error: any) {
        console.error('Error creating game:', error);
        return { success: false, error: error.message || "Failed to create game."};
    }
}

export async function getAllGames(): Promise<Game[]> {
    if (!adminDb) return [];
    try {
        const gamesRef = adminDb.collection('games');
        const snapshot = await gamesRef.orderBy('date', 'desc').get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date.toDate(),
                createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
                updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
            } as Game;
        });
    } catch (error: any) {
        console.error("Error fetching all games: ", error);
        if (error.code === 'failed-precondition') {
             console.error("Firestore query failed, missing index. Please create an index on 'games' collection by 'date' descending.");
        }
        return [];
    }
}

export async function getGamesByClub(clubId: string): Promise<Game[]> {
    if (!adminDb || !clubId) return [];
    try {
        const gamesRef = adminDb.collection('games');
        const homeGamesQuery = gamesRef.where('homeTeamClubId', '==', clubId).orderBy('date', 'desc').get();
        const awayGamesQuery = gamesRef.where('awayTeamClubId', '==', clubId).orderBy('date', 'desc').get();

        const [homeGamesSnap, awayGamesSnap] = await Promise.all([homeGamesQuery, awayGamesQuery]);
        
        const gamesMap = new Map<string, Game>();
        const processSnapshot = (snap: admin.firestore.QuerySnapshot) => {
            snap.forEach(doc => {
                const gameData = doc.data();
                gamesMap.set(doc.id, {
                    id: doc.id,
                    ...gameData,
                    date: gameData.date.toDate(),
                } as Game);
            });
        };

        processSnapshot(homeGamesSnap);
        processSnapshot(awayGamesSnap);

        const games = Array.from(gamesMap.values());
        games.sort((a, b) => b.date.getTime() - a.date.getTime());

        return games;
    } catch (error: any) {
        console.error("Error fetching games by club:", error);
         if (error.code === 'failed-precondition') {
             console.error("Firestore query failed, missing index. Please create composite indexes on 'games' for (homeTeamClubId, date desc) and (awayTeamClubId, date desc).");
        }
        return [];
    }
}


export async function getGamesByCoach(userId: string): Promise<Game[]> {
    if (!adminDb) return [];
    try {
        const coachTeams = await getCoachTeams(userId);
        if (coachTeams.length === 0) {
            return [];
        }

        const teamIds = coachTeams.map(team => team.id);
        
        const gamesRef = adminDb.collection('games');
        const homeGamesQuery = gamesRef.where('homeTeamId', 'in', teamIds).get();
        const awayGamesQuery = gamesRef.where('awayTeamId', 'in', teamIds).get();

        const [homeGamesSnap, awayGamesSnap] = await Promise.all([homeGamesQuery, awayGamesQuery]);

        const gamesMap = new Map<string, Game>();
        const processSnapshot = (snap: admin.firestore.QuerySnapshot) => {
             snap.forEach(doc => {
                const gameData = doc.data();
                gamesMap.set(doc.id, {
                    id: doc.id,
                    ...gameData,
                    date: gameData.date.toDate(),
                } as Game);
            });
        };
       
        processSnapshot(homeGamesSnap);
        processSnapshot(awayGamesSnap);

        const games = Array.from(gamesMap.values());
        games.sort((a, b) => b.date.getTime() - a.date.getTime());

        return games;
    } catch (error: any) {
        console.error("Error fetching games by coach:", error);
        return [];
    }
}

export async function getGameById(gameId: string): Promise<Game | null> {
    if (!adminDb) return null;
    try {
        const gameRef = adminDb.collection('games').doc(gameId);
        const docSnap = await gameRef.get();
        if (!docSnap.exists) {
            console.warn(`Could not find game with ID: ${gameId}`);
            return null;
        }
        const data = docSnap.data()!;
        return {
            id: docSnap.id,
            ...data,
            date: data.date.toDate(),
        } as Game;
    } catch (error: any) {
        console.error(`Error fetching game by ID ${gameId}:`, error);
        return null;
    }
}

export async function updateGameRoster(
    gameId: string,
    playerIds: string[],
    isHomeTeam: boolean
): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: "Database not initialized." };
    try {
        const gameRef = adminDb.collection('games').doc(gameId);
        
        const updateData = isHomeTeam 
            ? { homeTeamPlayerIds: playerIds } 
            : { awayTeamPlayerIds: playerIds };

        await gameRef.update({
            ...updateData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        revalidatePath(`/games/${gameId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating game roster:", error);
        return { success: false, error: error.message || "Failed to update roster." };
    }
}

export async function updateLiveGameState(
  gameId: string,
  updates: Partial<Pick<Game, 'status' | 'currentPeriod' | 'periodTimeRemainingSeconds' | 'isTimerRunning'>>
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: "La base de datos no está inicializada." };
  
  try {
    const gameRef = adminDb.collection('games').doc(gameId);
    
    const updateData: { [key: string]: any } = { 
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await gameRef.update(updateData);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error al actualizar el estado del partido en vivo:", error);
    return { success: false, error: error.message || "No se pudo actualizar el estado del partido." };
  }
}

export async function recordShot(
  gameId: string,
  team: 'home' | 'away',
  points: 1 | 2 | 3,
  type: 'made' | 'miss'
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };
  const gameRef = adminDb.collection('games').doc(gameId);
  const updates: { [key: string]: any } = {};
  const statPrefix = team === 'home' ? 'homeTeamStats' : 'awayTeamStats';
  const pointField = points === 1 ? 'onePoint' : points === 2 ? 'twoPoint' : 'threePoint';
  
  updates[`${statPrefix}.${pointField}Attempts`] = admin.firestore.FieldValue.increment(1);

  if (type === 'made') {
    updates[`${statPrefix}.${pointField}Made`] = admin.firestore.FieldValue.increment(1);
    updates[`${team}TeamScore`] = admin.firestore.FieldValue.increment(points);
  }
  
  await gameRef.update(updates);
  return { success: true };
}

export async function incrementGameStat(
  gameId: string,
  team: 'home' | 'away',
  stat: 'fouls' | 'timeouts' | 'steals',
  value: number
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };
  const gameRef = adminDb.collection('games').doc(gameId);
  const updates: { [key: string]: any } = {};
  const statPrefix = team === 'home' ? 'homeTeamStats' : 'awayTeamStats';

  updates[`${statPrefix}.${stat}`] = admin.firestore.FieldValue.increment(value);
  
  await gameRef.update(updates);
  return { success: true };
}
```

---

## src/types/index.ts
```ts
import type { Timestamp } from 'firebase/firestore';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string | null;
}

export interface BcsjdApiDataItem {
  id: string | number;
  name: string;
  value: string | number;
  category: string;
  lastUpdated: string;
}

export type UserProfileStatus = 'pending_approval' | 'approved' | 'rejected';

export type ProfileType =
  | 'club_admin'
  | 'coach'
  | 'coordinator'
  | 'parent_guardian'
  | 'player'
  | 'scorer'
  | 'super_admin'
  | 'user';

export interface UserFirestoreProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  profileTypeId: ProfileType;
  clubId: string;
  status: UserProfileStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileAdminView extends UserFirestoreProfile {
  clubName?: string;
  profileTypeLabel?: string;
}

export interface Club {
  id: string;
  name: string;
  shortName?: string;
  province_code?: string;
  city_code?: string;
  province_name?: string;
  city_name?: string;
  logoUrl?: string;
  approved?: boolean;
  createdBy?: string;
  createdAt?: Date;
}

export interface ClubFormData {
  name: string;
  shortName?: string;
  province_name?: string;
  city_name?: string;
  logoUrl?: string;
}

export interface ProfileTypeOption {
  id: ProfileType;
  label: string;
  description?: string;
  order?: number;
  assignableByUser?: boolean;
}

export interface Team {
  id: string;
  name: string;
  clubId: string;
  coachIds?: string[];
  coordinatorIds?: string[];
  gameFormatId?: string | null;
  competitionCategoryId?: string | null;
  playerIds?: string[];
  logoUrl?: string | null;
  city?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string;
}

export interface TeamFormData {
  name: string;
  coachIds?: string[];
  coordinatorIds?: string[];
  gameFormatId?: string | null;
  competitionCategoryId?: string | null;
}

export interface GameFormat {
  id: string;
  name: string;
  description?: string;
  numPeriods?: number;
  periodDurationMinutes?: number;
  defaultTotalTimeouts?: number;
  minPeriodsPlayerMustPlay?: number;
  createdAt?: Date;
  createdBy?: string;
}

export interface GameFormatFormData {
    name: string;
    description?: string;
    numPeriods?: number;
    periodDurationMinutes?: number;
    defaultTotalTimeouts?: number;
    minPeriodsPlayerMustPlay?: number;
}

export interface CompetitionCategory {
  id: string;
  name: string;
  description?: string;
  level?: number;
  gameFormatId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

export interface CompetitionCategoryFormData {
  name: string;
  description?: string;
  level?: number;
  gameFormatId?: string | null;
}


export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  position?: string;
  teamId?: string;
  createdBy?: string;
  createdAt?: Date;
}

export interface PlayerFormData {
  firstName: string;
  lastName: string;
  jerseyNumber?: number | null;
  position?: string | null;
}

export interface Season {
    id: string;
    name: string;
    status: 'active' | 'archived' | 'upcoming';
    competitions: {
        competitionCategoryId: string;
        teamIds: string[];
    }[];
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface SeasonFormData {
  name: string;
  status: 'active' | 'archived' | 'upcoming';
  competitions: {
      competitionCategoryId: string;
      teamIds: string[];
  }[];
}

export interface TeamStats {
    onePointAttempts: number;
    onePointMade: number;
    twoPointAttempts: number;
    twoPointMade: number;
    threePointAttempts: number;
    threePointMade: number;
    fouls: number;
    timeouts: number;
    steals: number;
}

export interface Game {
    id: string;
    homeTeamId: string;
    homeTeamClubId: string;
    homeTeamName: string;
    awayTeamId: string;
    awayTeamClubId: string;
    awayTeamName: string;
    date: Date;
    location: string;
    status: 'scheduled' | 'inprogress' | 'completed' | 'cancelled';
    seasonId: string;
    competitionCategoryId: string;
    gameFormatId?: string | null;
    homeTeamPlayerIds?: string[];
    awayTeamPlayerIds?: string[];
    homeTeamScore?: number;
    awayTeamScore?: number;
    homeTeamStats?: TeamStats;
    awayTeamStats?: TeamStats;
    currentPeriod?: number;
    periodTimeRemainingSeconds?: number;
    isTimerRunning?: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface GameFormData {
    homeTeamId: string;
    awayTeamId: string;
    date: string;
    time: string;
    location: string;
    seasonId: string;
    competitionCategoryId: string;
    gameFormatId?: string | null;
}
```

---

## tailwind.config.ts
```ts
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['var(--font-pt-sans)', 'sans-serif'],
        headline: ['var(--font-playfair-display)', 'serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
```

---

## tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```
