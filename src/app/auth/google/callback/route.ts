import { NextResponse } from 'next/server'
import { createClient, getCurrentUser } from '../../../../utils/supabase/server'
import prisma from '../../../../utils/prisma/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // Try to get the auth code from the URL params
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (!code) {
        // Handle case where no code is found
        return NextResponse.redirect('/auth/auth-code-error');
    }

    const supabase = createClient();

    // Exchange the Google auth code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect('/auth/auth-code-error');
    }

    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return NextResponse.redirect('/auth/auth-code-error');
    }

    try {
        // Check if the user exists in the database
        const existingUser = await prisma.user.findUnique({
            where: { id: currentUser.id },
            select: { id: true },
        });

        // If user doesn't exist, create a new one
        if (!existingUser) {
            await prisma.user.create({
                data: {
                    id: currentUser.id,
                    email: currentUser.email!,
                },
            });
        }
    } catch (error) {
        console.error('Error while creating user in DB:', error);
        return NextResponse.redirect('/error?msg=Error creating user, please try again');
    }

    // Handle environment: use x-forwarded-host for production
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.VERCEL_ENV === 'development';

    // Redirect based on environment
    const redirectUrl = isLocalEnv
        ? `http://localhost:3000${next}`
        : forwardedHost
            ? `https://${forwardedHost}${next}`
            : `https://${request.headers.get('host')}${next}`;

    return NextResponse.redirect(redirectUrl);
}