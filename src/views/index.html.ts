import ReactDOMServer from 'react-dom/server'
import type { Request } from 'express'
interface HasRequest {
  request: Request
}

type PageProps<T> = {
  Component: (props: T) => JSX.Element
  props: T,
  pageName: string
} & ({ hydrate: false } | { hydrate: true; pageName: string })

const html = String.raw

function stripRequest(props: HasRequest) {
  const { query, user } = props.request
  return {
    ...props,
    request: { query, user },
  }
}

export const makeHtml = <T extends HasRequest>(args: PageProps<T>) => {
  const { Component, props, pageName } = args
  return html`
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
  
      <title>${props.title}</title>
  
      <link rel="apple-touch-icon" sizes="180x180" href="/static/favicon/apple-touch-icon.png">
      <link rel="icon" type="image/png" sizes="32x32" href="/static/favicon/favicon-32x32.png">
      <link rel="icon" type="image/png" sizes="16x16" href="/static/favicon/favicon-16x16.png">
      <link rel="manifest" href="/static/favicon/site.webmanifest">
  
      <link rel="stylesheet" href="/static/css/main.css">
        ${args.hydrate
          ? html`
              <script src="/public/js/shared.js"></script>
              <script src="/public/js/${args.pageName}.js?${process.env.npm_package_version}"></script>
            `
          : ''}
      </head>
      <body>
        <header id="header">
          <a class="no-decoration" href="/">
            <h3>🤖&nbsp;Secrétariat automatique de BetaGouv</h3>
          </a>
        </header>
        <main role="main">
          <section class="section section-grey no-padding">
        <div id="root">${ReactDOMServer.renderToString(Component(props))}</div>
        ${args.hydrate
          ? html`<script>
              window.__INITIAL_PROPS__ = ${props ? JSON.stringify(stripRequest(props)) : '{}'}
            </script>`
          : ''}
        <script src="/static/scripts/hashtoparam.js"></script>
      </body>
    </html>
  `
}