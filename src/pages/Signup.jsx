import React from 'react'
import { Link,useNavigate} from 'react-router-dom'
import signupbg from '../assets/Signbg.png'
import { Layers, Mail, Lock, Eye, EyeOff, ArrowLeft,User } from "lucide-react";

const Signup = () => {
    const navigate= useNavigate();
  return (
    <div className=" w-full min-h-screen flex items-center justify-center bg-cover bg-center py-20"
      style={{ backgroundImage: `url(${signupbg})` }}
      >
      <div className="mb-10">
        <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-secondary rounded-full hover:opacity-90 transition-opacity shadow-sm">
          <ArrowLeft className="w-4 h-4" />
            Back to home
        </Link>
      </div>
      <div className="bg-card/60 backdrop-blur-xl border border-border rounded-2xl shadow-xl shadow-primary/10 p-8 w-full max-w-md mx-4 py-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            Create your Account
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
             Start your productive journey here
          </p>
          <div className="w-14 h-1 bg-gradient-to-rfrom-primary to-chart-3 rounded-full mx-auto mt-3" />
        </div>
      
        <form>
          <div>
            <label htmlFor="Name" className="block text-sm font-medium text-foreground mt-1.5 text-left">
              Name
            </label>
            <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="Name"
                  type="text"
                  placeholder="Enter your name"
                  className="w-full pl-10 px-4 py-2 mt-1.5 text-sm text-foreground bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-3"                    />
             </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mt-1.5 text-left">
              Email
            </label>
            <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-10 px-4 py-2 mt-1.5 text-sm text-foreground bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-3"                    />
             </div>
          </div>
      
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mt-1.5 text-left">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="password"
                type="password"
                placeholder="Create your password"
                className="w-full pl-10 px-4 py-2 mt-1.5 text-sm text-foreground bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-3"
              />
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mt-1.5 text-left">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                className="w-full pl-10 px-4 py-2 mt-1.5 text-sm text-foreground bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-3"
              />
            </div>
          </div>
      
          <div className="flex justify-between">
            <label className="text-sm text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 rounded accent-primary mr-2 " />
              I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>  
            </label>
          </div>
      
          <button
            type="submit"
            className="w-full mt-8 mb-2 items-center gap-2 px-4 py-2.5 text-base font-medium text-primary-foreground bg-primary rounded-md hover:opacity-90"
          >
            Sign Up
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
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Signup