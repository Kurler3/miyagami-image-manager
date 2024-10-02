import { redirect } from "next/navigation";
import { Button } from "../../components/ui/button";
import { getSession } from "../../utils/supabase/server"
import Link from "next/link";

type IProps = {
    children: React.ReactNode
}

export default async function DashboardLayout({ children }: IProps) {

    const session = await getSession();

    return (
        <div className="w-screen h-screen drawer lg:drawer-open">


            <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />

            <div className="drawer-content flex flex-col items-center justify-center">

                {children}

                {/* Page content here */}
                <label htmlFor="my-drawer-2" className="btn btn-primary drawer-button lg:hidden">
                    Open drawer
                </label>
            </div>


            <div className="drawer-side">

                <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label>


                <div
                    className='flex flex-col justify-between items-start h-screen bg-base-300 border-r border-r-slate-600'
                >
                    <ul className="menu text-base-content h-full w-full p-4 gap-4">

                        {/* APP TITLE */}
                        <Link
                            className="btn btn-ghost text-main-text-green text-sm md:text-base"
                            href="/"
                        >
                            Miyagami Image Manager
                        </Link>

                        {/* PUBLIC IMAGES */}
                        

                        {/* PRIVATE IMAGES */}
                        
                        {/* FAVORITE IMAGES */}
                        

                    </ul>   
                </div>


            </div>

        </div>
    )
}