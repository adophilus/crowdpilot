import { createFileRoute } from '@tanstack/react-router'
import { Domains } from '../components/Domains'
import { Footer } from '../components/Footer'
import { Help } from '../components/Help'
import { Hero } from '../components/Hero'
import { HowItWorks } from '../components/HowItWorks'
import { Nav } from '../components/Nav'
import { PersonaDemo } from '../components/PersonaDemo'
import { Roadmap } from '../components/Roadmap'
import { UseCases } from '../components/UseCases'
import { WhatItDoes } from '../components/WhatItDoes'

export const Route = createFileRoute('/')({
  component: Landing
})

function Landing() {
  return (
    <div className="page">
      <div className="frame">
        <Nav />
        <main>
          <Hero />
          <WhatItDoes />
          <PersonaDemo />
          <HowItWorks />
          <Domains />
          <UseCases />
          <Roadmap />
          <Help />
        </main>
        <Footer />
      </div>
    </div>
  )
}
