import React from 'react'
import Navbar from '../components/Navbar'
import Hero from '../sections/Hero'
import Features from '../sections/Features'
import Highlight from '../sections/Highlight'
import Works from '../sections/Works'
import Cta from '../sections/Cta'
import LandingFooter from '../sections/LandingFooter'

const Landing = () => {
  return (
    <div className="bg-background min-h-screen">
        <Navbar/>
        <Hero/>
        <Highlight/>
        <Features/>
        <Works/>
        <Cta/>
        <LandingFooter/>

    </div>
  )
}

export default Landing