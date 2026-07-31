import React from 'react'

const Highlight = () => {
  return (
    <div className='w-full bg-background pb-20' id="usecases">
        <div className='w-full bg-card grid grid-cols-2 lg:grid-cols-4 px-8 py-8'>
            <div>
                <h3 className="text-xl font-bold text-accent-foreground leading-tight mb-6 opacity-80 flex flex-col items-center justify-center text-center">
                Adaptive <br/>
                Planning
                </h3>
            </div>
            <div>
                <h3 className="text-xl font-bold text-accent-foreground leading-tight mb-6 opacity-80 flex flex-col items-center justify-center text-center">
                Focused <br/>
                Sessions
                </h3>
            </div>
            <div>
                <h3 className="text-xl font-bold text-accent-foreground leading-tight mb-6 opacity-80 flex flex-col items-center justify-center text-center">
                Automatic <br/>
                Replanning
                </h3>
            </div>
            <div>
                <h3 className="text-xl font-bold text-accent-foreground leading-tight mb-6 opacity-80 flex flex-col items-center justify-center text-center">
                AI-Assisted <br/>
                Decisions
                </h3>
            </div>
        </div>
    </div>
  )
}

export default Highlight