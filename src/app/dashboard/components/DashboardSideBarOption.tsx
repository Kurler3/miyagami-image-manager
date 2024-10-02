import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { IDashboardSideBarOption } from "../../../utils/types"


type IProps = {
    option: IDashboardSideBarOption;
    currentPath: string;
}

export default function DashboardSideBarOption({
    option,
    currentPath
}: IProps) {

    const isActive = currentPath === option.href;

    return (
        <Button
            className={`${isActive ? "text-white" : ""} hover:bg-primary`}
            asChild
            variant={!isActive ? 'ghost' : 'default'}
        >
            <Link href={option.href} className="flex justify-start items-center w-full font-bold">
                <option.icon className="mr-2 h-4 w-4" /> <div className="flex-1 ml-2">{option.title}</div>
            </Link>
        </Button>
    )
}