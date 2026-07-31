import React from 'react'

const Card = ({ icon: Icon, iconcolor='text-primary',iconbg='bg-accent',title,description}) => {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm max-w-sm mx-auto hover:opacity-90 transition-transform duration-300 hover:-translate-y-2 hover:shadow-lg ">
      <div className={`${iconbg} w-12 h-12 rounded-full flex items-center justify-center mb-6 `}>
        <Icon className={`w-5 h-5 ${iconcolor}`} />
      </div>
      <h3 className="text-xl font-semibold text-card-foreground mb-3">
        {title}
      </h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}

export default Card