import { NextResponse } from 'next/server'
import { createClient, getCurrentUser } from '../../../../utils/supabase/server'
import prisma from '../../../../utils/prisma/prisma'

export async function GET(request: Request) {

    const { searchParams, origin } = new URL(request.url)

    // Try to get the token from google
    const code = searchParams.get('code')

    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {

        const supabase = createClient()

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {

            const currentUser = await getCurrentUser();

            try {
                // Check if new user
                const existingUserInDb = await prisma.user.findUnique({
                    where: {
                        id: currentUser!.id,
                    },
                    select: {
                        id: true,
                    }
                });

                // If new user => create it in db.
                if (!existingUserInDb) {

                    await prisma.user.create({
                        data: {
                            id: currentUser!.id,
                            email: currentUser!.email!,
                        },
                    });

                }

            } catch (error) {

                console.error('Error while creating user...', error);

                return NextResponse.redirect(`${origin}/error?msg=Error while creating the user... please try again`)

            }

            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer

            const isLocalEnv = process.env.NODE_ENV === 'development'

            // If is in dev, no load balancer
            if (isLocalEnv) {

                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${origin}${next}`)

                // If theres a redirect url after auth
            } else if (forwardedHost) {

                return NextResponse.redirect(`https://${forwardedHost}${next}`)

                // If no redirect url after auth
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}