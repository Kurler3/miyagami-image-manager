'use server'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { loginWithGoogle } from "../../utils/serverActions/auth.actions";

type IProps = {
    buttonTitle: string;
    title: string;
    message: string;
}

// Server-side component
export default async function AuthComponent({
    buttonTitle,
    title,
    message,
}: IProps) {

    return (
        <div className="flex items-center justify-center min-h-screen bg-base-200">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center text-white">
                        {title}
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="flex justify-center mb-4">
                        <p className="text-center text-gray-500">
                            {message}
                        </p>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-center">
                    <form className="w-full">


                        <Button
                            className="w-full bg-white text-black border-[0.2px] border-black transition p-4 font-semibold hover:bg-gray-300 hover:scale-[1.05]"
                            formAction={loginWithGoogle}
                        >
                            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                                <path
                                    fill="#4285F4"
                                    d="M24 9.5c3.04 0 5.55 1.07 7.54 2.83l5.61-5.61C33.66 3.61 29.1 1.5 24 1.5 14.95 1.5 7.35 7.92 5.12 16.44l6.54 5.09C12.9 13.68 18.01 9.5 24 9.5z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M46.04 24.52c0-1.39-.13-2.71-.37-4H24v8h12.58c-.54 2.59-2.12 4.78-4.45 6.26l6.55 5.09c3.83-3.54 6.36-8.77 6.36-15.35z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M11.66 28.03c-.51-1.5-.8-3.09-.8-4.75s.29-3.25.8-4.75l-6.54-5.09C3.9 16.4 3 19.13 3 22.28s.9 5.88 2.12 8.84l6.54-5.09z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M24 46.5c5.1 0 9.66-1.73 13.21-4.69l-6.55-5.09c-1.82 1.18-4.08 1.88-6.66 1.88-5.99 0-11.1-4.18-12.82-9.94l-6.54 5.09C7.35 40.08 14.95 46.5 24 46.5z"
                                />
                            </svg>
                            {buttonTitle}
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}