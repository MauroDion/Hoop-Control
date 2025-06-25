"use client";

import React, { useState, useEffect } from 'react';
import { getBrandingSettings } from '@/app/admin/settings/actions';
import Logo from './Logo'; // Fallback SVG logo
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

interface SiteLogoProps {
    className?: string;
}

const SiteLogo = ({ className }: SiteLogoProps) => {
    const [logoUrl, setLogoUrl] = useState<string | null | undefined>(undefined);

    useEffect(() => {
        getBrandingSettings().then(settings => {
            setLogoUrl(settings.logoDataUrl || null);
        });
    }, []);

    if (logoUrl === undefined) {
        return <Skeleton className={cn("h-8 w-8 rounded-md", className)} />;
    }

    if (logoUrl) {
        // Using `img` tag for better flexibility with Data URLs and styling
        // The parent container should control the size.
        // We ensure object-contain to prevent stretching.
        return <img src={logoUrl} alt="Hoop Control Logo" className={cn("object-contain", className)} />;
    }
    
    return <Logo className={cn("text-primary", className)} />;
};

export default SiteLogo;
