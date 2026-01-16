'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { login } from './actions'
import { EyeIcon, EyeSlashIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors cursor-pointer"
        >
            {pending ? 'Memproses...' : 'MASUK'}
        </button>
    )
}

export default function LoginPage() {
    const [state, formAction] = useActionState(login, null)
    const [showPassword, setShowPassword] = useState(false)

    // Explicit type handling for state
    const errorMessage = state && typeof state === 'object' && 'error' in state
        ? (state.error as string)
        : null;

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 font-sans">
            <div className="w-full max-w-md bg-card rounded-xl shadow-lg border border-border p-8">
                <div className="text-center mb-8">
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <WrenchScrewdriverIcon className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary">BENGKEL & KAFE</h2>
                    <p className="text-text-secondary mt-1">Silakan login untuk melanjutkan</p>
                </div>

                <form action={formAction} className="space-y-6">
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-1">
                            No HP
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            required
                            className="appearance-none block w-full px-4 py-3 border border-border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-black"
                            placeholder="08xxxxxxxxxx"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                className="appearance-none block w-full px-4 py-3 border border-border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-black"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                                ) : (
                                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="rounded-md bg-red-50 p-4 border border-red-200">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">{errorMessage}</h3>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <SubmitButton />
                    </div>
                </form>
            </div>

            <div className="mt-8 text-center text-xs text-text-secondary">
                &copy; 2026 Nugraha Bengkel & Kafe.
            </div>
        </div>
    )
}
