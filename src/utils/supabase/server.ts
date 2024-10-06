import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export function createClient() {
    const cookieStore = cookies()

    return createServerClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}

// Create a function to get the current session
export async function getSession() {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
        console.error('Error fetching session:', error)
        return null
    }
    return session
}

export async function getCurrentUser() {

  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser() 

  if(error) {
    console.error('Error fetching user:', error)
    return null
  }

  return data.user;
}

// Used to refresh expired auth tokens and to store them.
export async function updateSession(request: NextRequest) {

    let supabaseResponse = NextResponse.next({
      request,
    })
  
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )
  
    // Refresh the token if expired
    await supabase.auth.getUser()

  
    return supabaseResponse
  }