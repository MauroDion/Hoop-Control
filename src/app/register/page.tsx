// This page is intentionally left blank as the registration flow is currently disabled.
// The application uses a mock user provided by AuthContext.
import { redirect } from 'next/navigation';

export default function RegisterPage() {
    redirect('/dashboard');
    return null;
}
