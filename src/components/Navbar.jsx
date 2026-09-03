import React from 'react'
import { Layers } from "lucide-react";
import { useNavigate } from 'react-router-dom'

const Navbar = () => {
  const navigate = useNavigate();
  return (
    <div className="w-full border-b border-border bg-card/70 backdrop-blur-md fixed top-0 left-0 z-50">
        <div className="flex items-center justify-between w-full px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary">
                <Layers className="w-5 h-5 text-primary-foreground" />
              </div>
                <span className="text-2xl font-semibold text-foreground">
                  ManageIt
                </span>
            </div>
            <div className="gap-8 hidden md:flex">
              <a href="#features" className="text-lg text-muted-foreground hover:text-primary transition-colors">
                  Features
              </a>
              <a href="#works" className="text-lg text-muted-foreground hover:text-primary transition-colors">
                How it works
              </a>
              <a href="#cta" className="text-lg text-muted-foreground hover:text-primary transition-colors">
                Changelog
              </a>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => navigate('/login')} className="text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                Sign In
              </button>
              <button onClick={() => navigate('/signup')} className="flex items-center gap-2 px-5 py-2 text-base font-medium text-primary-foreground bg-primary rounded-full hover:opacity-90 transition-transform duration-300 hover:-translate-y-1">
                Get started free
              </button>
            </div>
        </div>
    </div>
  )
}

export default Navbar