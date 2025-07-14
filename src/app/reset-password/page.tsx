// This page is intentionally left blank as the reset-password flow is currently disabled.
// The application uses a mock user provided by AuthContext.
import { redirect } from 'next/navigation';

export default function ResetPasswordPage() {
    redirect('/dashboard');
    return null;
}
