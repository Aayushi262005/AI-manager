import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../config/Firebase'
import { Layers, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import signupbg from '../assets/Signbg.png'
import { signInWithEmailAndPassword } from 'firebase/auth';
import { sendPasswordResetEmail } from 'firebase/auth';
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error,setError]=useState('');
  const [resetMessage,setResetMessage]=useState('');
  const [loading,setLoading]=useState(false);

  
  const signIn = async (e) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    setLoading(true);
    try{
      await setPersistence(auth, rememberMe? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');

    }catch(error){
      setError(getfriendlyerror(error.code));
    }
    finally{
      setLoading(false);
    }
  };
  const getfriendlyerror = (errorCode) => {
    switch(errorCode){
      case 'auth/invalid-email':
        return 'The email address is not valid.';
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return 'No account found with these credentials.';
      case 'auth/wrong-password':
        return 'The password is incorrect.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  const handlePasswordReset = async () => {
  setError('');
  setResetMessage('');
  if(!email){
    setError('Please enter your email address to reset your password.Check your Spam folder if you do not see the email in your inbox.');
    return;
  }
  try{
    await sendPasswordResetEmail(auth, email);
    setResetMessage(`Password reset email sent to ${email}.`);
  } catch (error) {
    setError(getfriendlyerror(error.code));
  }
  };
  return (
    <div
      className=" w-full min-h-screen flex items-center justify-center bg-cover bg-center py-20"
      style={{ backgroundImage: `url(${signupbg})` }}
    >
      <div className="mb-10">
        <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-secondary rounded-full hover:opacity-90 transition-opacity shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>
      </div>
      <div className="bg-card/60 backdrop-blur-xl border border-border rounded-2xl shadow-xl shadow-primary/10 p-8 w-full max-w-md mx-4 py-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome Back
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Login to continue your journey
          </p>
          <div className="w-14 h-1 bg-gradient-to-rfrom-primary to-chart-3 rounded-full mx-auto mt-3" />
        </div>
        {error &&(
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2 mb-3 text-center">
            {error}
          </div>
        )}
        {resetMessage &&(
          <div className="text-sm text-success bg-success/10 border border-success/30 rounded-md px-3 py-2 mb-3 text-center">
            {resetMessage}
          </div>
        )}

        <form onSubmit={signIn}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mt-1.5 text-left">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-10 px-4 py-2 mt-1.5 text-sm text-foreground bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-3"
              />
            </div>
          </div>

          <div>
            <label  htmlFor="password" className="block text-sm font-medium text-foreground mt-1.5 text-left">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pl-10 px-4 py-2 mt-1.5 text-sm text-foreground bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-3"
              />
              <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between">
            <label className="text-sm flex items-center gap-2 text-muted-foreground cursor-pointer select-none">
              <input type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded accent-primary" />
              Remember me
            </label>
            <button
              type="button"
              onClick={handlePasswordReset}
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 mb-2 items-center gap-2 px-4 py-2.5 text-base font-medium text-primary-foreground bg-primary rounded-md hover:opacity-90"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium border border-border hover:opacity-90 hover:bg-secondary/80 transition-opacity"
        >
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"/>
            <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.4C29.7 35.4 27 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.6 39.7 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.6 5.4C40.9 36.9 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login