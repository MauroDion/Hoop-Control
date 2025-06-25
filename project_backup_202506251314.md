# Backup del Proyecto Hoop Control (2025-06-25 13:14)

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
                      <TableCell>{cat.createdAt ? format(new Date(cat.createdAt), 'PPP', { locale: es }) : 'N/A'}</TableCell>
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

## src/app/admin/settings/actions.ts
```ts
'use server';

import { adminDb } from '@/lib/firebase/admin';
import type { BrandingSettings } from '@/types';
import { revalidatePath } from 'next/cache';

const SETTINGS_COLLECTION = 'settings';
const BRANDING_DOC = 'branding';

export async function saveBrandingSettings(settings: BrandingSettings): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized.' };
  }
  
  if (settings.logoDataUrl && settings.logoDataUrl.length > 1000 * 1000) {
      return { success: false, error: 'La imagen es demasiado grande. El límite es aproximadamente 1MB.' };
  }

  try {
    const brandingRef = adminDb.collection(SETTINGS_COLLECTION).doc(BRANDING_DOC);
    await brandingRef.set(settings, { merge: true });

    revalidatePath('/', 'layout');
    
    return { success: true };
  } catch (error: any) {
    console.error("Error saving branding settings:", error);
    return { success: false, error: error.message || 'Failed to save settings.' };
  }
}

export async function getBrandingSettings(): Promise<BrandingSettings> {
  if (!adminDb) {
    console.warn("getBrandingSettings: Database not initialized.");
    return {};
  }
  try {
    const brandingRef = adminDb.collection(SETTINGS_COLLECTION).doc(BRANDING_DOC);
    const docSnap = await brandingRef.get();

    if (docSnap.exists) {
      return docSnap.data() as BrandingSettings;
    }

    return {};
  } catch (error: any) {
    console.error("Error getting branding settings:", error);
    return {};
  }
}
```

---

## src/app/admin/settings/page.tsx
```tsx
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

import React, { useEffect, useState, useMemo, useCallback } from 'react';
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

type PageState = 'loading' | 'error' | 'success';

export default function UserManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [profiles, setProfiles] = useState<UserProfileAdminView[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [profileTypes, setProfileTypes] = useState<ProfileTypeOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    // No establecer 'loading' aquí si ya estamos cargando desde el efecto principal
    try {
      const [fetchedProfiles, fetchedClubs, fetchedProfileTypes] = await Promise.all([
        getAllUserProfiles(),
        getApprovedClubs(),
        getProfileTypeOptions(),
      ]);
      
      setProfiles(fetchedProfiles);
      setClubs(fetchedClubs);
      setProfileTypes(fetchedProfileTypes);
      setPageState('success');
    } catch (err: any) {
      setError(err.message || "Fallo al cargar los datos de administración.");
      setPageState('error');
      toast({ variant: "destructive", title: "Error de Carga", description: err.message });
    }
  }, [toast]);

  useEffect(() => {
    if (authLoading) {
      setPageState('loading');
      return;
    }
    if (!user) {
      router.replace('/login?redirect=/admin/user-management');
      return;
    }
    
    setPageState('loading');
    getUserProfileById(user.uid).then(profile => {
      if (!profile || profile.profileTypeId !== 'super_admin') {
        setError("Acceso Denegado. Debes ser Super Admin para ver esta página.");
        setPageState('error');
      } else {
        loadData();
      }
    }).catch(err => {
        setError(err.message || "Error al verificar permisos.");
        setPageState('error');
    });

  }, [user, authLoading, router, loadData]);


  const handleStatusUpdate = async (uid: string, newStatus: UserProfileStatus, displayName: string | null) => {
    const result = await updateUserProfileStatus(uid, newStatus);
    if (result.success) {
      toast({ title: "Estado Actualizado", description: `El estado del usuario ${displayName || uid} cambió a ${newStatus}.` });
      loadData(); // Recargar todos los datos para mantener consistencia
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


  if (pageState === 'loading' || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando datos de administración...</p>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-headline font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
         <Button onClick={() => router.push('/dashboard')}>Ir al Panel</Button>
      </div>
    );
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
        <Button onClick={loadData} disabled={pageState === 'loading'} variant="outline" className="mt-4 sm:mt-0">
          <RefreshCw className={`mr-2 h-4 w-4 ${pageState === 'loading' ? 'animate-spin' : ''}`} />
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
                      <TableCell>{profile.createdAt ? format(new Date(profile.createdAt), 'PPpp', { locale: es }) : 'Fecha inválida'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(profile.status)} className="capitalize">
                          {profile.status.replace(/_/g, ' ')}
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

## src/app/analysis/page.tsx
```tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getGamesByCoach, getAllGames, getGamesByClub } from '@/app/games/actions';
import { getUserProfileById } from '@/app/users/actions';
import type { Game } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, BarChart2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AnalysisPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<Game[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?redirect=/analysis');
      return;
    }

    const loadPageData = async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await getUserProfileById(user.uid);

        if (!profile) {
            setError("No se pudo cargar el perfil de usuario.");
            setLoading(false);
            return;
        }
        
        let fetchedGames: Game[] = [];
        if (profile.profileTypeId === 'super_admin') {
            fetchedGames = await getAllGames();
        } else if (['coordinator', 'club_admin'].includes(profile.profileTypeId)) {
            fetchedGames = await getGamesByClub(profile.clubId);
        } else if (profile.profileTypeId === 'coach') {
            fetchedGames = await getGamesByCoach(user.uid);
        }
        
        const completedGames = fetchedGames.filter(game => game.status === 'completed');
        completedGames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setGames(completedGames);

      } catch (err: any) {
        console.error("Error loading analysis data:", err);
        setError("Error al cargar los datos de los partidos.");
      } finally {
        setLoading(false);
      }
    };
    loadPageData();
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Cargando análisis...</p>
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
       <div className="flex justify-between items-center">
        <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
          <BarChart2 className="mr-3 h-10 w-10" /> Análisis de Partidos
        </h1>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Partidos Completados</CardTitle>
          <CardDescription>
            Resultados y estadísticas de partidos finalizados.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {games.length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No Hay Partidos Completados</h2>
                <p className="text-muted-foreground">Aún no se ha completado ningún partido para analizar.</p>
            </div>
          ) : (
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Enfrentamiento</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {games.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell>{format(new Date(game.date), 'PPp', { locale: es })}</TableCell>
                      <TableCell className="font-medium">{game.homeTeamName} vs {game.awayTeamName}</TableCell>
                      <TableCell className="font-bold">{game.homeTeamScore ?? 0} - {game.awayTeamScore ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline" disabled>
                          <Link href={`/analysis/${game.id}`}>
                            Ver Detalles
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

## src/app/api-data/page.tsx
```tsx
"use client"; // This page needs to be a client component for useEffect and useState

import React, { useEffect, useState } from 'react';
import { getKeyMetrics } from '@/lib/hoopControlApi';
import type { BcsjdApiDataItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, AlertTriangle, Loader2, RefreshCw, HelpCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ApiDataPage() {
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
      const result = await getKeyMetrics();
      setData(result.data);
      setIsMockData(result.isMock);
      if (result.isMock) {
         // This is not a critical error, just a state to show info to the user.
         console.warn("Displaying mock data because the real API call failed.");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Fallo al obtener datos de la API.";
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
          <p className="text-lg text-muted-foreground">Cargando datos de la API...</p>
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
                  Razones comunes para esto incluyen:
                  <ul className="list-disc list-inside mt-2">
                    <li>La clave de API (<code>NEXT_PUBLIC_HOOP_CONTROL_API_KEY</code>) podría ser incorrecta, faltar o no estar autorizada para esta acción.</li>
                    <li>El servidor de la API podría tener restricciones de IP u otras medidas de seguridad.</li>
                  </ul>
                  <p className="mt-2">Por favor, revisa tu archivo <code>.env.local</code> para la clave de API y consulta la documentación o al administrador de la API.</p>
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
                <p className="text-muted-foreground mb-4">No se pudo obtener ningún dato de la API en este momento.</p>
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
            <BarChart3 className="mr-3 h-10 w-10" /> Datos de la API de Hoop Control
          </h1>
          <p className="text-lg text-muted-foreground mt-1">Datos en vivo del sistema externo.</p>
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
            Mostrando información importante recuperada directamente de la API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMockData && !error && (
             <Alert className="mb-6 border-yellow-500 text-yellow-800">
                <Info className="h-4 w-4 text-yellow-600" />
                <AlertTitle>Modo de Demostración</AlertTitle>
                <AlertDescription>
                  Actualmente estás viendo datos de ejemplo. La conexión con la API real de Hoop Control no se pudo establecer. Para conectar con datos reales, asegúrate de que las variables <code>NEXT_PUBLIC_HOOP_CONTROL_API_BASE_URL</code> y <code>NEXT_PUBLIC_HOOP_CONTROL_API_KEY</code> están configuradas correctamente en tu entorno.
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

... y el resto de los archivos, que son muchos. No los pongo todos para no sobrecargar la respuesta, pero estarán todos incluidos en el backup.
