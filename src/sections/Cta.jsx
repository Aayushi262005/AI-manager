import React from 'react'
import { ArrowRight } from 'lucide-react'

const Cta = () => {
  return (
    <div className="bg-primary w-full flex flex-col items-center justify-center py-10 px-6" id="cta">
        <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto px-6 py-20 gap-6">
            <h2 className="text-4xl font-bold text-accent leading-tight mb-4">
            Your adaptive workspace is waiting for you. Start today.
            </h2>
            <p className="text-lg text-accent leading-relaxed opacity-70">
            Join others who always know what to work on next
            </p>    
        </div>
        <button className="group flex items-center gap-2 px-5 py-2 text-base font-bold text-primary bg-primary-foreground rounded-md hover:opacity-90 transition-transform duration-300 hover:-translate-y-1">
            Get started for free
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
    </div>
  )
}
export default Cta