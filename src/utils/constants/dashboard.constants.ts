import { LockKeyholeOpen, FolderLock, Star } from "lucide-react";
import { IDashboardSideBarOption } from "../types";

export const DASHBOARD_SIDE_BAR_OPTIONS: IDashboardSideBarOption[] = [
    {
        title: 'Public',
        icon: LockKeyholeOpen,
        href: '/dashboard/public',
        protected: false
    },
    {
        title: 'Private',
        icon: FolderLock,
        href: '/dashboard/private',
        protected: true
    },
    {
        title: 'Favorites',
        icon: Star,
        href: '/dashboard/favorites',
        protected: true,
    }
]

export const DASHBOARD_SIDEBAR_ID = 'dashboard-sidebar';