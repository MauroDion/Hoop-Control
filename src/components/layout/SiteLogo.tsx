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
        // Increased width to allow the logo to be wider while maintaining its aspect ratio.
        // The height is constrained to 32px.
        return <Image src={logoUrl} alt="Hoop Control Logo" width={128} height={32} style={{ objectFit: 'contain', height: '32px' }} />;
    }
    
    return <Logo className="h-8 w-8 text-primary" />;
};

export default SiteLogo;
