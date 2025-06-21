import { LoginForm } from "@/components/auth/LoginForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, ShieldX } from "lucide-react";


export default function LoginPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const status = searchParams?.status;

  const renderStatusMessage = () => {
    switch (status) {
      case 'pending_approval':
        return (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Account Pending Approval</AlertTitle>
            <AlertDescription>
              Your registration is submitted. You will be able to log in once an administrator approves your account.
            </AlertDescription>
          </Alert>
        );
      case 'rejected':
        return (
          <Alert variant="destructive">
            <ShieldX className="h-4 w-4" />
            <AlertTitle>Account Access Denied</AlertTitle>
            <AlertDescription>
              Your account access has been rejected. Please contact an administrator for more information.
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Welcome Back!</CardTitle>
          <CardDescription>Sign in to access your BCSJD dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStatusMessage()}
          <LoginForm />
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <GoogleSignInButton />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
