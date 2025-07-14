// This page is intentionally left blank as the login flow is currently disabled.
// The application uses a mock user provided by AuthContext.
// To re-enable, you can restore the previous content for the login form.
import { redirect } from 'next/navigation';

export default function LoginPage() {
    redirect('/dashboard');
    return null;
}
