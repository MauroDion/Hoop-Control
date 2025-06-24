
# Backup del Proyecto BCSJD Web App (2024-06-25 19:04)

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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { getTeamsByCoach } from '@/app/teams/actions';

// Types
import type { Game, Player, Team } from '@/types';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, ChevronLeft, Users, Save, ShieldCheck } from 'lucide-react';
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
                setError("Falta el ID del partido en la URL.");
                return;
            }
            
            const [gameData, coachTeams] = await Promise.all([
                getGameById(gameId),
                getTeamsByCoach(userId),
            ]);

            if (!gameData) {
                setError("Partido no encontrado.");
                setLoadingData(false);
                return;
            }
            setGame(gameData);

            const homeTeamIsManaged = coachTeams.some(t => t.id === gameData.homeTeamId);
            const awayTeamIsManaged = coachTeams.some(t => t.id === gameData.awayTeamId);

            let teamToManageId: string | null = null;
            let isHome = false;

            if (homeTeamIsManaged) {
                teamToManageId = gameData.homeTeamId;
                isHome = true;
            } else if (awayTeamIsManaged) {
                teamToManageId = gameData.awayTeamId;
                isHome = false;
            }
            
            setIsHomeTeam(isHome);

            if (!teamToManageId) {
                setError("No eres el entrenador de ninguno de los equipos de este partido.");
                setLoadingData(false);
                return;
            }
            
            const teamToManage = coachTeams.find(t => t.id === teamToManageId)!;
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
import type { Game, GameFormData, Team } from '@/types';
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
        const snapshot = await gamesRef.get();
        const games = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date.toDate(),
            } as Game;
        });
        
        games.sort((a, b) => a.date.getTime() - b.date.getTime());
        return games;
    } catch (error: any) {
        console.error("Error fetching all games:", error);
        return [];
    }
}

export async function getGamesByClub(clubId: string): Promise<Game[]> {
    if (!adminDb || !clubId) return [];
    try {
        const gamesRef = adminDb.collection('games');
        const homeGamesQuery = gamesRef.where('homeTeamClubId', '==', clubId).get();
        const awayGamesQuery = gamesRef.where('awayTeamClubId', '==', clubId).get();

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
        games.sort((a, b) => a.date.getTime() - b.date.getTime());

        return games;
    } catch (error: any) {
        console.error("Error fetching games by club:", error);
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
        games.sort((a, b) => a.date.getTime() - b.date.getTime());

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
```

---

## src/app/games/new/page.tsx
```tsx
"use client";

import { GameForm } from "@/components/games/GameForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, Loader2, AlertTriangle, ChevronLeft } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import type { Team, GameFormat, CompetitionCategory, UserFirestoreProfile, Season } from "@/types";
import { getTeamsByCoach, getAllTeams } from "@/app/teams/actions";
import { getGameFormats } from "@/app/game-formats/actions";
import { getCompetitionCategories } from "@/app/competition-categories/actions";
import { getUserProfileById } from "@/app/users/actions";
import { getSeasons } from "@/app/seasons/actions";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewGamePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<UserFirestoreProfile | null>(null);
  const [coachTeams, setCoachTeams] = useState<Team[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [gameFormats, setGameFormats] = useState<GameFormat[]>([]);
  const [competitionCategories, setCompetitionCategories] = useState<CompetitionCategory[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?redirect=/games/new');
      return;
    }

    const loadPageData = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const profile = await getUserProfileById(user.uid);
        setUserProfile(profile);

        if (!profile || !['coach', 'super_admin', 'coordinator', 'club_admin'].includes(profile.profileTypeId)) {
            setError("Acceso Denegado. Debes tener un rol de entrenador, coordinador o administrador para programar partidos.");
            setLoadingData(false);
            return;
        }

        const [fetchedAllTeams, formats, categories, fetchedSeasons, fetchedCoachTeams] = await Promise.all([
          getAllTeams(),
          getGameFormats(),
          getCompetitionCategories(),
          getSeasons(),
          profile.profileTypeId === 'coach' ? getTeamsByCoach(user.uid) : Promise.resolve([]),
        ]);

        setAllTeams(fetchedAllTeams);
        setGameFormats(formats);
        setCompetitionCategories(categories);
        setSeasons(fetchedSeasons.filter(s => s.status === 'active'));
        setCoachTeams(fetchedCoachTeams);

      } catch (err: any) {
        setError("Error al cargar los datos necesarios para programar un partido.");
      } finally {
        setLoadingData(false);
      }
    };
    loadPageData();
  }, [user, authLoading, router]);
  
  if (authLoading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Cargando programador de partidos...</p>
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
    <div className="max-w-2xl mx-auto">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/games">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Volver a la Lista de Partidos
        </Link>
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <CalendarClock className="mr-3 h-8 w-8 text-primary" />
            Programar Nuevo Partido
          </CardTitle>
          <CardDescription>Rellena los detalles a continuación para crear un nuevo partido.</CardDescription>
        </CardHeader>
        <CardContent>
          <GameForm 
            userProfile={userProfile}
            coachTeams={coachTeams}
            allTeams={allTeams}
            gameFormats={gameFormats}
            competitionCategories={competitionCategories}
            seasons={seasons}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/games/page.tsx
```tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getAllGames, getGamesByClub } from '@/app/games/actions';
import { getUserProfileById } from '@/app/users/actions';
import type { Game, UserFirestoreProfile } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, CalendarClock, PlusCircle, Shield, Settings } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function GamesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<UserFirestoreProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<Game[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?redirect=/games');
      return;
    }

    const loadPageData = async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await getUserProfileById(user.uid);
        setUserProfile(profile);

        if (!profile || !['coach', 'coordinator', 'club_admin', 'super_admin'].includes(profile.profileTypeId)) {
           setError("Acceso Denegado. No tienes permisos para ver esta página.");
           setLoading(false);
           return;
        }
        
        let fetchedGames: Game[] = [];
        if (profile.profileTypeId === 'super_admin') {
            fetchedGames = await getAllGames();
        } else if (profile.profileTypeId === 'coordinator' || profile.profileTypeId === 'club_admin') {
            fetchedGames = await getGamesByClub(profile.clubId);
        } else if (profile.profileTypeId === 'coach') {
            // Re-importing here to avoid circular dependency issues if files get large
            const { getGamesByCoach } = await import('@/app/games/actions');
            fetchedGames = await getGamesByCoach(user.uid);
        }
        
        setGames(fetchedGames);

      } catch (err: any) {
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
          <CalendarClock className="mr-3 h-10 w-10" /> Mis Partidos
        </h1>
        <Button asChild>
          <Link href="/games/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Programar Partido
          </Link>
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Partidos Próximos y Recientes</CardTitle>
          <CardDescription>
            Lista de todos los partidos programados para tus equipos.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {games.length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No se Encontraron Partidos</h2>
                <p className="text-muted-foreground">No hay partidos programados que coincidan con tu rol y club.</p>
            </div>
          ) : (
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Enfrentamiento</TableHead>
                    <TableHead>Lugar</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {games.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell>{format(game.date, 'PPp', { locale: es })}</TableCell>
                      <TableCell className="font-medium">{game.homeTeamName} vs {game.awayTeamName}</TableCell>
                      <TableCell>{game.location}</TableCell>
                      <TableCell className="capitalize">{game.status}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/games/${game.id}`}>
                            <Settings className="mr-2 h-4 w-4" /> Gestionar Partido
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

## src/app/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 220 13% 95%; /* Light gray #F0F2F5 */
    --foreground: 220 13% 15%; /* Darker text for light gray background */

    --muted: 220 10% 85%;
    --muted-foreground: 220 10% 40%;

    --popover: 0 0% 100%;
    --popover-foreground: 220 13% 15%;

    --card: 0 0% 100%;
    --card-foreground: 220 13% 15%;

    --border: 220 10% 80%;
    --input: 220 10% 80%;

    --primary: 231 48% 58%; /* Deep blue #3F51B5 */
    --primary-foreground: 0 0% 100%; /* White */

    --secondary: 231 30% 88%;
    --secondary-foreground: 231 48% 38%;

    --accent: 88 50% 53%; /* Green #7CB342 */
    --accent-foreground: 0 0% 0%; /* Black for contrast with green */

    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;

    --ring: 231 48% 58%;

    --radius: 0.5rem;

    --sidebar-background: 220 13% 98%;
    --sidebar-foreground: 220 13% 25%;
    --sidebar-primary: 231 48% 58%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 88 50% 53%;
    --sidebar-accent-foreground: 0 0% 0%;
    --sidebar-border: 220 10% 80%;
    --sidebar-ring: 231 48% 58%;
  }

  .dark {
    --background: 220 13% 10%;
    --foreground: 220 13% 95%;

    --muted: 220 10% 20%;
    --muted-foreground: 220 10% 70%;

    --popover: 220 13% 5%;
    --popover-foreground: 220 13% 95%;

    --card: 220 13% 5%;
    --card-foreground: 220 13% 95%;

    --border: 220 10% 25%;
    --input: 220 10% 25%;

    --primary: 231 48% 58%;
    --primary-foreground: 0 0% 100%;

    --secondary: 231 30% 28%;
    --secondary-foreground: 231 48% 78%;

    --accent: 88 50% 53%;
    --accent-foreground: 0 0% 0%;

    --destructive: 0 63% 40%;
    --destructive-foreground: 0 0% 100%;

    --ring: 231 48% 58%;

    --sidebar-background: 220 13% 8%;
    --sidebar-foreground: 220 13% 85%;
    --sidebar-primary: 231 48% 58%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 88 50% 53%;
    --sidebar-accent-foreground: 0 0% 0%;
    --sidebar-border: 220 10% 25%;
    --sidebar-ring: 231 48% 58%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

---

## src/app/layout.tsx
```tsx
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import { cn } from '@/lib/utils';
import { PT_Sans, Playfair_Display } from 'next/font/google';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-pt-sans',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BCSJD Web App',
  description: 'Aplicación para la gestión de proyectos e integración de datos de BCSJD.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${ptSans.variable} ${playfairDisplay.variable}`}>
      <head />
      <body className={cn("min-h-screen bg-background font-body antialiased")}>
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## src/app/login/page.tsx
```tsx
import { LoginForm } from "@/components/auth/LoginForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, ShieldX } from "lucide-react";


export default function LoginPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const status = searchParams?.status;

  const renderStatusMessage = () => {
    switch (status) {
      case 'pending_approval':
        return (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Cuenta Pendiente de Aprobación</AlertTitle>
            <AlertDescription>
              Tu registro ha sido enviado. Podrás iniciar sesión una vez que un administrador apruebe tu cuenta.
            </AlertDescription>
          </Alert>
        );
      case 'rejected':
        return (
          <Alert variant="destructive">
            <ShieldX className="h-4 w-4" />
            <AlertTitle>Acceso a la Cuenta Denegado</AlertTitle>
            <AlertDescription>
              El acceso a tu cuenta ha sido denegado. Por favor, contacta a un administrador para más información.
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">¡Bienvenido de nuevo!</CardTitle>
          <CardDescription>Inicia sesión para acceder a tu panel de BCSJD.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStatusMessage()}
          <LoginForm />
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                O continuar con
              </span>
            </div>
          </div>
          <GoogleSignInButton />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Regístrate
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
```

---

## src/app/page.tsx
```tsx
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  // This page is now a simple Server Component.
  // It no longer contains client-side logic to check for authentication.
  // The middleware (`src/middleware.ts`) is solely responsible for redirecting
  // authenticated users away from this page to the /dashboard.
  // This approach simplifies the logic and prevents client-server race conditions.

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6 bg-gradient-to-br from-background to-secondary/30 rounded-xl shadow-2xl">
      <div className="max-w-2xl">
        <Image 
          src="https://placehold.co/600x300.png" 
          alt="Ilustración de la plataforma BCSJD" 
          width={600} 
          height={300} 
          priority 
          className="rounded-lg mb-10 shadow-lg"
          data-ai-hint="collaboration team"
        />
        <h1 className="text-5xl md:text-6xl font-headline font-extrabold mb-6 text-primary tracking-tight">
          Bienvenido a la Aplicación Web de BCSJD
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 mb-10 leading-relaxed">
          Optimiza tus flujos de trabajo, gestiona datos críticos y colabora eficazmente con nuestra plataforma integrada. Creada para el rendimiento y la facilidad de uso.
        </p>
        <div className="space-x-6">
          <Button asChild size="lg" className="shadow-lg hover:shadow-primary/50 transition-shadow duration-300">
            <Link href="/login">Comenzar</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="shadow-lg hover:shadow-md transition-shadow duration-300">
            <Link href="/register">Crear Cuenta</Link>
          </Button>
        </div>
        <p className="mt-12 text-sm text-muted-foreground">
          Impulsado por tecnología moderna para una experiencia fluida.
        </p>
      </div>
    </div>
  );
}
```

---

## src/app/players/actions.ts
```ts
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import type { PlayerFormData, Player } from '@/types';

export async function createPlayer(
  formData: PlayerFormData,
  teamId: string,
  clubId: string,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  if (!teamId || !clubId) {
    return { success: false, error: 'Team ID or Club ID is missing.' };
  }
  if (!formData.firstName || !formData.lastName) {
    return { success: false, error: 'First name and last name are required.' };
  }

  if (!adminDb) {
    const errorMessage = 'Firebase Admin SDK is not initialized. Player creation cannot proceed.';
    console.error('PlayerActions (createPlayer):', errorMessage);
    return { success: false, error: errorMessage };
  }

  try {
    const newPlayerData = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      teamId: teamId,
      jerseyNumber: formData.jerseyNumber ? Number(formData.jerseyNumber) : null,
      position: formData.position || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
    };

    const docRef = await adminDb.collection('players').add(newPlayerData);
    
    revalidatePath(`/clubs/${clubId}/teams/${teamId}`);

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating player:', error);
    return { success: false, error: error.message || 'Failed to create player.' };
  }
}


export async function updatePlayer(
  playerId: string,
  formData: PlayerFormData,
  clubId: string,
  teamId: string,
): Promise<{ success: boolean; error?: string }> {
   if (!playerId) {
    return { success: false, error: "Player ID is required." };
  }
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }
  try {
    const playerRef = adminDb.collection("players").doc(playerId);
    
    const updateData = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      jerseyNumber: formData.jerseyNumber ? Number(formData.jerseyNumber) : null,
      position: formData.position || null,
    };
    
    await playerRef.update(updateData);

    revalidatePath(`/clubs/${clubId}/teams/${teamId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating player:", error);
    return { success: false, error: error.message || "Failed to update player." };
  }
}

export async function deletePlayer(playerId: string, clubId: string, teamId: string): Promise<{ success: boolean; error?: string }> {
  if (!playerId) {
    return { success: false, error: "Player ID is required." };
  }
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }
  try {
    const playerRef = adminDb.collection("players").doc(playerId);
    await playerRef.delete();
    revalidatePath(`/clubs/${clubId}/teams/${teamId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting player:", error);
    return { success: false, error: error.message || "Failed to delete player." };
  }
}

export async function getPlayersByTeamId(teamId: string): Promise<Player[]> {
  console.log(`PlayerActions: Attempting to fetch players for teamId: ${teamId}`);
  if (!adminDb) {
    console.warn('PlayerActions (getPlayersByTeamId): Admin SDK not available. Returning empty array.');
    return [];
  }
  if (!teamId) {
    console.warn('PlayerActions (getPlayersByTeamId): teamId is required.');
    return [];
  }

  try {
    const playersCollectionRef = adminDb.collection('players');
    const q = playersCollectionRef.where('teamId', '==', teamId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.log(`PlayerActions: No players found for teamId: ${teamId}`);
      return [];
    }
    
    console.log(`PlayerActions: Found ${querySnapshot.docs.length} players for teamId: ${teamId}.`);
    
    const players = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      } as Player;
    });

    // Sort by last name, then first name
    players.sort((a, b) => {
        const lastNameComp = a.lastName.localeCompare(b.lastName);
        if (lastNameComp !== 0) return lastNameComp;
        return a.firstName.localeCompare(b.firstName);
    });
    
    return players;
  } catch (error: any) {
    console.error(`PlayerActions: Error fetching players for team ${teamId}:`, error.message, error.stack);
    return [];
  }
}
```

---

## src/app/profile/page.tsx
```tsx
"use client";

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle, Edit3, ShieldAlert, AlertTriangle } from 'lucide-react';

const profileSchema = z.object({
  displayName: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").optional(),
  email: z.string().email().optional(), // El email normalmente no se cambia aquí
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida."),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres."),
  confirmPassword: z.string().min(6, "La confirmación de contraseña debe tener al menos 6 caracteres."),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});


export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      email: user?.email || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        displayName: user.displayName || "",
        email: user.email || "",
      });
    }
  }, [user, profileForm]);

  const handleProfileUpdate = async (values: z.infer<typeof profileSchema>) => {
    if (!auth.currentUser) return;
    try {
      await updateProfile(auth.currentUser, { displayName: values.displayName });
      toast({ title: "Perfil Actualizado", description: "Tu nombre de usuario ha sido actualizado." });
      setIsEditingProfile(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error al Actualizar", description: error.message });
    }
  };

  const handlePasswordUpdate = async (values: z.infer<typeof passwordSchema>) => {
    if (!auth.currentUser || !auth.currentUser.email) {
        toast({ variant: "destructive", title: "Error", description: "Usuario no encontrado o sin email." });
        return;
    }
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, values.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      await updatePassword(auth.currentUser, values.newPassword);
      toast({ title: "Contraseña Actualizada", description: "Tu contraseña ha sido cambiada exitosamente." });
      passwordForm.reset();
    } catch (error: any) {
      console.error("Error al actualizar contraseña: ", error);
      toast({ variant: "destructive", title: "Fallo al Actualizar Contraseña", description: error.message || "Por favor, verifica tu contraseña actual." });
    }
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  if (loading) {
    return <p>Cargando perfil...</p>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-headline font-semibold text-destructive">Acceso Denegado</h1>
        <p className="text-muted-foreground">Por favor, inicia sesión para ver tu perfil.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center space-x-4 p-6 bg-card rounded-lg shadow-lg">
        <Avatar className="h-24 w-24 border-2 border-primary">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'Usuario'} />
          <AvatarFallback className="text-3xl">{getInitials(user.displayName || user.email)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">{user.displayName || 'Perfil de Usuario'}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-headline flex items-center"><UserCircle className="mr-2 h-6 w-6 text-accent" />Información Personal</CardTitle>
            <CardDescription>Ve y actualiza tus datos personales.</CardDescription>
          </div>
          {!isEditingProfile && (
            <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
              <Edit3 className="mr-2 h-4 w-4" /> Editar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Usuario</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditingProfile} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Email</FormLabel>
                <Input type="email" value={user.email || ""} disabled />
                <p className="text-xs text-muted-foreground pt-1">El email no se puede cambiar.</p>
              </FormItem>
              {isEditingProfile && (
                <div className="flex space-x-2 pt-2">
                  <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                    {profileForm.formState.isSubmitting ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                  <Button variant="ghost" onClick={() => {
                    setIsEditingProfile(false);
                    profileForm.reset({ displayName: user.displayName || "", email: user.email || "" });
                  }}>
                    Cancelar
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center"><ShieldAlert className="mr-2 h-6 w-6 text-accent"/>Cambiar Contraseña</CardTitle>
          <CardDescription>Actualiza la contraseña de tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña Actual</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={passwordForm.formState.isSubmitting} className="mt-2">
                {passwordForm.formState.isSubmitting ? "Actualizando..." : "Actualizar Contraseña"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/profile-types/actions.ts
```ts
'use server';

import type { ProfileTypeOption, ProfileType } from '@/types';
import { adminDb } from '@/lib/firebase/admin';

// Helper function to check if a string is a valid ProfileType defined in src/types/index.ts
// This function MUST be updated if the ProfileType enum in src/types/index.ts changes.
function isValidProfileType(id: string): id is ProfileType {
  const validTypes: ProfileType[] = [
    'club_admin', 
    'coach', 
    'coordinator', 
    'parent_guardian', 
    'player', 
    'scorer', 
    'super_admin', 
    'user'
  ];
  return validTypes.includes(id as ProfileType);
}

export async function getProfileTypeOptions(): Promise<ProfileTypeOption[]> {
  console.log("ProfileTypeActions: Attempting to fetch profile types from Firestore collection 'profileTypes' using Admin SDK. Ordering by 'label' asc.");
  
  if (!adminDb) {
      console.error("ProfileTypeActions: Firebase Admin SDK is not initialized. Cannot fetch profile types.");
      return [];
  }
  
  try {
    const profileTypesCollectionRef = adminDb.collection('profileTypes');
    // Order by label for consistent dropdown order
    const q = profileTypesCollectionRef.orderBy('label', 'asc');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.warn("ProfileTypeActions: No documents found in 'profileTypes' collection. An index on 'label' (asc) for 'profileTypes' collection is also required for ordering.");
      return [];
    }
    
    console.log(`ProfileTypeActions: Found ${querySnapshot.docs.length} documents in 'profileTypes' collection.`);
    
    const allProfileTypes = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Use the Firestore document ID as the 'id' for the profile type
      const typeId = doc.id; 
      const typeLabel = data.label;
      
      if (!isValidProfileType(typeId)) {
        console.warn(`ProfileTypeActions: Document ID "${typeId}" is not a valid ProfileType as defined in src/types. Skipping. Data:`, data);
        return null; // Skip this invalid entry
      }

      if (typeof typeLabel !== 'string' || !typeLabel.trim()) {
         console.warn(`ProfileTypeActions: Document with ID "${typeId}" has missing or empty 'label' field. Using fallback. Data:`, data);
         // Provide a fallback label or skip, depending on desired behavior. Here, using a fallback.
         return { id: typeId as ProfileType, label: `Unnamed Type (ID: ${typeId})` };
      }

      return {
        id: typeId as ProfileType, // Cast to ProfileType after validation
        label: typeLabel,
      };
    }).filter(Boolean) as ProfileTypeOption[]; // Filter out nulls and cast
    
    console.log("ProfileTypeActions: Successfully fetched and mapped profile types with Admin SDK:", JSON.stringify(allProfileTypes, null, 2));
    return allProfileTypes;
  } catch (error: any) {
    console.error('ProfileTypeActions: Error fetching profile types from Firestore with Admin SDK:', error.message, error.stack);
    if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("ProfileTypeActions: Firestore query failed. This is likely due to a missing index for ordering by 'label' on the 'profileTypes' collection. Please create this index in your Firestore settings: Collection ID 'profileTypes', Field 'label', Order 'Ascending'.");
    }
    return []; // Return empty array on error
  }
}
```

---

## src/app/register/page.tsx
```tsx
import { RegisterForm } from "@/components/auth/RegisterForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Crear una Cuenta</CardTitle>
          <CardDescription>Únete a la plataforma BCSJD hoy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RegisterForm />
           <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                O regístrate con
              </span>
            </div>
          </div>
          <GoogleSignInButton />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
```

---

## src/app/reset-password/page.tsx
```tsx
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Restablecer Contraseña</CardTitle>
          <CardDescription>Introduce tu email para recibir un enlace de restablecimiento.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/login" className="flex items-center text-sm text-primary hover:underline">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver a Iniciar Sesión
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
```

---

## src/app/seasons/[seasonId]/edit/page.tsx
```tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

import { getSeasonById } from '@/app/seasons/actions';
import { getAllTeams } from '@/app/teams/actions';
import { getCompetitionCategories } from '@/app/competition-categories/actions';

import type { Season, Team, CompetitionCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Edit as EditIcon, ChevronLeft } from 'lucide-react';
import { SeasonForm } from '@/components/seasons/SeasonForm';

export default function EditSeasonPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const seasonId = typeof params.seasonId === 'string' ? params.seasonId : '';

  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [season, setSeason] = useState<Season | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [allCategories, setAllCategories] = useState<CompetitionCategory[]>([]);

  const fetchData = useCallback(async () => {
    if (!seasonId) {
        setError("Falta el ID de la temporada.");
        setLoadingData(false);
        return;
    }
    setLoadingData(true);
    setError(null);
    try {
      const [fetchedSeason, fetchedTeams, fetchedCategories] = await Promise.all([
        getSeasonById(seasonId),
        getAllTeams(),
        getCompetitionCategories()
      ]);
      
      if (!fetchedSeason) {
        throw new Error("No se encontró la temporada para editar.");
      }

      setSeason(fetchedSeason);
      setAllTeams(fetchedTeams);
      setAllCategories(fetchedCategories);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  }, [seasonId]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/seasons');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router, fetchData]);

  if (loadingData || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Cargando datos de la temporada...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button asChild onClick={() => router.push('/seasons')} className="mt-4">
            <Link href="/seasons"><ChevronLeft className="h-4 w-4 mr-2"/>Volver a Temporadas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="outline" size="sm" asChild>
            <Link href="/seasons">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Volver a la lista de temporadas
            </Link>
        </Button>
        <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="text-3xl font-headline flex items-center">
                    <EditIcon className="mr-3 h-8 w-8 text-primary"/>
                    Editar Temporada: {season?.name}
                </CardTitle>
                <CardDescription>
                    Modifica los detalles de la temporada, añade o elimina competiciones y ajusta los equipos participantes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <SeasonForm 
                    season={season}
                    allTeams={allTeams}
                    allCategories={allCategories}
                    onFormSubmit={() => {
                        router.push('/seasons');
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

## src/app/seasons/actions.ts
```ts
'use server';
import { adminDb } from '@/lib/firebase/admin';
import type { Season, SeasonFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import admin from 'firebase-admin';

export async function getSeasons(): Promise<Season[]> {
    if (!adminDb) return [];
    try {
        const seasonsRef = adminDb.collection('seasons');
        const snapshot = await seasonsRef.orderBy('name', 'desc').get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
                updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
            } as Season;
        });
    } catch (error) {
        console.error("Error fetching seasons: ", error);
        return [];
    }
}

export async function getSeasonById(seasonId: string): Promise<Season | null> {
    if (!adminDb) return null;
    try {
        const seasonRef = adminDb.collection('seasons').doc(seasonId);
        const docSnap = await seasonRef.get();
        if (!docSnap.exists) {
            console.warn(`Could not find season with ID: ${seasonId}`);
            return null;
        }
        const data = docSnap.data()!;
        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
            updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
        } as Season;
    } catch (error: any) {
        console.error(`Error fetching season by ID ${seasonId}:`, error);
        return null;
    }
}

export async function createSeason(formData: SeasonFormData, userId: string): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized' };
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
        const newSeason = {
            ...formData,
            createdBy: userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await adminDb.collection('seasons').add(newSeason);
        revalidatePath('/seasons');
        return { success: true };
    } catch (error: any) {
        console.error("Error creating season:", error);
        return { success: false, error: error.message };
    }
}

export async function updateSeason(
    seasonId: string,
    formData: SeasonFormData,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized' };
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
        const seasonRef = adminDb.collection('seasons').doc(seasonId);
        const updateData = {
            ...formData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: userId,
        };
        await seasonRef.update(updateData);
        
        revalidatePath('/seasons');
        revalidatePath(`/seasons/${seasonId}/edit`);

        return { success: true };
    } catch (error: any) {
        console.error("Error updating season:", error);
        return { success: false, error: error.message };
    }
}
```

---

## src/app/seasons/page.tsx
```tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getUserProfileById } from '@/app/users/actions';
import { getSeasons } from './actions';
import { getAllTeams } from '@/app/teams/actions';
import { getCompetitionCategories } from '@/app/competition-categories/actions';

import type { Season, Team, CompetitionCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, CalendarCheck, PlusCircle, ChevronsUpDown, Edit } from 'lucide-react';
import { SeasonForm } from '@/components/seasons/SeasonForm';
import Link from 'next/link';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';


export default function ManageSeasonsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [allCategories, setAllCategories] = useState<CompetitionCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error("Autenticación requerida.");
      
      const profile = await getUserProfileById(user.uid);
      if (profile?.profileTypeId !== 'super_admin') {
        throw new Error('Acceso Denegado. Debes ser Super Admin para ver esta página.');
      }
      setIsSuperAdmin(true);

      const [fetchedSeasons, fetchedTeams, fetchedCategories] = await Promise.all([
        getSeasons(),
        getAllTeams(),
        getCompetitionCategories()
      ]);
      setSeasons(fetchedSeasons);
      setAllTeams(fetchedTeams);
      setAllCategories(fetchedCategories);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/seasons');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router, fetchData]);

  const getCategoryName = (id: string) => allCategories.find(c => c.id === id)?.name || id;

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Cargando datos de temporadas...</p>
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Crear Nueva Temporada</DialogTitle>
            <DialogDescription>
              Define una nueva temporada y configura sus competiciones y equipos participantes.
            </DialogDescription>
          </DialogHeader>
          <SeasonForm 
            allTeams={allTeams}
            allCategories={allCategories}
            onFormSubmit={() => {
              setIsFormOpen(false);
              fetchData();
            }}
          />
        </DialogContent>
      </Dialog>
      
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
          <CalendarCheck className="mr-3 h-10 w-10" /> Gestionar Temporadas
        </h1>
        <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-5 w-5" /> Crear Nueva Temporada
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Todas las Temporadas</CardTitle>
          <CardDescription>
            A continuación se muestra una lista de todas las temporadas del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {seasons.length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <CalendarCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No se Encontraron Temporadas</h2>
                <p className="text-muted-foreground">Crea una para empezar a programar partidos.</p>
            </div>
          ) : (
             <div className="space-y-4">
              {seasons.map((season) => (
                <Collapsible key={season.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl font-semibold">{season.name}</h3>
                      <Badge variant={season.status === 'active' ? 'default' : 'secondary'}>
                        {season.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                          <Link href={`/seasons/${season.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2"/>
                              Editar
                          </Link>
                      </Button>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-9 p-0">
                          <ChevronsUpDown className="h-4 w-4" />
                          <span className="sr-only">Toggle</span>
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                  <CollapsibleContent className="space-y-3 pt-4">
                    {season.competitions?.map(comp => (
                      <div key={comp.competitionCategoryId} className="p-3 bg-muted/50 rounded-md">
                        <h4 className="font-medium">{getCategoryName(comp.competitionCategoryId)}</h4>
                        <p className="text-sm text-muted-foreground">{comp.teamIds.length} equipos participantes.</p>
                      </div>
                    ))}
                     {(!season.competitions || season.competitions.length === 0) && (
                       <p className="text-sm text-muted-foreground italic">Esta temporada no tiene competiciones configuradas.</p>
                     )}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/tasks/[id]/edit/page.tsx
```tsx
import { getTaskById } from "@/app/tasks/actions";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Edit } from "lucide-react";
import { auth } from "@/lib/firebase/client"; // Assuming auth is initialized and currentUser is available
import { redirect } from "next/navigation";


export default async function EditTaskPage({ params }: { params: { id: string } }) {
  // This is a server component, so auth.currentUser might not be reliable here.
  // For robust auth in Server Components, you'd typically use a session management library
  // or verify an ID token passed from the client or from cookies.
  // For this example, we'll simulate getting userId. In real app, pass it or use server-side auth.
  // const userId = auth.currentUser?.uid; // This is NOT reliable in Server Components.
  // A common pattern is to have a server-side auth helper.
  // For now, as a placeholder for this scaffold, we will proceed.
  // Ideally, this page would be client component to use useAuth() or protected by middleware that ensures user.

  // This is a workaround, best to handle auth state properly for server components or make this a client component.
  // If not using a proper server-session, you would pass the userId from a parent client component or context.
  // For this example, we'll assume middleware protects this route and user is available.
  // However, getTaskById needs the userId. This is tricky for pure Server Component.
  // Let's assume for now that a real app would have a server-side way to get the user.
  // This page should ideally be a client component to use the useAuth hook for userId.
  // OR, the getTaskById function needs to be adapted for server-side auth (e.g. using Admin SDK and ID token).
  
  // For the purpose of this scaffold, we acknowledge this limitation for pure server component.
  // Making this a client component is a safer approach for Firebase client SDK.
  // Or, ensure the server action `getTaskById` can run without client-side `auth.currentUser`.
  // To make it work for now, we might need to pass userId or make it client.
  // Let's make it a client component to resolve this easily.
  
  // REDIRECTING to client component pattern below.
  // The actual fetching and form rendering will be in a client component.
  // This server component just acts as a loader/router.

  // This Server Component will fetch the initial task data.
  // Authentication needs to be handled, for instance, by passing userId or making it client-side.
  // Since actions.ts is server-side, it *could* use Admin SDK if properly configured.
  // For now, we'll stick to client SDK and rely on middleware for route protection.
  // The userId for getTaskById will be problematic if not passed or handled by client.

  // To simplify, we'll assume actions.ts `getTaskById` will be called from a client component
  // that provides the userId. This page will be a client component.

  // The below approach is if this were a SERVER component strictly.
  // const task = await getTaskById(params.id, "PLACEHOLDER_USER_ID_FETCH_SERVER_SIDE");
  // Since we decided on client components for pages needing auth, we'll adjust.
  // This page itself cannot reliably get userId with Firebase client SDK if it's a server component.
  // We'll structure it assuming it will become a client component or call one.
  // For now, let's just use a client component approach for the form itself.
  
  // The solution is to make the component that *needs* user.uid a client component.
  // This page can remain server, but it would pass data to a client component.
  // Or, the entire page becomes client.
  // Let's try to keep it simple: make the page client to use useAuth.
  
  // This page will be marked as "use client" to use useAuth hook.
  // It has been converted to a Client Component below by moving the logic into EditTaskClientPage.
  
  return <EditTaskClientPage taskId={params.id} />;
}


// --- Client Component Part ---
"use client"; // Make this part a client component

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Task } from '@/types'; // Assuming Task type is defined

function EditTaskClientPage({ taskId }: { taskId: string }) {
  const { user, loading: authLoading } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return; // Wait for auth state to load

    if (!user) {
      redirect("/login"); // Or show an error message
      return;
    }

    async function fetchTask() {
      try {
        setLoading(true);
        const fetchedTask = await getTaskById(taskId, user.uid); // Pass user.uid here
        if (fetchedTask) {
          setTask(fetchedTask);
        } else {
          setError("Tarea no encontrada o no tienes permiso para editarla.");
        }
      } catch (e: any) {
        setError(e.message || "Error al cargar la tarea.");
      } finally {
        setLoading(false);
      }
    }
    fetchTask();
  }, [taskId, user, authLoading]);

  if (authLoading || loading) {
    return <p className="text-center py-10">Cargando detalles de la tarea...</p>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive">Error al Cargar la Tarea</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }
  
  if (!task) {
     return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive">Tarea No Encontrada</h2>
        <p className="text-muted-foreground">La tarea solicitada no pudo ser encontrada.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <Edit className="mr-3 h-8 w-8 text-primary" />
            Editar Tarea
          </CardTitle>
          <CardDescription>Actualiza los detalles de tu tarea: "{task.title}".</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm task={task} />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/tasks/[id]/page.tsx
```tsx
// This page will be a client component to use useAuth for userId
"use client";

import React, { useEffect, useState } from 'react';
import { getTaskById, deleteTask } from "@/app/tasks/actions";
import type { Task } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarDays, Tag, Info, Edit, Trash2, ChevronLeft, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
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


export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Redirect to login or show error, this should ideally be caught by middleware too
      router.push("/login?redirect=/tasks/" + params.id);
      return;
    }

    async function fetchTask() {
      try {
        setLoading(true);
        const fetchedTask = await getTaskById(params.id, user.uid);
        if (fetchedTask) {
          setTask(fetchedTask);
        } else {
          setError("Tarea no encontrada o no tienes permiso para verla.");
        }
      } catch (e: any) {
        setError(e.message || "Error al cargar los datos de la tarea.");
      } finally {
        setLoading(false);
      }
    }
    fetchTask();
  }, [params.id, user, authLoading, router]);

  const handleDelete = async () => {
    if (!task || !user) return;
    const result = await deleteTask(task.id, user.uid);
    if (result.success) {
      toast({ title: "Tarea Eliminada", description: `La tarea "${task.title}" ha sido eliminada.` });
      router.push("/tasks");
      router.refresh();
    } else {
      toast({ variant: "destructive", title: "Error al Eliminar", description: result.error });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Cargando detalles de la tarea...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive">Error</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button asChild className="mt-4">
            <Link href="/tasks"><ChevronLeft className="mr-2 h-4 w-4" /> Volver a Tareas</Link>
        </Button>
      </div>
    );
  }
  
  if (!task) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold">Tarea No Encontrada</h2>
        <p className="text-muted-foreground">La tarea que buscas no existe o ha sido eliminada.</p>
        <Button asChild className="mt-4">
            <Link href="/tasks"><ChevronLeft className="mr-2 h-4 w-4" /> Volver a Tareas</Link>
        </Button>
      </div>
    );
  }

  const statusColors = {
    todo: "bg-yellow-500/20 text-yellow-700 border-yellow-500",
    inprogress: "bg-blue-500/20 text-blue-700 border-blue-500",
    done: "bg-green-500/20 text-green-700 border-green-500",
  };

  const priorityColors = {
    low: "bg-gray-500/20 text-gray-700 border-gray-500",
    medium: "bg-orange-500/20 text-orange-700 border-orange-500",
    high: "bg-red-500/20 text-red-700 border-red-500",
  };

  const statusText = {
    todo: 'Por Hacer',
    inprogress: 'En Progreso',
    done: 'Hecho',
  }

  const priorityText = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
  }
  
  const formatDate = (date?: Date | null) => {
    if (!date) return 'N/A';
    return format(date, 'PPP', { locale: es });
  };


  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/tasks"><ChevronLeft className="mr-2 h-4 w-4" /> Volver a Tareas</Link>
      </Button>
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-primary/10 p-6">
          <CardTitle className="text-3xl font-headline text-primary">{task.title}</CardTitle>
          {task.description && <CardDescription className="text-md text-foreground/80 pt-1">{task.description}</CardDescription>}
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Info className="mr-2 h-4 w-4 text-accent" />Estado</h4>
              <p className={`px-3 py-1 text-sm font-semibold rounded-full border w-fit ${statusColors[task.status]}`}>
                {statusText[task.status]}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Tag className="mr-2 h-4 w-4 text-accent" />Prioridad</h4>
              <p className={`px-3 py-1 text-sm font-semibold rounded-full border w-fit ${priorityColors[task.priority]}`}>
                {priorityText[task.priority]}
              </p>
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-accent" />Fecha de Entrega</h4>
                <p className="text-lg font-medium">{formatDate(task.dueDate)}</p>
            </div>
             <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-accent" />Fecha de Creación</h4>
                <p className="text-lg font-medium">{formatDate(task.createdAt)}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-6 flex justify-end space-x-3">
          <Button variant="outline" asChild>
            <Link href={`/tasks/${task.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Editar</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente la tarea
                  "{task.title}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
```

---

## src/app/tasks/actions.ts
```ts
"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import admin from 'firebase-admin';
import type { Task, TaskFormData } from "@/types";

export async function createTask(formData: TaskFormData, userId: string): Promise<{ success: boolean; error?: string, id?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }

  try {
    const newTaskData = {
      ...formData,
      dueDate: formData.dueDate ? admin.firestore.Timestamp.fromDate(new Date(formData.dueDate)) : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: userId,
    };
    const docRef = await adminDb.collection("tasks").add(newTaskData);
    revalidatePath("/tasks");
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error creating task:", error);
    return { success: false, error: error.message || "Failed to create task." };
  }
}

export async function updateTask(id: string, formData: Partial<TaskFormData>, userId: string): Promise<{ success: boolean; error?: string }> {
   if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }
  try {
    const taskRef = adminDb.collection("tasks").doc(id);
    const taskSnap = await taskRef.get();
    
    if (!taskSnap.exists || taskSnap.data()?.userId !== userId) {
      return { success: false, error: "Permission denied or task not found."};
    }

    const updateData: { [key: string]: any } = { ...formData, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    if (formData.dueDate) {
      updateData.dueDate = admin.firestore.Timestamp.fromDate(new Date(formData.dueDate));
    } else if (formData.dueDate === null) {
      updateData.dueDate = null;
    }
    
    await taskRef.update(updateData);
    revalidatePath("/tasks");
    revalidatePath(`/tasks/${id}`);
    revalidatePath(`/tasks/${id}/edit`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating task:", error);
    return { success: false, error: error.message || "Failed to update task." };
  }
}

export async function deleteTask(id: string, userId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }
  try {
    const taskRef = adminDb.collection("tasks").doc(id);
    const taskSnap = await taskRef.get();
    if (!taskSnap.exists() || taskSnap.data()?.userId !== userId) {
      return { success: false, error: "Permission denied or task not found."};
    }
    await taskRef.delete();
    revalidatePath("/tasks");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting task:", error);
    return { success: false, error: error.message || "Failed to delete task." };
  }
}

export async function getTasks(userId: string): Promise<Task[]> {
  if (!userId) {
    console.warn("getTasks called without userId.");
    return [];
  }
  if (!adminDb) {
    return [];
  }
  try {
    const q = adminDb.collection("tasks").where("userId", "==", userId);
    const querySnapshot = await q.get();
    const tasks = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            dueDate: data.dueDate ? data.dueDate.toDate() : null,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
        } as Task
    });
    return tasks;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
}

export async function getTaskById(id: string, userId: string): Promise<Task | null> {
  if (!userId) {
     console.warn("getTaskById called without userId.");
    return null;
  }
  if (!adminDb) {
    return null;
  }
  try {
    const taskRef = adminDb.collection("tasks").doc(id);
    const taskSnap = await taskRef.get();
    
    if (taskSnap.exists() && taskSnap.data()?.userId === userId) {
       const data = taskSnap.data()!;
       return {
            id: taskSnap.id,
            ...data,
            dueDate: data.dueDate ? data.dueDate.toDate() : null,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
        } as Task;
    }
    return null;
  } catch (error) {
    console.error("Error fetching task by ID:", error);
    return null;
  }
}
```

---

## src/app/tasks/new/page.tsx
```tsx
import { TaskForm } from "@/components/tasks/TaskForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListPlus } from "lucide-react";

export default function NewTaskPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <ListPlus className="mr-3 h-8 w-8 text-primary" />
            Crear Nueva Tarea
          </CardTitle>
          <CardDescription>Rellena los detalles a continuación para añadir una nueva tarea a tu lista.</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## src/app/tasks/page.tsx
```tsx
"use client";

import React, { useEffect, useState } from 'react';
import { getTasks } from "@/app/tasks/actions";
import type { Task } from "@/types";
import { TasksList } from "@/components/tasks/TasksList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router


export default function TasksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Client-side guard: If auth is resolved and there is no user, redirect.
    if (!authLoading && !user) {
      router.replace('/login?redirect=/tasks');
      return;
    }
    
    if (user) {
       async function fetchTasks() {
        try {
          setLoading(true);
          const fetchedTasks = await getTasks(user.uid); // Pass user.uid to fetch tasks for this user
          setTasks(fetchedTasks);
        } catch (e: any) {
          console.error("Failed to fetch tasks:", e);
          setError(e.message || "No se pudieron cargar las tareas. Por favor, inténtalo de nuevo más tarde.");
        } finally {
          setLoading(false);
        }
      }
      fetchTasks();
    }
  }, [user, authLoading, router]);

  // Show a loader while authentication is in progress or if there's no user yet (and we are about to redirect).
  if (authLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-semibold">Verificando Acceso...</h1>
        <p className="text-muted-foreground">Por favor, espera.</p>
      </div>
    );
  }

  // If we are still loading the tasks data for an authenticated user.
  if (loading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-semibold">Cargando Tareas...</h1>
        <p className="text-muted-foreground">Por favor, espera mientras recuperamos tus tareas.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error al Cargar las Tareas</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">Intentar de Nuevo</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-headline font-bold text-primary">Mis Tareas</h1>
        <Button asChild>
          <Link href="/tasks/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Crear Nueva Tarea
          </Link>
        </Button>
      </div>
      <TasksList tasks={tasks} />
    </div>
  );
}
```

---

## src/app/teams/actions.ts
```ts
"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import admin from "firebase-admin";
import type { TeamFormData, Team } from "@/types";

export async function createTeam(
  formData: TeamFormData,
  clubId: string,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!clubId) {
    return { success: false, error: "Club ID is missing." };
  }
  if (!formData.name || formData.name.trim() === "") {
    return { success: false, error: "Team name cannot be empty." };
  }

  if (!adminDb) {
    const errorMessage = "Firebase Admin SDK is not initialized. Team creation cannot proceed.";
    console.error("TeamActions (createTeam):", errorMessage);
    return { success: false, error: errorMessage };
  }

  try {
    const newTeamData: Omit<Team, "id" | "createdAt" | "updatedAt"> & { createdAt: any, updatedAt: any } = {
      name: formData.name.trim(),
      clubId: clubId,
      gameFormatId: formData.gameFormatId || null,
      competitionCategoryId: formData.competitionCategoryId || null,
      coachIds: formData.coachIds || [],
      coordinatorIds: formData.coordinatorIds || [],
      playerIds: [],
      logoUrl: null,
      city: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdByUserId: userId,
    };

    const docRef = await adminDb.collection("teams").add(newTeamData);
    
    revalidatePath(`/clubs/${clubId}`);
    revalidatePath(`/clubs/${clubId}/teams/new`);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error creating team:", error);
    return { success: false, error: error.message || "Failed to create team." };
  }
}

export async function updateTeam(
  teamId: string,
  formData: TeamFormData,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!teamId) {
    return { success: false, error: "Team ID is missing." };
  }

  if (!adminDb) {
    return { success: false, error: "Database not initialized." };
  }

  try {
    const teamRef = adminDb.collection("teams").doc(teamId);
    // TODO: Add permission check here if needed
    
    const updateData = {
      name: formData.name.trim(),
      competitionCategoryId: formData.competitionCategoryId || null,
      gameFormatId: formData.gameFormatId || null,
      coachIds: formData.coachIds || [],
      coordinatorIds: formData.coordinatorIds || [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await teamRef.update(updateData);
    
    const teamSnap = await teamRef.get();
    const clubId = teamSnap.data()?.clubId;

    if (clubId) {
      revalidatePath(`/clubs/${clubId}`);
      revalidatePath(`/clubs/${clubId}/teams/${teamId}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error updating team:", error);
    return { success: false, error: error.message || "Failed to update team." };
  }
}

export async function getTeamsByClubId(clubId: string): Promise<Team[]> {
  console.log(`TeamActions: Attempting to fetch teams for clubId: ${clubId}`);
  if (!adminDb) {
    console.warn("TeamActions (getTeamsByClubId): Admin SDK not available. Returning empty array.");
    return [];
  }
  if (!clubId) {
    console.warn("TeamActions (getTeamsByClubId): clubId is required.");
    return [];
  }

  try {
    const teamsCollectionRef = adminDb.collection('teams');
    const q = teamsCollectionRef.where('clubId', '==', clubId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.log(`TeamActions: No teams found for clubId: ${clubId}`);
      return [];
    }
    
    console.log(`TeamActions: Found ${querySnapshot.docs.length} teams for clubId: ${clubId}.`);
    
    const teams = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      } as Team;
    });

    teams.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return teams;
  } catch (error: any) {
    console.error(`TeamActions: Error fetching teams for club ${clubId}:`, error.message, error.stack);
     if (error.code === 'failed-precondition') {
        console.error("TeamActions: Firestore query for teams failed. This could be a missing index for 'clubId'.");
    }
    return [];
  }
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  console.log(`TeamActions: Attempting to fetch team by ID: ${teamId}`);
  if (!adminDb) {
    console.warn("TeamActions (getTeamById): Admin SDK not available. Returning null.");
    return null;
  }
  if (!teamId) {
    console.warn("TeamActions (getTeamById): teamId is required.");
    return null;
  }

  try {
    const teamDocRef = adminDb.collection('teams').doc(teamId);
    const docSnap = await teamDocRef.get();

    if (!docSnap.exists) {
      console.warn(`TeamActions: No team found with ID: ${teamId}`);
      return null;
    }
    
    const data = docSnap.data()!;
    console.log(`TeamActions: Found team: ${data.name}`);
    
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
    } as Team;
  } catch (error: any) {
    console.error(`TeamActions: Error fetching team by ID ${teamId}:`, error.message, error.stack);
    return null;
  }
}

export async function getAllTeams(): Promise<Team[]> {
    if (!adminDb) return [];
    try {
        const teamsRef = adminDb.collection('teams');
        const querySnapshot = await teamsRef.orderBy('name', 'asc').get();
        const teams = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
                updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
            } as Team;
        });
        return teams;
    } catch (e: any) {
        if (e.code === 'failed-precondition') {
            console.error("Firestore error: Missing index for teams collection on 'name' field.");
        }
        return [];
    }
}

export async function getTeamsByCoach(userId: string): Promise<Team[]> {
    if (!adminDb) return [];
    try {
        const teamsRef = adminDb.collection('teams');
        const querySnapshot = await teamsRef.where('coachIds', 'array-contains', userId).get();
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
             return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
                updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
            } as Team;
        });
    } catch (e: any) {
        console.error("Error getting teams by coach:", e);
        return [];
    }
}
```

---

## src/app/users/actions.ts
```ts
'use server';

import admin, { adminAuth, adminDb, adminInitError } from '@/lib/firebase/admin';
import type { UserFirestoreProfile, ProfileType, UserProfileStatus } from '@/types';
import { revalidatePath } from 'next/cache';

// This new server action uses the Admin SDK to securely create the user profile,
// bypassing client-side security rules which are a common point of failure.
export async function finalizeNewUserProfile(
  idToken: string,
  data: { profileType: ProfileType; selectedClubId: string; displayName: string; }
): Promise<{ success: boolean; error?: string }> {
  // Defensive check to ensure the Admin SDK was initialized correctly.
  if (!adminAuth || !adminDb) {
    console.error("UserActions (finalize): Firebase Admin SDK not initialized. Error:", adminInitError);
    return { success: false, error: `Server configuration error: ${adminInitError || 'Unknown admin SDK error.'}` };
  }

  try {
    console.log("UserActions (finalize): Verifying ID token...");
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    console.log(`UserActions (finalize): ID token verified for UID: ${uid}`);

    // Use the Admin SDK to update the Auth user's display name
    await adminAuth.updateUser(uid, { displayName: data.displayName });
    console.log(`UserActions (finalize): Updated Auth user display name for UID: ${uid}`);

    // Use the Admin SDK to create the Firestore user profile document
    const userProfileRef = adminDb.collection('user_profiles').doc(uid);

    // Casting to any to handle serverTimestamp correctly before saving
    const profileToSave: any = {
        uid: uid,
        email: decodedToken.email,
        displayName: data.displayName,
        photoURL: decodedToken.picture || null,
        profileTypeId: data.profileType,
        clubId: data.selectedClubId,
        status: 'pending_approval' as UserProfileStatus,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await userProfileRef.set(profileToSave);
    console.log(`UserActions (finalize): Successfully created Firestore profile for UID: ${uid}`);
    
    return { success: true };

  } catch (error: any) {
    console.error(`UserActions (finalize): Error finalizing user profile. Error code: ${error.code}. Message: ${error.message}`);
    return { success: false, error: `Failed to finalize profile on server: ${error.message}` };
  }
}


export async function getUserProfileById(uid: string): Promise<UserFirestoreProfile | null> {
  // Defensive check to ensure the Admin SDK was initialized correctly.
  if (!adminDb) {
    console.error("UserActions (getProfile): Firebase Admin SDK not initialized. Error:", adminInitError);
    // Do not throw, just return null so the UI can handle it.
    return null;
  }
  
  console.log(`UserActions: Attempting to fetch profile for UID: ${uid} from 'user_profiles' using Admin SDK.`);
  try {
    const userProfileRef = adminDb.collection('user_profiles').doc(uid);
    const docSnap = await userProfileRef.get();

    if (docSnap.exists) {
      console.log(`UserActions: Profile found for UID: ${uid}.`);
      const data = docSnap.data();
      
      // Convert Firestore Timestamps to serializable JS Date objects
      const serializableProfile = {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };

      return { uid: docSnap.id, ...serializableProfile } as UserFirestoreProfile;
    } else {
      console.warn(`UserActions: No profile found for UID: ${uid} using Admin SDK.`);
      return null;
    }
  } catch (error: any) {
    console.error(`UserActions: Error fetching user profile for UID ${uid} with Admin SDK:`, error.message, error.stack);
    return null;
  }
}

export async function getUsersByProfileTypeAndClub(
  profileType: ProfileType,
  clubId: string
): Promise<UserFirestoreProfile[]> {
  if (!adminDb) {
    console.error("UserActions (getUsersByProfileTypeAndClub): Admin SDK not initialized.");
    return [];
  }
  try {
    const usersRef = adminDb.collection('user_profiles');
    const q = usersRef.where('clubId', '==', clubId).where('profileTypeId', '==', profileType).where('status', '==', 'approved');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return [];
    }
    
    const users = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as UserFirestoreProfile;
    });

    users.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
    return users;

  } catch (error: any) {
    console.error(`Error fetching users by profile type '${profileType}' for club '${clubId}':`, error.message);
    if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("Firestore query failed. This is likely due to a missing composite index. Please create an index on 'clubId', 'profileTypeId', and 'status' for the 'user_profiles' collection.");
    }
    return [];
  }
}
```

---

## src/components/auth/GoogleSignInButton.tsx
```tsx
"use client";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase/client";
import { GoogleAuthProvider, signInWithPopup, UserCredential, signOut } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);


export function GoogleSignInButton() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result: UserCredential = await signInWithPopup(auth, provider);
      
      if (!result.user) {
        throw new Error("El inicio de sesión con Google falló, no se encontró el objeto de usuario.");
      }

      const idToken = await result.user.getIdToken();
      const response = await fetch('/api/auth/session-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // If server rejects session, sign out client-side
        await signOut(auth);

        if (responseData.reason) {
          router.push(`/login?status=${responseData.reason}`);
          return;
        }
        throw new Error(responseData.error || 'El inicio de sesión con Google falló.');
      }

      toast({ title: "Sesión iniciada con Google", description: `¡Bienvenido, ${result.user.displayName}!` });
      router.push(redirectUrl);
      router.refresh(); 
    } catch (error: any) {
      console.error("Error de inicio de sesión con Google: ", error);
      toast({
        variant: "destructive",
        title: "Fallo en el Inicio de Sesión con Google",
        description: error.message || "Ocurrió un error inesperado.",
      });
    }
  };

  return (
    <Button variant="outline" type="button" onClick={handleSignIn} className="w-full">
      <GoogleIcon />
      Iniciar sesión con Google
    </Button>
  );
}
```

---

## src/components/auth/LoginForm.tsx
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, browserLocalPersistence, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "../ui/label";

const formSchema = z.object({
  email: z.string().email({ message: "Dirección de email inválida." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  rememberMe: z.boolean().default(false).optional(),
});

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false, // Default to session-only
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Set persistence BEFORE signing in. This is crucial.
      await setPersistence(auth, values.rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      
      if (!userCredential.user) {
        throw new Error("El inicio de sesión falló, no se encontró el objeto de usuario.");
      }

      const idToken = await userCredential.user.getIdToken();
      // Pass the rememberMe flag to the server to align cookie lifetime
      const response = await fetch('/api/auth/session-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, rememberMe: values.rememberMe }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        await signOut(auth);
        if (responseData.reason) {
          router.push(`/login?status=${responseData.reason}`);
          return;
        }
        throw new Error(responseData.error || 'El inicio de sesión falló.');
      }
      
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "¡Bienvenido de nuevo!",
      });
      router.push(redirectUrl);
      router.refresh(); 
    } catch (error: any) {
      console.error("Error de inicio de sesión: ", error);
      toast({
        variant: "destructive",
        title: "Fallo en el Inicio de Sesión",
        description: error.code === 'auth/invalid-credential' 
          ? "Email o contraseña inválidos." 
          : error.message || "Email o contraseña inválidos.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="tu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-between">
           <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="rememberMeLogin"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <Label
                    htmlFor="rememberMeLogin"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Recordarme
                  </Label>
                </div>
              </FormItem>
            )}
          />
          <Link href="/reset-password" passHref>
            <Button variant="link" type="button" className="px-0 text-sm">
              ¿Olvidaste tu contraseña?
            </Button>
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>
      </form>
    </Form>
  );
}
```

---

## src/components/auth/RegisterForm.tsx
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createUserWithEmailAndPassword, signOut, UserCredential } from "firebase/auth";
import { auth } from "@/lib/firebase/client"; 
import { useRouter } from "next/navigation";
import { finalizeNewUserProfile } from "@/app/users/actions";
import { getApprovedClubs } from "@/app/clubs/actions";
import { getProfileTypeOptions } from "@/app/profile-types/actions";
import type { Club, ProfileType, ProfileTypeOption } from "@/types";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Dirección de email inválida." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  profileType: z.enum([
    'club_admin',
    'coach',
    'coordinator',
    'parent_guardian',
    'player',
    'scorer',
    'super_admin',
    'user'
    ], {
    errorMap: () => ({ message: "Por favor, selecciona un tipo de perfil válido." })
  }),
  selectedClubId: z.string().min(1, { message: "Por favor, selecciona un club." }),
});

export function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [profileTypeOptions, setProfileTypeOptions] = useState<ProfileTypeOption[]>([]);
  const [loadingProfileTypes, setLoadingProfileTypes] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoadingClubs(true);
      setLoadingProfileTypes(true);
      try {
        const [fetchedClubs, fetchedProfileTypes] = await Promise.all([
           getApprovedClubs(),
           getProfileTypeOptions()
        ]);
        
        setClubs(Array.isArray(fetchedClubs) ? fetchedClubs : []);
        setProfileTypeOptions(Array.isArray(fetchedProfileTypes) ? fetchedProfileTypes : []);
        
        if (!Array.isArray(fetchedClubs)) console.warn("RegisterForm: Fetched clubs is not an array:", fetchedClubs);
        if (!Array.isArray(fetchedProfileTypes)) console.warn("RegisterForm: Fetched profile types is not an array:", fetchedProfileTypes);

      } catch (error: any) {
        console.error("RegisterForm: Failed to fetch data for form:", error);
        toast({ variant: "destructive", title: "Error al Cargar Datos", description: error.message || "No se pudieron cargar los clubs o tipos de perfil."});
        setClubs([]);
        setProfileTypeOptions([]);
      } finally {
        setLoadingClubs(false);
        setLoadingProfileTypes(false);
      }
    }
    fetchData();
  }, [toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    let userCredential: UserCredential | undefined;
    
    try {
      userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        throw new Error("La creación del usuario falló, el objeto de usuario es nulo.");
      }
      
      const idToken = await firebaseUser.getIdToken();

      const profileResult = await finalizeNewUserProfile(idToken, {
        displayName: values.name,
        profileType: values.profileType,
        selectedClubId: values.selectedClubId,
      });

      if (!profileResult.success) {
        throw new Error(profileResult.error || "No se pudo crear el perfil de usuario en el servidor.");
      }

      toast({
        title: "Registro Enviado",
        description: "Tu registro ha sido enviado. Un administrador lo revisará pronto. Podrás iniciar sesión una vez que tu cuenta sea aprobada.",
        duration: 7000,
      });
      
      await signOut(auth);
      router.push("/login?status=pending_approval");
      router.refresh();

    } catch (error: any) {
      console.error("RegisterForm: ERROR during registration process:", error);

      if (userCredential?.user) {
          console.warn("RegisterForm: Deleting partially created user due to subsequent error...");
          try {
              await userCredential.user.delete();
              console.log("RegisterForm: Successfully deleted partially created user.");
          } catch (deleteError) {
              console.error("RegisterForm: CRITICAL - Failed to delete partially created user. This user must be manually removed from Firebase Auth:", userCredential.user.uid, deleteError);
          }
      }

      let description = "Ocurrió un error inesperado durante el registro.";
      if (error.code === 'auth/email-already-in-use') {
        description = "Esta dirección de email ya está en uso. Por favor, usa un email diferente o intenta iniciar sesión.";
      } else if (error.message) {
        description = error.message;
      }
      toast({
        variant: "destructive",
        title: "Fallo en el Registro",
        description: description,
        duration: 9000,
      });
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Juan Pérez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="tu@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="profileType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Perfil</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={loadingProfileTypes || profileTypeOptions.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        loadingProfileTypes
                          ? "Cargando tipos de perfil..."
                          : profileTypeOptions.length === 0
                            ? "No hay tipos de perfil disponibles"
                            : "Selecciona tu tipo de perfil"
                        } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {profileTypeOptions.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label || `Tipo sin nombre ID: ${type.id}`}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="selectedClubId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selecciona tu Club</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={loadingClubs || clubs.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingClubs
                            ? "Cargando clubs..."
                            : clubs.length === 0
                            ? "No hay clubs disponibles"
                            : "Selecciona el club al que perteneces"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clubs.map((club) => (
                         <SelectItem key={club.id} value={club.id}>
                           {club.name || `Club sin nombre ID: ${club.id}`}
                         </SelectItem>
                       )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || loadingClubs || loadingProfileTypes}>
            {(form.formState.isSubmitting || loadingClubs || loadingProfileTypes) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {form.formState.isSubmitting ? "Registrando..." : "Crear Cuenta"}
          </Button>
        </form>
      </Form>
    </>
  );
}
```

---

## src/components/auth/ResetPasswordForm.tsx
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import React from "react";

const formSchema = z.object({
  email: z.string().email({ message: "Dirección de email inválida." }),
});

export function ResetPasswordForm() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await sendPasswordResetEmail(auth, values.email);
      toast({
        title: "Email de Restablecimiento Enviado",
        description: "Revisa tu bandeja de entrada para un enlace para restablecer tu contraseña.",
      });
      form.reset();
    } catch (error: any) {
      console.error("Error al restablecer contraseña: ", error);
      toast({
        variant: "destructive",
        title: "Fallo en el Restablecimiento",
        description: error.message || "Ocurrió un error inesperado.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="tu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Enviando..." : "Enviar Enlace de Restablecimiento"}
        </Button>
      </form>
    </Form>
  );
}
```

---

## src/components/clubs/ClubForm.tsx
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { ClubFormData } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createClub } from "@/app/clubs/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const clubFormSchema = z.object({
  name: z.string().min(2, "Club name must be at least 2 characters."),
  shortName: z.string().optional(),
  province_name: z.string().optional(),
  city_name: z.string().optional(),
  logoUrl: z.string().url({ message: "Must be a valid URL" }).optional().or(z.literal("")),
});

interface ClubFormProps {
  onFormSubmit: () => void;
}

export function ClubForm({ onFormSubmit }: ClubFormProps) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const form = useForm<z.infer<typeof clubFormSchema>>({
    resolver: zodResolver(clubFormSchema),
    defaultValues: {
      name: "",
      shortName: "",
      province_name: "",
      city_name: "",
      logoUrl: "",
    },
  });

  async function onSubmit(values: z.infer<typeof clubFormSchema>) {
    if (authLoading || !user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in." });
      return;
    }

    const result = await createClub(values, user.uid);

    if (result.success) {
      toast({
        title: "Club Created",
        description: `Club "${values.name}" has been created and is pending approval.`,
      });
      form.reset();
      onFormSubmit();
    } else {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: result.error || "An unexpected error occurred.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Club Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Real Madrid" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField
              control={form.control}
              name="shortName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., RMA" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL (Optional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://..." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="province_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Province (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Madrid" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Madrid" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting || authLoading}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {form.formState.isSubmitting ? "Creating..." : "Create Club"}
        </Button>
      </form>
    </Form>
  );
}
```

---

## src/components/competition-categories/CompetitionCategoryForm.tsx
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CompetitionCategoryFormData, GameFormat, CompetitionCategory } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createCompetitionCategory, updateCompetitionCategory } from "@/app/competition-categories/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const categoryFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  description: z.string().optional(),
  level: z.coerce.number().optional(),
  gameFormatId: z.string().optional().nullable(),
});

interface CompetitionCategoryFormProps {
  onFormSubmit: () => void;
  gameFormats: GameFormat[];
  category?: CompetitionCategory | null;
}

export function CompetitionCategoryForm({ onFormSubmit, gameFormats, category }: CompetitionCategoryFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
      level: category?.level || undefined,
      gameFormatId: category?.gameFormatId || null,
    },
  });

  useEffect(() => {
    form.reset({
      name: category?.name || "",
      description: category?.description || "",
      level: category?.level || undefined,
      gameFormatId: category?.gameFormatId || null,
    })
  }, [category, form]);

  async function onSubmit(values: z.infer<typeof categoryFormSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Error de autenticación" });
      return;
    }

    const result = category
        ? await updateCompetitionCategory(category.id, values, user.uid)
        : await createCompetitionCategory(values, user.uid);


    if (result.success) {
      toast({
        title: category ? "Categoría Actualizada" : "Categoría Creada",
        description: `La categoría "${values.name}" ha sido ${category ? 'actualizada' : 'creada'} con éxito.`,
      });
      form.reset();
      onFormSubmit();
    } else {
      toast({
        variant: "destructive",
        title: "Error en la operación",
        description: result.error || "Ocurrió un error inesperado.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Categoría</FormLabel>
              <FormControl>
                <Input placeholder="Ej: U14 Femenino" {...field} />
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
              <FormLabel>Descripción (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe brevemente la categoría" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nivel (Ej: 14 para U14)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gameFormatId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Formato de Partido por Defecto</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un formato" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Ninguno</SelectItem>
                    {gameFormats.map(format => (
                        <SelectItem key={format.id} value={format.id}>{format.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {category ? 'Guardar Cambios' : 'Crear Categoría'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## src/components/game-formats/GameFormatForm.tsx
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { GameFormat, GameFormatFormData } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createGameFormat, updateGameFormat } from "@/app/game-formats/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const formatSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  description: z.string().optional(),
  numPeriods: z.coerce.number().optional(),
  periodDurationMinutes: z.coerce.number().optional(),
  defaultTotalTimeouts: z.coerce.number().optional(),
  minPeriodsPlayerMustPlay: z.coerce.number().optional(),
});

interface GameFormatFormProps {
  onFormSubmit: () => void;
  format?: GameFormat | null;
}

export function GameFormatForm({ onFormSubmit, format }: GameFormatFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formatSchema>>({
    resolver: zodResolver(formatSchema),
    defaultValues: {
      name: format?.name || "",
      description: format?.description || "",
      numPeriods: format?.numPeriods || undefined,
      periodDurationMinutes: format?.periodDurationMinutes || undefined,
      defaultTotalTimeouts: format?.defaultTotalTimeouts || undefined,
      minPeriodsPlayerMustPlay: format?.minPeriodsPlayerMustPlay || undefined,
    },
  });

  useEffect(() => {
      form.reset({
        name: format?.name || "",
        description: format?.description || "",
        numPeriods: format?.numPeriods || undefined,
        periodDurationMinutes: format?.periodDurationMinutes || undefined,
        defaultTotalTimeouts: format?.defaultTotalTimeouts || undefined,
        minPeriodsPlayerMustPlay: format?.minPeriodsPlayerMustPlay || undefined,
      })
  }, [format, form]);

  async function onSubmit(values: z.infer<typeof formatSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Error de autenticación" });
      return;
    }

    const result = format
      ? await updateGameFormat(format.id, values, user.uid)
      : await createGameFormat(values, user.uid);

    if (result.success) {
      toast({
        title: format ? "Formato Actualizado" : "Formato Creado",
        description: `El formato "${values.name}" ha sido ${format ? 'actualizado' : 'creado'}.`,
      });
      form.reset();
      onFormSubmit();
    } else {
      toast({
        variant: "destructive",
        title: "Error en la Operación",
        description: result.error || "Ocurrió un error inesperado.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Formato</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Estándar 5vs5" {...field} />
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
              <FormLabel>Descripción (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe las reglas clave o el uso de este formato" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <FormField
                control={form.control}
                name="numPeriods"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Nº Períodos</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="4" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="periodDurationMinutes"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Duración (min)</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="10" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="defaultTotalTimeouts"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Tiempos Muertos</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="4" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="minPeriodsPlayerMustPlay"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Mín. Períodos / Jugador</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="1" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {format ? "Guardar Cambios" : "Crear Formato"}
        </Button>
      </form>
    </Form>
  );
}
```

---

## src/components/games/GameForm.tsx
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GameFormData, Team, GameFormat, CompetitionCategory, Season, UserFirestoreProfile } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createGame } from "@/app/games/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import React, { useMemo, useEffect } from 'react';

const gameFormSchema = z.object({
  seasonId: z.string().min(1, "Debes seleccionar una temporada."),
  competitionCategoryId: z.string().min(1, "Debes seleccionar una competición."),
  homeTeamId: z.string().min(1, "Debes seleccionar un equipo local."),
  awayTeamId: z.string().min(1, "Debes seleccionar un equipo visitante."),
  date: z.string().min(1, "La fecha es obligatoria."),
  time: z.string().min(1, "La hora es obligatoria."),
  location: z.string().min(3, "La ubicación debe tener al menos 3 caracteres."),
  gameFormatId: z.string().optional().nullable(),
}).refine(data => data.homeTeamId !== data.awayTeamId, {
    message: "El equipo local y visitante no pueden ser el mismo.",
    path: ["awayTeamId"],
});


interface GameFormProps {
  userProfile: UserFirestoreProfile | null;
  coachTeams: Team[];
  allTeams: Team[];
  gameFormats: GameFormat[];
  competitionCategories: CompetitionCategory[];
  seasons: Season[];
}

export function GameForm({ userProfile, coachTeams, allTeams, gameFormats, competitionCategories, seasons }: GameFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof gameFormSchema>>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      seasonId: "",
      competitionCategoryId: "",
      homeTeamId: "",
      awayTeamId: "",
      date: "",
      time: "",
      location: "",
      gameFormatId: undefined,
    },
  });

  const { watch, setValue } = form;
  const selectedSeasonId = watch('seasonId');
  const selectedCompetitionId = watch('competitionCategoryId');
  const selectedHomeTeamId = watch('homeTeamId');

  const selectedSeason = useMemo(() => seasons.find(s => s.id === selectedSeasonId), [seasons, selectedSeasonId]);
  
  const availableCompetitions = useMemo(() => {
    if (!selectedSeason) return [];
    return selectedSeason.competitions.map(sc => {
        return competitionCategories.find(cc => cc.id === sc.competitionCategoryId);
    }).filter((c): c is CompetitionCategory => !!c);
  }, [selectedSeason, competitionCategories]);

  const eligibleTeams = useMemo(() => {
    if (!selectedSeason || !selectedCompetitionId) return [];
    const competition = selectedSeason.competitions.find(c => c.competitionCategoryId === selectedCompetitionId);
    if (!competition) return [];
    return allTeams.filter(t => competition.teamIds.includes(t.id));
  }, [selectedSeason, selectedCompetitionId, allTeams]);

  const homeTeamOptions = useMemo(() => {
    if (!userProfile) return [];

    if (['super_admin', 'club_admin', 'coordinator'].includes(userProfile.profileTypeId)) {
      return eligibleTeams;
    }

    if (userProfile.profileTypeId === 'coach') {
      return eligibleTeams.filter(et => coachTeams.some(ct => ct.id === et.id));
    }
    
    return [];
  }, [eligibleTeams, coachTeams, userProfile]);

  const awayTeamOptions = useMemo(() => {
      return eligibleTeams.filter(et => et.id !== selectedHomeTeamId);
  }, [eligibleTeams, selectedHomeTeamId]);

  useEffect(() => {
    if (selectedCompetitionId) {
        const category = availableCompetitions.find(c => c.id === selectedCompetitionId);
        if (category && category.gameFormatId) {
            setValue("gameFormatId", category.gameFormatId, { shouldValidate: true });
        } else {
            setValue("gameFormatId", null, { shouldValidate: true });
        }
    }
  }, [selectedCompetitionId, availableCompetitions, setValue]);
  
  const selectedGameFormatName = gameFormats.find(f => f.id === watch("gameFormatId"))?.name;

  async function onSubmit(values: z.infer<typeof gameFormSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Error de autenticación", description: "Debes iniciar sesión." });
      return;
    }
    
    const result = await createGame(values, user.uid);

    if (result.success) {
      toast({
        title: "Partido Programado",
        description: `El partido ha sido programado con éxito.`,
      });
      router.push("/games");
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Error al Programar",
        description: result.error || "Ocurrió un error inesperado.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="seasonId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>1. Selecciona la Temporada</FormLabel>
              <Select onValueChange={value => {
                  field.onChange(value);
                  setValue('competitionCategoryId', '');
                  setValue('homeTeamId', '');
                  setValue('awayTeamId', '');
              }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una temporada activa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {seasons.map(season => (
                    <SelectItem key={season.id} value={season.id}>{season.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="competitionCategoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>2. Selecciona la Competición</FormLabel>
              <Select onValueChange={value => {
                  field.onChange(value);
                  setValue('homeTeamId', '');
                  setValue('awayTeamId', '');
              }} value={field.value || ""} disabled={!selectedSeasonId || availableCompetitions.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedSeasonId ? "Primero selecciona una temporada" : "Selecciona una competición"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableCompetitions.map(comp => (
                    <SelectItem key={comp.id} value={comp.id}>{comp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="homeTeamId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>3. Selecciona el Equipo Local</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCompetitionId || homeTeamOptions.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedCompetitionId ? "Primero selecciona competición" : "Selecciona el equipo local"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {homeTeamOptions.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {userProfile?.profileTypeId === 'coach' && homeTeamOptions.length === 0 && selectedCompetitionId && <p className="text-sm text-muted-foreground mt-1">No entrenas a ningún equipo registrado en esta competición.</p>}
              <FormMessage />
            </FormItem>
          )}
        />

         <FormField
          control={form.control}
          name="awayTeamId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>4. Selecciona el Equipo Visitante (Oponente)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!selectedHomeTeamId || awayTeamOptions.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedHomeTeamId ? "Primero selecciona el equipo local" : "Selecciona el oponente"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {awayTeamOptions.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                    <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Hora</FormLabel>
                <FormControl>
                    <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ubicación</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Polideportivo Municipal, Pista 4" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
            <FormLabel>Formato del Partido</FormLabel>
            <FormControl>
                <Input 
                    value={selectedGameFormatName || "Se selecciona automáticamente según la competición"} 
                    disabled 
                />
            </FormControl>
            <FormDescription>
                El formato del partido lo determina la categoría de la competición.
            </FormDescription>
            <FormMessage />
        </FormItem>

        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Programando Partido...
            </>
          ) : (
            "Programar Partido"
          )}
        </Button>
      </form>
    </Form>
  );
}
```

---

## src/components/layout/Header.tsx
```tsx
"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import UserNav from './UserNav';
import { Button } from '@/components/ui/button';
import { 
    LayoutDashboard, 
    ListChecks, 
    BarChart3, 
    LogIn, 
    UserCog, 
    CalendarClock, 
    CalendarCheck,
    Tag,
    ChevronDown,
    Building,
    ListOrdered,
    Database
} from 'lucide-react';
import { useEffect, useState } from 'react'; 
import { getUserProfileById } from '@/app/users/actions';
import type { UserFirestoreProfile } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserFirestoreProfile | null>(null);

  useEffect(() => {
    if (user && !profile) {
      getUserProfileById(user.uid).then(setProfile);
    }
    if (!user) {
      setProfile(null);
    }
  }, [user, profile]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-20 items-center">
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
          <span className="font-headline text-2xl font-bold text-primary">BCSJD App</span>
        </Link>
        
        <nav className="flex items-center space-x-6 text-sm font-medium">
          {!loading && user && (
            <>
              <Link href="/dashboard" className="transition-colors hover:text-primary flex items-center">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Panel
              </Link>
              <Link href="/tasks" className="transition-colors hover:text-primary flex items-center">
                <ListChecks className="mr-2 h-4 w-4" /> Tareas
              </Link>
              <Link href="/games" className="transition-colors hover:text-primary flex items-center">
                <CalendarClock className="mr-2 h-4 w-4" /> Partidos
              </Link>
              <Link href="/bcsjd-api-data" className="transition-colors hover:text-primary flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" /> Datos API
              </Link>
              
              {profile?.profileTypeId === 'super_admin' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="transition-colors hover:text-primary flex items-center">
                      Admin
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Gestión</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin/user-management" className="flex items-center w-full cursor-pointer">
                        <UserCog className="mr-2 h-4 w-4" />
                        <span>Usuarios</span>
                      </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                      <Link href="/clubs" className="flex items-center w-full cursor-pointer">
                        <Building className="mr-2 h-4 w-4" />
                        <span>Clubs</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/seasons" className="flex items-center w-full cursor-pointer">
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        <span>Temporadas</span>
                      </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                      <Link href="/admin/competition-categories" className="flex items-center w-full cursor-pointer">
                        <Tag className="mr-2 h-4 w-4" />
                        <span>Categorías</span>
                      </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                      <Link href="/admin/game-formats" className="flex items-center w-full cursor-pointer">
                        <ListOrdered className="mr-2 h-4 w-4" />
                        <span>Formatos de Partido</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                      <Link href="/admin/seeder" className="flex items-center w-full cursor-pointer">
                        <Database className="mr-2 h-4 w-4" />
                        <span>Poblar Datos (Dev)</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          {!loading && user ? (
            <UserNav />
          ) : !loading ? ( 
            <Button asChild variant="default" size="sm">
              <Link href="/login" className="flex items-center">
                <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión / Registro
              </Link>
            </Button>
          ) : null } 
        </div>
      </div>
    </header>
  );
}
```

---

## src/components/layout/UserNav.tsx
```tsx
"use client";

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, UserCircle, Settings } from 'lucide-react';

export default function UserNav() {
  const { user, logout } = useAuth(); // Get the centralized logout function

  if (!user) {
    return null;
  }

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
            <AvatarFallback>{getInitials(user.displayName || user.email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName || 'Usuario'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center">
              <UserCircle className="mr-2 h-4 w-4" />
              Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="flex items-center cursor-not-allowed">
            <Settings className="mr-2 h-4 w-4" />
            Configuración
            <span className="ml-auto text-xs text-muted-foreground">(Pronto)</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout(false)} className="flex items-center cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## src/components/players/PlayerForm.tsx
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Player, PlayerFormData } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createPlayer, updatePlayer } from "@/app/players/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import React from 'react';

const playerFormSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio."),
  lastName: z.string().min(1, "El apellido es obligatorio."),
  jerseyNumber: z.coerce.number().optional().nullable(),
  position: z.string().optional().nullable(),
});

interface PlayerFormProps {
  teamId: string;
  clubId: string;
  onFormSubmit: () => void;
  player?: Player | null; // For edit mode
}

export function PlayerForm({ teamId, clubId, onFormSubmit, player }: PlayerFormProps) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const form = useForm<z.infer<typeof playerFormSchema>>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      firstName: player?.firstName || "",
      lastName: player?.lastName || "",
      jerseyNumber: player?.jerseyNumber || undefined,
      position: player?.position || "",
    },
  });

  React.useEffect(() => {
    form.reset({
      firstName: player?.firstName || "",
      lastName: player?.lastName || "",
      jerseyNumber: player?.jerseyNumber || undefined,
      position: player?.position || "",
    });
  }, [player, form]);

  async function onSubmit(values: z.infer<typeof playerFormSchema>) {
    if (authLoading || !user) {
      toast({ variant: "destructive", title: "Error de autenticación", description: "Debes haber iniciado sesión." });
      return;
    }

    const result = player
      ? await updatePlayer(player.id, values, clubId, teamId)
      : await createPlayer(values, teamId, clubId, user.uid);

    if (result.success) {
      toast({
        title: player ? "Jugador Actualizado" : "Jugador Añadido",
        description: `El jugador "${values.firstName} ${values.lastName}" ha sido ${player ? 'actualizado' : 'añadido'} correctamente.`,
      });
      if (!player) form.reset();
      onFormSubmit();
    } else {
      toast({
        variant: "destructive",
        title: player ? "Error al actualizar" : "Error al añadir jugador",
        description: result.error || "Ocurrió un error inesperado.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Lionel" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Messi" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="jerseyNumber"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Dorsal (Opcional)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="Ej: 10" {...field} onChange={e => field.onChange(e.target.value === '' ? null : e.target.value)} value={field.value ?? ''}/>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Posición (Opcional)</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Delantero" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting || authLoading}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {player ? "Guardar Cambios" : "Añadir Jugador"}
        </Button>
      </form>
    </Form>
  );
}
```

---

## src/components/seasons/SeasonForm.tsx
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import React from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Season, SeasonFormData, Team, CompetitionCategory } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createSeason, updateSeason } from "@/app/seasons/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Trash2, PlusCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const competitionSchema = z.object({
  competitionCategoryId: z.string().min(1, "Debe seleccionar una categoría."),
  teamIds: z.array(z.string()).min(1, "Debe seleccionar al menos un equipo."),
});

const seasonFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  status: z.enum(["active", "archived", "upcoming"], { required_error: "Debe seleccionar un estado." }),
  competitions: z.array(competitionSchema).min(1, "Debe configurar al menos una competición."),
});

interface SeasonFormProps {
  allTeams: Team[];
  allCategories: CompetitionCategory[];
  onFormSubmit: () => void;
  season?: Season | null;
}

export function SeasonForm({ allTeams, allCategories, onFormSubmit, season }: SeasonFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof seasonFormSchema>>({
    resolver: zodResolver(seasonFormSchema),
    defaultValues: {
      name: season?.name || "",
      status: season?.status || "upcoming",
      competitions: season?.competitions || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "competitions",
  });
  
  React.useEffect(() => {
    if (season) {
        form.reset({
            name: season.name,
            status: season.status,
            competitions: season.competitions || [],
        });
    }
  }, [season, form]);

  async function onSubmit(values: z.infer<typeof seasonFormSchema>) {
    if (!user) return;
    const result = season 
        ? await updateSeason(season.id, values, user.uid)
        : await createSeason(values, user.uid);

    if (result.success) {
      toast({ 
          title: season ? "Temporada Actualizada" : "Temporada Creada",
          description: `La temporada ha sido ${season ? 'actualizada' : 'creada'} con éxito.` 
        });
      onFormSubmit();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la Temporada</FormLabel>
                <FormControl><Input placeholder="Ej: Temporada 2024/25" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="upcoming">Próxima</SelectItem>
                    <SelectItem value="active">Activa</SelectItem>
                    <SelectItem value="archived">Archivada</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Separator />
        
        <div>
          <h3 className="text-lg font-medium mb-2">Competiciones de la Temporada</h3>
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-md mb-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Competición #{index + 1}</h4>
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4 mr-2"/>Eliminar
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`competitions.${index}.competitionCategoryId`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categoría</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una categoría..."/></SelectTrigger></FormControl>
                                <SelectContent>
                                    {allCategories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                  />
                  <FormField
                      control={form.control}
                      name={`competitions.${index}.teamIds`}
                      render={() => (
                          <FormItem>
                              <FormLabel>Equipos Participantes</FormLabel>
                              <ScrollArea className="h-40 w-full rounded-md border p-4">
                                  {allTeams.map((team) => (
                                      <FormField
                                          key={team.id}
                                          control={form.control}
                                          name={`competitions.${index}.teamIds`}
                                          render={({ field }) => (
                                              <FormItem key={team.id} className="flex flex-row items-start space-x-3 space-y-0 mb-2">
                                                  <FormControl>
                                                      <Checkbox
                                                          checked={field.value?.includes(team.id)}
                                                          onCheckedChange={(checked) => {
                                                              return checked
                                                                  ? field.onChange([...(field.value || []), team.id])
                                                                  : field.onChange(field.value?.filter((value) => value !== team.id));
                                                          }}
                                                      />
                                                  </FormControl>
                                                  <FormLabel className="text-sm font-normal">{team.name}</FormLabel>
                                              </FormItem>
                                          )}
                                      />
                                  ))}
                              </ScrollArea>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => append({ competitionCategoryId: "", teamIds: [] })}
          >
            <PlusCircle className="h-4 w-4 mr-2"/>Añadir Competición
          </Button>
           <FormField
            control={form.control}
            name="competitions"
            render={() => (<FormMessage/>)}
           />
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {season ? 'Guardar Cambios' : 'Crear Temporada'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## src/components/tasks/TaskForm.tsx
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Task, TaskFormData } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createTask, updateTask } from "@/app/tasks/actions";
import { useAuth } from "@/hooks/useAuth";

const taskFormSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres."),
  description: z.string().optional(),
  status: z.enum(["todo", "inprogress", "done"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional().nullable(), // Date as string from input type="date"
});

interface TaskFormProps {
  task?: Task; // Optional: for editing existing task
  onFormSubmit?: () => void; // Optional callback after submission
}

// Helper to convert JS Date to yyyy-MM-dd string
const formatDateForInput = (date?: Date | null): string => {
  if (!date) return "";
  return date.toISOString().split('T')[0];
};

export function TaskForm({ task, onFormSubmit }: TaskFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || "todo",
      priority: task?.priority || "medium",
      dueDate: task ? formatDateForInput(task.dueDate) : "",
    },
  });

  async function onSubmit(values: z.infer<typeof taskFormSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Error de Autenticación", description: "Debes iniciar sesión." });
      return;
    }

    const taskData: TaskFormData = {
      ...values,
      dueDate: values.dueDate || null, // Ensure null if empty string
    };

    let result;
    if (task) {
      result = await updateTask(task.id, taskData, user.uid);
    } else {
      result = await createTask(taskData, user.uid);
    }

    if (result.success) {
      toast({
        title: task ? "Tarea Actualizada" : "Tarea Creada",
        description: `La tarea "${values.title}" ha sido ${task ? 'actualizada' : 'creada'} exitosamente.`,
      });
      if (onFormSubmit) {
        onFormSubmit();
      } else {
        if(!task && result.id) {
          router.push("/tasks");
        } else {
          router.push("/tasks");
        }
      }
      router.refresh(); 
    } else {
      toast({
        variant: "destructive",
        title: task ? "Fallo al Actualizar" : "Fallo al Crear",
        description: result.error || "Ocurrió un error inesperado.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Introduce el título de la tarea" {...field} />
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
              <FormLabel>Descripción (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Introduce la descripción de la tarea" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="todo">Por Hacer</SelectItem>
                    <SelectItem value="inprogress">En Progreso</SelectItem>
                    <SelectItem value="done">Hecho</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridad</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una prioridad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Entrega (Opcional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (task ? "Actualizando..." : "Creando...") : (task ? "Actualizar Tarea" : "Crear Tarea")}
        </Button>
        {task && (
            <Button type="button" variant="outline" onClick={() => router.back()} className="ml-2">
                Cancelar
            </Button>
        )}
      </form>
    </Form>
  );
}
```

---

## src/components/tasks/TasksList.tsx
```tsx
"use client";

import type { Task } from "@/types";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash2, PlusCircle, AlertTriangle, ListFilter, CalendarDays } from "lucide-react";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { deleteTask } from "@/app/tasks/actions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation"; 
import { format } from "date-fns";
import { es } from "date-fns/locale";
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

interface TasksListProps {
  tasks: Task[];
}

const statusColors: Record<Task['status'], string> = {
  todo: "border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
  inprogress: "border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100",
  done: "border-green-400 bg-green-50 text-green-700 hover:bg-green-100",
};

const priorityText: Record<Task['priority'], string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

const formatDate = (date?: Date | null) => {
  if (!date) return 'N/A';
  return format(date, 'd MMM, yyyy', { locale: es });
};

export function TasksList({ tasks }: TasksListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Task['status'] | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Task['priority'] | "all">("all");
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    }).sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)); // Sort by creation date
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  const handleDelete = async (taskId: string, taskTitle: string) => {
    if (!user) {
        toast({variant: "destructive", title: "Error", description: "Debes iniciar sesión."});
        return;
    }
    const result = await deleteTask(taskId, user.uid);
    if (result.success) {
      toast({ title: "Tarea Eliminada", description: `La tarea "${taskTitle}" ha sido eliminada.` });
      router.refresh();
    } else {
      toast({ variant: "destructive", title: "Error al Eliminar", description: result.error });
    }
  };

  if (tasks.length === 0 && searchTerm === "" && statusFilter === "all" && priorityFilter === "all") {
    return (
      <div className="text-center py-10">
        <ListFilter className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">¡Aún no hay tareas!</h2>
        <p className="text-muted-foreground mb-4">Comienza creando tu primera tarea.</p>
        <Button asChild>
          <Link href="/tasks/new"><PlusCircle className="mr-2 h-4 w-4" /> Crear Tarea</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle className="text-2xl font-headline">Filtros de Tareas</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Input 
                placeholder="Buscar tareas..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-auto"
              />
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Task['status'] | "all")}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  <SelectItem value="todo">Por Hacer</SelectItem>
                  <SelectItem value="inprogress">En Progreso</SelectItem>
                  <SelectItem value="done">Hecho</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as Task['priority'] | "all")}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filtrar por prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Prioridades</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No hay tareas que coincidan con tus filtros.</h3>
          <p className="text-muted-foreground">Intenta ajustar tu búsqueda o criterios de filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <Card key={task.id} className={`shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between ${statusColors[task.status]}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-semibold mb-1 text-primary-foreground group-hover:text-primary transition-colors">
                     <Link href={`/tasks/${task.id}`} className="hover:underline">{task.title}</Link>
                  </CardTitle>
                  <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'} className="capitalize shrink-0">
                    {priorityText[task.priority]}
                  </Badge>
                </div>
                {task.description && <CardDescription className="text-sm text-foreground/80 line-clamp-2">{task.description}</CardDescription>}
              </CardHeader>
              <CardContent className="flex-grow">
                 <div className="text-xs text-muted-foreground flex items-center">
                   <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                   Vence: {formatDate(task.dueDate)}
                 </div>
                 <div className="text-xs text-muted-foreground mt-1">
                   Creado: {formatDate(task.createdAt)}
                 </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-end space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/tasks/${task.id}`}><Eye className="mr-1 h-4 w-4" /> Ver</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/tasks/${task.id}/edit`}><Edit className="mr-1 h-4 w-4" /> Editar</Link>
                </Button>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm"><Trash2 className="mr-1 h-4 w-4" /> Eliminar</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente la tarea "{task.title}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(task.id, task.title)} className="bg-destructive hover:bg-destructive/90">
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## src/components/teams/TeamForm.tsx
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TeamFormData, GameFormat, CompetitionCategory, UserFirestoreProfile, Team } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createTeam, updateTeam } from "@/app/teams/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "../ui/separator";

const teamFormSchema = z.object({
  name: z.string().min(2, "El nombre del equipo debe tener al menos 2 caracteres.").max(100, "El nombre del equipo debe tener 100 caracteres o menos."),
  competitionCategoryId: z.string().min(1, "La categoría de competición es obligatoria."),
  gameFormatId: z.string().optional().nullable(),
  coachIds: z.array(z.string()).optional().default([]),
  coordinatorIds: z.array(z.string()).optional().default([]),
});

interface TeamFormProps {
  clubId: string;
  gameFormats: GameFormat[];
  competitionCategories: CompetitionCategory[];
  coaches: UserFirestoreProfile[];
  coordinators: UserFirestoreProfile[];
  onFormSubmit?: () => void;
  team?: Team; // For edit mode
}

export function TeamForm({ clubId, gameFormats, competitionCategories, coaches, coordinators, onFormSubmit, team }: TeamFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const form = useForm<z.infer<typeof teamFormSchema>>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: team?.name || "",
      competitionCategoryId: team?.competitionCategoryId || "",
      gameFormatId: team?.gameFormatId || undefined,
      coachIds: team?.coachIds || [],
      coordinatorIds: team?.coordinatorIds || [],
    },
  });

  const { watch, setValue, reset } = form;
  const selectedCompetitionId = watch("competitionCategoryId");

  useEffect(() => {
    if (team) {
      reset({
        name: team.name,
        competitionCategoryId: team.competitionCategoryId || "",
        gameFormatId: team.gameFormatId,
        coachIds: team.coachIds || [],
        coordinatorIds: team.coordinatorIds || [],
      });
    }
  }, [team, reset]);

  useEffect(() => {
    if (selectedCompetitionId) {
      const category = competitionCategories.find(c => c.id === selectedCompetitionId);
      if (category && category.gameFormatId) {
        setValue("gameFormatId", category.gameFormatId, { shouldValidate: true });
      } else {
        setValue("gameFormatId", null, { shouldValidate: true });
      }
    }
  }, [selectedCompetitionId, competitionCategories, setValue]);

  async function onSubmit(values: z.infer<typeof teamFormSchema>) {
    if (authLoading || !user) {
      toast({ variant: "destructive", title: "Error de autenticación", description: "Debes haber iniciado sesión." });
      return;
    }

    const result = team 
      ? await updateTeam(team.id, values, user.uid)
      : await createTeam(values, clubId, user.uid);
      
    if (result.success) {
      toast({
        title: team ? "Equipo Actualizado" : "Equipo Creado",
        description: `El equipo "${values.name}" ha sido ${team ? 'actualizado' : 'creado'} correctamente.`,
      });
      if (!team) form.reset();
      if (onFormSubmit) onFormSubmit();
      
    } else {
      toast({
        variant: "destructive",
        title: team ? "Error al actualizar" : "Error en la creación",
        description: result.error || "Ocurrió un error inesperado.",
      });
    }
  }
  
  const selectedGameFormatName = gameFormats.find(f => f.id === watch("gameFormatId"))?.name;

  if (authLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Equipo</FormLabel>
              <FormControl>
                <Input placeholder="Introduce el nombre del equipo (ej: U12 Águilas)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="competitionCategoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría de Competición</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={competitionCategories.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={competitionCategories.length === 0 ? "No hay categorías disponibles" : "Selecciona una categoría"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {competitionCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormItem>
          <FormLabel>Formato de Partido</FormLabel>
          <FormControl>
              <Input 
                value={selectedGameFormatName || "Se selecciona automáticamente según la categoría"} 
                disabled 
              />
          </FormControl>
           <FormDescription>
            El formato del partido lo determina la categoría de la competición.
          </FormDescription>
          <FormMessage />
        </FormItem>
        
        <Separator />
        
        <FormField
          control={form.control}
          name="coachIds"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Asignar Entrenadores</FormLabel>
                <FormDescription>
                  Selecciona entre los entrenadores aprobados para este club.
                </FormDescription>
              </div>
              <div className="space-y-2">
                {coaches.length > 0 ? coaches.map((item) => (
                  <FormField
                    key={item.uid}
                    control={form.control}
                    name="coachIds"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.uid}
                          className="flex flex-row items-center space-x-3"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.uid)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item.uid])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.uid
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-sm">
                            {item.displayName} <span className="text-muted-foreground">({item.email})</span>
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                )) : <p className="text-sm text-muted-foreground italic">No se encontraron entrenadores para este club.</p>}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Separator />

         <FormField
          control={form.control}
          name="coordinatorIds"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Asignar Coordinadores</FormLabel>
                <FormDescription>
                  Selecciona entre los coordinadores aprobados para este club.
                </FormDescription>
              </div>
              <div className="space-y-2">
                {coordinators.length > 0 ? coordinators.map((item) => (
                  <FormField
                    key={item.uid}
                    control={form.control}
                    name="coordinatorIds"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.uid}
                          className="flex flex-row items-center space-x-3"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.uid)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item.uid])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.uid
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-sm">
                            {item.displayName} <span className="text-muted-foreground">({item.email})</span>
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                )) : <p className="text-sm text-muted-foreground italic">No se encontraron coordinadores para este club.</p>}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting || authLoading}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {form.formState.isSubmitting ? (team ? "Guardando..." : "Creando...") : (team ? "Guardar Cambios" : "Crear Equipo")}
        </Button>
      </form>
    </Form>
  );
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
