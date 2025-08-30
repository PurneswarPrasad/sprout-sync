import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken, setUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      try {
        // Store the token
        setToken(token);
        
        // Decode the JWT to get user info (without verification for now)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.userId,
          email: payload.email,
          name: payload.name,
          avatarUrl: payload.avatarUrl,
        });
        
        // Redirect to home page
        navigate('/home');
      } catch (error) {
        console.error('Error processing auth callback:', error);
        navigate('/auth-error');
      }
    } else {
      // No token found, redirect to auth error
      navigate('/auth-error');
    }
  }, [searchParams, setToken, setUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Completing sign in...
        </h2>
        <p className="text-gray-600">
          Please wait while we set up your account.
        </p>
      </div>
    </div>
  );
}

