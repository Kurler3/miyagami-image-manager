import { signout } from "../../utils/serverActions/auth.actions";
import { Button } from "../ui/button";



export default function LogoutButton() {
    return (
        <form className="w-full">
            <Button 
                className="w-full text-white"
                formAction={signout}
            >
                Logout
            </Button>
        </form>
    )
}