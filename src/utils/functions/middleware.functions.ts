import { FORBID_AUTH_ROUTES, NEED_AUTH_ROUTES } from "../constants";
import { getSession } from "../supabase/server";

export async function handleCheckAuthorizationByRoute(
    pathname: string,
) {

    const isLoggedIn = !!(await getSession())

    console.log(isLoggedIn, pathname)

    // If need auth => redirect to /login
    if(NEED_AUTH_ROUTES.includes(pathname) && !isLoggedIn) {
        return {
            needsRedirect: true,
            newUrl: '/login'
        }
    } 

    // If can't have auth and is currently logged in => redirect back to the dashboard/public
    if(FORBID_AUTH_ROUTES.includes(pathname) && isLoggedIn) {
        return {
            needsRedirect: true,
            newUrl: '/dashboard/public'
        }
    }

    return {
        needsRedirect: false
    }
}