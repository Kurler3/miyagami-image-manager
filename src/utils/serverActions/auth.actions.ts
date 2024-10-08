'use server'

import { redirect } from "next/navigation";
import { createClient } from "../supabase/server"
import { BASE_URL } from "../constants/envVars.constants";
// import { BASE_URL } from "../constants/envVars.constants";


export async function loginWithGoogle() {

    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${BASE_URL}/auth/google/callback`,
        },
    })

    // If something went wrong
    if(error) {
        console.error(error)
        return redirect('/error?msg=Something went wrong while trying to login :( please try again');
    }

    // If there's a callback url from the sign in
    if (data.url) {
        return redirect(data.url)
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