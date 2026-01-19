'use client'

import { useEffect } from 'react'

export default function RegisterSW() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // Register service worker
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('SW Registered:', registration)
                })
                .catch((error) => {
                    console.error('SW Registration failed:', error)
                })
        }
    }, [])

    return null
}
