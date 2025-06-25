"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getBrandingSettings } from '@/app/admin/settings/actions';
import Logo from './Logo'; // Fallback SVG logo
import { Skeleton } from '../ui/skeleton';

const SiteLogo = () => {
    const [logoUrl, setLogoUrl] = useState<string | null | undefined>(undefined);

    useEffect(() => {
        getBrandingSettings().then(settings => {
            setLogoUrl(settings.logoDataUrl || null);
        });
    }, []);

    if (logoUrl === undefined) {
        return <Skeleton className="h-8 w-8 rounded-md" />;
    }

    if (logoUrl) {
        return <Image src={logoUrl} alt="Hoop Control Logo" width={32} height={32} style={{ objectFit: 'contain', height: '32px' }} />;
    }
    
    return <Logo className="h-8 w-8 text-primary" />;
};

export default SiteLogo;
