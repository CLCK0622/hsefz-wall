// components/Watermark.tsx
'use client';

import { useUser } from '@clerk/nextjs';
import classes from './Watermark.module.scss';
import { useEffect } from 'react';

export function Watermark() {
    const { user } = useUser();

    useEffect(() => {
        // If the user is not logged in, do nothing.
        if (!user?.id) {
            return;
        }

        const watermarkId = 'resurrecting-watermark-container';
        const watermarkText = `${user.id.slice(-6)}`;

        // This function creates the entire watermark element from scratch.
        const createWatermarkElement = () => {
            const container = document.createElement('div');
            container.id = watermarkId;
            container.className = classes.watermarkContainer;

            // Create the grid of text nodes
            Array.from({ length: 500 }).forEach(() => {
                const textNode = document.createElement('div');
                textNode.className = classes.watermarkText;
                textNode.appendChild(document.createTextNode(watermarkText));
                container.appendChild(textNode);
            });

            return container;
        };

        // This function checks if the watermark exists and adds it if it doesn't.
        const ensureWatermarkExists = () => {
            if (!document.getElementById(watermarkId)) {
                document.body.appendChild(createWatermarkElement());
            }
        };

        // Initial creation
        ensureWatermarkExists();

        // Set up a "sentry" to check periodically and recreate if it's been removed.
        const intervalId = setInterval(ensureWatermarkExists, 50);

        // This is the cleanup function. When the component unmounts (e.g., user logs out),
        // it will remove the watermark and the sentry.
        return () => {
            clearInterval(intervalId);
            const watermarkElement = document.getElementById(watermarkId);
            if (watermarkElement) {
                watermarkElement.remove();
            }
        };
    }, [user]); // Rerun this effect if the user logs in or out.

    // The React component itself renders nothing. It's just a manager.
    return null;
}