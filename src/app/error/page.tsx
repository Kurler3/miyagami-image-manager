'use client'

import { useSearchParams } from "next/navigation"

export default function ErrorPage() {

    const searchParams = useSearchParams()
    const msg = searchParams.get('msg') ?? 'An unknown error occurred.'

    return (
        <div>
            <h1>Error</h1>
            <p>{msg}</p>
        </div>
    )
}