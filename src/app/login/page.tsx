import AuthComponent from "../../components/auth/AuthComponent";

// Server-side component
export default function LoginPage() {
    return (
        <AuthComponent 
          buttonTitle="Login with Google"
          title="Login"
          message="Please login to continue"
        />
    );
}