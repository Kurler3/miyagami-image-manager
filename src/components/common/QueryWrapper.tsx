'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

type IProps = {
    children: ReactNode;
}

export default function QueryWrapper({ children }: IProps) {
    const [queryClient] = useState(() => new QueryClient());

    return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
    )
}