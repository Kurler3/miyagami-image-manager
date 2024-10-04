'use server'

import { redirect } from "next/navigation";
import { createClient } from "../supabase/server"


export async function loginWithGoogle() {

    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: 'http://localhost:3000/auth/google/callback', //TODO: To change before PROD
        },
    })

    // If something went wrong
    if(error) {
        console.error(error)
        //TODO Should also show a message.
        return redirect('/error');
    }

    // If there's a callback url from the sign in
    if (data.url) {
        return redirect(data.url) // use the redirect API for your server framework
    }

}

export async function signout() {

    const supabase = createClient();

    const { error } = await supabase.auth.signOut()

    if(error) {
        console.error(error)
        return redirect('/error');
    }

    return redirect('/auth/sign-out/successful');
}