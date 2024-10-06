import Link from "next/link";
import { Button } from "../../../../components/ui/button";


export default function SignoutSuccessful() {
    return (
        <div className="h-screen w-screen flex justify-center items-center flex-col gap-10">


            <div className="text-lg font-bold text-white">
                You have been logged out successfully!
            </div>

            <Button asChild className="text-white">
                <Link href='/'>
                    Go back home
                </Link>
            </Button>

        </div>
    )
}