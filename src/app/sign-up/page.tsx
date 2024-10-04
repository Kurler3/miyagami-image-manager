import AuthComponent from "../../components/auth/AuthComponent";

// Server-side component
export default function SignUpPage() {
    return (
        <AuthComponent 
            title="Sign Up"
            message='Sign up to access all features'
            buttonTitle="Sign up with Google"
        />
    );
}