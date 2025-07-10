
# Backup del Proyecto Hoop Control (2025-07-10 07:15)

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

## android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java
```java
package com.getcapacitor.myapp;

import static org.junit.Assert.*;

import android.content.Context;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Instrumented test, which will execute on an Android device.
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
@RunWith(AndroidJUnit4.class)
public class ExampleInstrumentedTest {

    @Test
    public void useAppContext() throws Exception {
        // Context of the app under test.
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();

        assertEquals("com.getcapacitor.app", appContext.getPackageName());
    }
}
```

---

## android/app/src/main/AndroidManifest.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>
    </application>

    <!-- Permissions -->

    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
```

---

## android/app/src/main/java/com/example/app/MainActivity.java
```java
package com.example.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {}
```

---

## android/app/src/main/res/drawable/ic_launcher_background.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportHeight="108"
    android:viewportWidth="108">
    <path
        android:fillColor="#26A69A"
        android:pathData="M0,0h108v108h-108z" />
    <path
        android:fillColor="#00000000"
        android:pathData="M9,0L9,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M19,0L19,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M29,0L29,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M39,0L39,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M49,0L49,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M59,0L59,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M69,0L69,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M79,0L79,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M89,0L89,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M99,0L99,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,9L108,9"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,19L108,19"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,29L108,29"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,39L108,39"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,49L108,49"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,59L108,59"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,69L108,69"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,79L108,79"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,89L108,89"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,99L108,99"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M19,29L89,29"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M19,39L89,39"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M19,49L89,49"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M19,59L89,59"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M19,69L89,69"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M19,79L89,79"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M29,19L29,89"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M39,19L39,89"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M49,19L49,89"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M59,19L59,89"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M69,19L69,89"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M79,19L79,89"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
</vector>
```

---

## android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml
```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:aapt="http://schemas.android.com/aapt"
    android:width="108dp"
    android:height="108dp"
    android:viewportHeight="108"
    android:viewportWidth="108">
    <path
        android:fillType="evenOdd"
        android:pathData="M32,64C32,64 38.39,52.99 44.13,50.95C51.37,48.37 70.14,49.57 70.14,49.57L108.26,87.69L108,109.01L75.97,107.97L32,64Z"
        android:strokeColor="#00000000"
        android:strokeWidth="1">
        <aapt:attr name="android:fillColor">
            <gradient
                android:endX="78.5885"
                android:endY="90.9159"
                android:startX="48.7653"
                android:startY="61.0927"
                android:type="linear">
                <item
                    android:color="#44000000"
                    android:offset="0.0" />
                <item
                    android:color="#00000000"
                    android:offset="1.0" />
            </gradient>
        </aapt:attr>
    </path>
    <path
        android:fillColor="#FFFFFF"
        android:fillType="nonZero"
        android:pathData="M66.94,46.02L66.94,46.02C72.44,50.07 76,56.61 76,64L32,64C32,56.61 35.56,50.11 40.98,46.06L36.18,41.19C35.45,40.45 35.45,39.3 36.18,38.56C36.91,37.81 38.05,37.81 38.78,38.56L44.25,44.05C47.18,42.57 50.48,41.71 54,41.71C57.48,41.71 60.78,42.57 63.68,44.05L69.11,38.56C69.84,37.81 70.98,37.81 71.71,38.56C72.44,39.3 72.44,40.45 71.71,41.19L66.94,46.02ZM62.94,56.92C64.08,56.92 65,56.01 65,54.88C65,53.76 64.08,52.85 62.94,52.85C61.8,52.85 60.88,53.76 60.88,54.88C60.88,56.01 61.8,56.92 62.94,56.92ZM45.06,56.92C46.2,56.92 47.13,56.01 47.13,54.88C47.13,53.76 46.2,52.85 45.06,52.85C43.92,52.85 43,53.76 43,54.88C43,56.01 43.92,56.92 45.06,56.92Z"
        android:strokeColor="#00000000"
        android:strokeWidth="1" />
</vector>
```

---

## android/app/src/main/res/layout/activity_main.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.coordinatorlayout.widget.CoordinatorLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <WebView
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
</androidx.coordinatorlayout.widget.CoordinatorLayout>
```

---

## android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

---

## android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

---

## android/app/src/main/res/values/ic_launcher_background.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>
```

---

## android/app/src/main/res/values/strings.xml
```xml
<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">Hoop Control</string>
    <string name="title_activity_main">Hoop Control</string>
    <string name="package_name">com.hoopcontrol.app</string>
    <string name="custom_url_scheme">com.hoopcontrol.app</string>
</resources>
```

---

## android/app/src/main/res/values/styles.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>

    <!-- Base application theme. -->
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <!-- Customize your theme here. -->
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
    </style>

    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:background">@null</item>
    </style>


    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="android:background">@drawable/splash</item>
    </style>
</resources>
```

---

## android/app/src/main/res/xml/file_paths.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-path name="my_images" path="." />
    <cache-path name="my_cache_images" path="." />
</paths>
```

---

## android/app/src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java
```java
package com.getcapacitor.myapp;

import static org.junit.Assert.*;

import org.junit.Test;

/**
 * Example local unit test, which will execute on the development machine (host).
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
public class ExampleUnitTest {

    @Test
    public void addition_isCorrect() throws Exception {
        assertEquals(4, 2 + 2);
    }
}
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

## capacitor.config.ts
```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hoopcontrol.app',
  appName: 'Hoop Control',
  webDir: 'public'
};

export default config;
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
    transpilePackages: ['firebase'],
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
  "name": "hoop-control",
  "version": "0.1.0",
  "private": true,
  "description": "A NextJS app for basketball game management.",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@capacitor/android": "^6.1.0",
    "@capacitor/core": "^6.1.0",
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
    "firebase": "^10.12.2",
    "firebase-admin": "12.1.1",
    "lucide-react": "0.400.0",
    "next": "14.2.4",
    "process": "^0.11.10",
    "react": "18.3.1",
    "react-day-picker": "8.10.0",
    "react-dom": "18.3.1",
    "recharts": "2.14.0",
    "swr": "^2.3.4",
    "tailwind-merge": "2.3.0",
    "tailwindcss-animate": "1.0.7",
    "uuid": "^9.0.1",
    "zod": "3.24.0"
  },
  "devDependencies": {
    "@capacitor/cli": "^6.1.0",
    "@types/node": "20.12.5",
    "@types/react": "18.2.0",
    "@types/react-dom": "18.2.0",
    "@types/uuid": "9.0.8",
    "postcss": "^8",
    "prettier": "^3.3.2",
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
import { useAuth } from '@/contexts/AuthContext';
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
import { useAuth } from '@/contexts/AuthContext';
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
        <Button onClick={() => router.push('/games')} className="mt-4">Ir a Partidos</Button>
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

import { adminDb, adminAuth } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import type { Game, Player, Season, Team, UserFirestoreProfile } from '@/types';

// Helper function to delete all documents in a collection
async function deleteCollection(db: admin.firestore.Firestore, collectionPath: string, batchSize: number = 100) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(db: admin.firestore.Firestore, query: admin.firestore.Query, resolve: (value: unknown) => void) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        resolve(true);
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}

// Helper to delete documents based on a query (e.g., seeded users).
async function deleteDocumentsByQuery(db: admin.firestore.Firestore, query: admin.firestore.Query, batchSize: number = 100) {
    const snapshot = await query.limit(batchSize).get();
    
    if (snapshot.size === 0) {
        return;
    }
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    
    if (snapshot.size === batchSize) {
        process.nextTick(() => {
            deleteDocumentsByQuery(db, query, batchSize);
        });
    }
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
    if (!adminDb || !adminAuth) {
        return { success: false, error: 'La base de datos del admin o la autenticación no están inicializadas.' };
    }
    
    const db = adminDb; // Local constant for type narrowing

    try {
        console.log('Iniciando el proceso de borrado de datos de prueba...');
        
        const collectionsToDelete = ['gameFormats', 'competitionCategories', 'clubs', 'teams', 'players', 'seasons', 'games'];
        for (const collection of collectionsToDelete) {
            console.log(`Borrando colección: ${collection}...`);
            await deleteCollection(db, collection);
            console.log(`Colección ${collection} borrada.`);
        }
        
        console.log("Borrando solo perfiles de usuario de prueba (seeded)...");
        const seederUsersQuery = db.collection('user_profiles').where('isSeeded', '==', true);
        await deleteDocumentsByQuery(db, seederUsersQuery);
        console.log("Perfiles de usuario de prueba borrados.");
        
        console.log('Proceso de borrado completado. Iniciando la carga de nuevos datos...');

        const batch = db.batch();
        const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

        // --- 1. Game Formats ---
        const gameFormat5v5 = { id: '5v5-standard', name: 'Estándar 5v5', numPeriods: 4, periodDurationMinutes: 10, defaultTotalTimeouts: 4 };
        const gameFormat3v3 = { id: '3v3-half', name: '3v3 Media Pista', numPeriods: 1, periodDurationMinutes: 15, defaultTotalTimeouts: 2 };
        batch.set(db.collection('gameFormats').doc(gameFormat5v5.id), gameFormat5v5);
        batch.set(db.collection('gameFormats').doc(gameFormat3v3.id), gameFormat3v3);

        // --- 2. Competition Categories ---
        const categories = [
            { id: 'u10-mixto', name: 'U10 Mixto', level: 10, gameFormatId: gameFormat5v5.id, isFeminine: false },
            { id: 'u12-masculino', name: 'U12 Masculino', level: 12, gameFormatId: gameFormat5v5.id, isFeminine: false },
            { id: 'u14-femenino', name: 'U14 Femenino', level: 14, gameFormatId: gameFormat5v5.id, isFeminine: true },
            { id: 'u16-masculino', name: 'U16 Masculino', level: 16, gameFormatId: gameFormat5v5.id, isFeminine: false },
            { id: 'senior-femenino', name: 'Senior Femenino', level: 99, gameFormatId: gameFormat5v5.id, isFeminine: true },
        ];
        categories.forEach(cat => batch.set(db.collection('competitionCategories').doc(cat.id), {name: cat.name, level: cat.level, gameFormatId: cat.gameFormatId}));

        // --- 3. Clubs ---
        const clubs = [
            { id: 'club-estudiantes', name: 'Club Estudiantes Madrid', shortName: 'ESTU', city_name: 'Madrid', province_name: 'Madrid' },
            { id: 'club-valencia', name: 'Valencia Basket Club', shortName: 'VBC', city_name: 'Valencia', province_name: 'Valencia' },
            { id: 'club-baskonia', name: 'Saski Baskonia', shortName: 'BKN', city_name: 'Vitoria-Gasteiz', province_name: 'Álava' },
            { id: 'club-joventut', name: 'Club Joventut Badalona', shortName: 'CJB', city_name: 'Badalona', province_name: 'Barcelona' },
            { id: 'club-unicaja', name: 'Unicaja Málaga', shortName: 'UNI', city_name: 'Málaga', province_name: 'Málaga' },
        ];
        clubs.forEach(club => batch.set(db.collection('clubs').doc(club.id), {...club, approved: true, createdAt: serverTimestamp}));

        // --- Setup for Season Data ---
        const seasonCompetitionsMap = new Map<string, string[]>();
        categories.forEach(cat => seasonCompetitionsMap.set(cat.id, []));

        // --- 4. Users, Teams, Players ---
        let userCounter = 1;
        for (const club of clubs) {
            const coordName = `${getRandomItem(firstNamesMasculine)} ${getRandomItem(lastNames)}`;
            const coordId = `user-coord-${userCounter}`;
            const coordinator: Omit<UserFirestoreProfile, 'createdAt' | 'updatedAt' | 'uid' | 'children'> = {
                displayName: coordName, email: `${coordName.toLowerCase().replace(/\s/g, '.')}@example.com`,
                profileTypeId: 'coordinator', clubId: club.id, status: 'approved', isSeeded: true, onboardingCompleted: true,
            };
            batch.set(db.collection('user_profiles').doc(coordId), {...coordinator, uid: coordId, createdAt: serverTimestamp, updatedAt: serverTimestamp });
            userCounter++;
            
            for(const category of categories) {
                const coachIds: string[] = [];
                for (let i = 0; i < 2; i++) {
                    const coachName = `${getRandomItem(firstNamesFeminine)} ${getRandomItem(lastNames)}`;
                    const coachId = `user-coach-${userCounter}`;
                    coachIds.push(coachId);
                    const coach: Omit<UserFirestoreProfile, 'createdAt' | 'updatedAt' | 'uid' | 'children'> = {
                        displayName: coachName, email: `${coachName.toLowerCase().replace(/\s/g, '.')}@example.com`,
                        profileTypeId: 'coach', clubId: club.id, status: 'approved', isSeeded: true, onboardingCompleted: true,
                    };
                    batch.set(db.collection('user_profiles').doc(coachId), {...coach, uid: coachId, createdAt: serverTimestamp, updatedAt: serverTimestamp});
                    userCounter++;
                 }

                const teamId = `${club.shortName?.toLowerCase()}-${category.id}`;
                const teamDocRef = db.collection('teams').doc(teamId);
                const teamData: any = {
                    id: teamId, name: `${club.name} ${category.name}`, clubId: club.id,
                    competitionCategoryId: category.id, coachIds, coordinatorIds: [coordId],
                    createdAt: serverTimestamp, updatedAt: serverTimestamp
                };
                batch.set(teamDocRef, teamData);
                
                seasonCompetitionsMap.get(category.id)?.push(teamId);

                for (let p = 0; p < 9; p++) {
                    const playerName = generatePlayerName(category.isFeminine);
                    const player: Partial<Player> = { ...playerName, jerseyNumber: 4 + p, teamId: teamId };
                    batch.set(db.collection('players').doc(), {...player, createdAt: serverTimestamp});
                }
            }
        }
        
        // --- 5. Season ---
        const seasonCompetitions = Array.from(seasonCompetitionsMap.entries()).map(([catId, teamIds]) => ({
            competitionCategoryId: catId,
            teamIds: teamIds
        }));

        const season2425 = {
            name: 'Temporada 2024-2025',
            status: 'active',
            competitions: seasonCompetitions,
            createdAt: serverTimestamp,
            updatedAt: serverTimestamp,
        };
        batch.set(db.collection('seasons').doc('season-24-25'), season2425);
        
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

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Database, Wand2 } from 'lucide-react';
import { seedDatabase } from './actions';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
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

export default function SeederPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isSeeding, setIsSeeding] = useState(false);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setPageState('loading');
      return;
    }
    if (!user) {
      router.replace('/login?redirect=/admin/seeder');
      return;
    }
    
    if (profile) {
      if (profile.profileTypeId === 'super_admin') {
        setPageState('success');
      } else {
        setError('Acceso Denegado. Solo los Super Admins pueden poblar la base de datos.');
        setPageState('error');
      }
    } else {
       setError("No se pudo cargar tu perfil. Es posible que no exista o haya un problema de configuración.");
       setPageState('error');
    }

  }, [user, profile, authLoading, router]);


  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setError(null);
    const result = await seedDatabase();
    if (result.success) {
      toast({
        title: '¡Base de Datos Poblada!',
        description: 'Los datos de prueba se han cargado. La página se recargará.',
        duration: 5000,
      });
      setTimeout(() => window.location.reload(), 2000);
    } else {
      setError(result.error || 'Ha ocurrido un error desconocido.');
      toast({
        variant: 'destructive',
        title: 'Error al Poblar la Base de Datos',
        description: result.error,
      });
    }
    setIsSeeding(false);
  };
  
  if (pageState === 'loading') {
    return (
       <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Verificando permisos...</p>
      </div>
    )
  }

  if (pageState === 'error') {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h1 className="text-2xl font-semibold text-destructive">Error</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button asChild><Link href="/dashboard">Volver al Panel</Link></Button>
        </div>
      );
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
            <div className="text-center p-6 border-2 border-dashed rounded-lg">
                <Wand2 className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
                <h3 className="text-xl font-semibold">¿Listo para empezar?</h3>
                <p className="text-muted-foreground my-2">
                    Hacer clic en el botón de abajo borrará las colecciones de prueba (equipos, jugadores, partidos, etc.) y los perfiles de usuario de prueba, y los reemplazará con un nuevo conjunto de datos.
                </p>
                <p className="text-sm font-bold text-destructive my-4">
                    <AlertTriangle className="inline-block h-4 w-4 mr-1" />
                    ¡Esta acción es irreversible y afectará a todos los usuarios!
                </p>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button disabled={isSeeding} size="lg" variant="destructive">
                        {isSeeding ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Database className="mr-2 h-5 w-5" />}
                        {isSeeding ? 'Poblando...' : 'Poblar Base de Datos de Prueba'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción es irreversible. Se borrarán permanentemente las colecciones de prueba (partidos, temporadas, equipos, etc.) y los usuarios generados por el seeder para ser reemplazados con nuevos datos. Los usuarios reales no serán eliminados.
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

export async function saveBrandingSettings(settings: Partial<BrandingSettings>): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized.' };
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
import { useAuth } from '@/contexts/AuthContext';
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
    const [isSavingAppName, setIsSavingAppName] = useState(false);

    const [settings, setSettings] = useState<BrandingSettings>({});

    const loadSettings = useCallback(async () => {
        try {
            const settings = await getBrandingSettings();
            setSettings(settings);
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
```

---

... El resto de los archivos están incluidos en la copia de seguridad.
