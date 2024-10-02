'use client'

import Link from "next/link";
import { DASHBOARD_SIDE_BAR_OPTIONS, DASHBOARD_SIDEBAR_ID } from "../../../utils/constants"
import DashboardSideBarOption from "./DashboardSideBarOption"
import { Separator } from "../../../components/ui/separator";
import { usePathname } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { LogIn } from 'lucide-react';

type IProps = {
    isLoggedIn: boolean;
}

export default function DashboardSideBar({
    isLoggedIn,
}: IProps) {

    const pathname = usePathname();

    return (
        <>

            <input id={DASHBOARD_SIDEBAR_ID} type="checkbox" className="drawer-toggle" />

            <div className="drawer-side">

                <label htmlFor={DASHBOARD_SIDEBAR_ID} aria-label="close sidebar" className="drawer-overlay"></label>

                {/* SIDEBAR CONTENT */}
                <div
                    className='flex flex-col justify-between items-start h-screen bg-base-200 border-r border-r-slate-600 p-4'
                >
                    <ul className="menu text-base-content h-full w-full gap-4">

                        {/* APP TITLE */}
                        <Link
                            className="btn btn-ghost text-main-text-green text-sm md:text-base"
                            href="/"
                        >
                            Miyagami Image Manager
                        </Link>

                        {/* SEPARATOR */}
                        <Separator className="bg-gray-300" />

                        {/* OPTIONS */}
                        {
                            DASHBOARD_SIDE_BAR_OPTIONS.map((option) => {

                                if (option.protected && !isLoggedIn) return null;

                                return (
                                    <DashboardSideBarOption
                                        key={`dashboard_side_option_${option.href}`}
                                        option={option}
                                        currentPath={pathname}
                                    />
                                )
                            })
                        }

                    </ul>

                    {/* LOGOUT/LOGIN BUTTON */}
                    {
                        isLoggedIn ? (
                            <div>
                                Hi
                            </div>
                        ) : (
                            <div className="flex justify-center items-center gap-2 flex-col w-full">

                                <Button className="w-full text-white bg-blue-400 hover:bg-blue-500" asChild>
                                    <Link href='/login'>
                                        Login
                                    </Link>
                                    
                                </Button>

                                <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white" asChild>
                                    <Link href='/sign-up'>
                                    <LogIn className="mr-2 h-4 w-4"/> Sign up
                                    </Link>
                                </Button>

                            </div>

                        )
                    }


                </div>


            </div>

        </>

    )
}