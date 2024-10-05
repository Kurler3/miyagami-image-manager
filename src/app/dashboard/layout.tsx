
import QueryWrapper from "../../components/common/QueryWrapper";
import { DASHBOARD_SIDEBAR_ID } from "../../utils/constants";
import { getSession } from "../../utils/supabase/server";
import DashboardSideBar from "./components/DashboardSideBar";


type IProps = {
    children: React.ReactNode
}

export default async function DashboardLayout({ children }: IProps) {

    const session = await getSession();

    return (
        <QueryWrapper>
            <div className="w-screen h-screen drawer lg:drawer-open">

                <div className="drawer-content flex flex-col items-center justify-center">

                    {/* ACTUAL PAGE CONTENT */}
                    {children}

                    {/* Page content here */}
                    <label htmlFor={DASHBOARD_SIDEBAR_ID} className="btn btn-primary drawer-button lg:hidden">
                        Open drawer
                    </label>
                </div>

                <DashboardSideBar
                    isLoggedIn={!!session}
                />

            </div>
        </QueryWrapper>
    )
}