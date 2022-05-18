import type { Request } from 'express'
import React from 'react'
import Footer from './Footer'
import Header from './Header'

interface HasRequest {
  request: Request
}

export const PageLayout = <T extends HasRequest>(Component: (props: T) => JSX.Element) => (
  props: T
) => {
  return (
    <>
      <header id="header">
        <a className="no-decoration" href="/">
          <h3>🤖&nbsp;Secrétariat automatique de BetaGouv</h3>
        </a>
      </header>
      <main role="main">
        <section className="section section-grey no-padding">
          <Header />
          <Component {...props} />
          <Footer />
        </section>
      </main>
    </>
  )
}
