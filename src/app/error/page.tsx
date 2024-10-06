'use client'

import { useSearchParams } from "next/navigation"
import { Suspense } from 'react'


const ErrorComponent = () => {
    const searchParams = useSearchParams()
    const msg = searchParams.get('msg') ?? 'An unknown error occurred.'

    return (
            <div>
                <h1>Error</h1>
                <p>{msg}</p>
            </div>
        
    )
}

export default function ErrorPage() {

    return (
        <Suspense>
            <ErrorComponent />
        </Suspense>
    )
}