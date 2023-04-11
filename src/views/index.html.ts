import ReactDOMServer from 'react-dom/server'
import type { Request } from 'express'

interface HasRequest {
  request: Request
}

type PageProps<T> = {
  Component: (props: T) => JSX.Element
  props,
  pageName: string,
  title: string
} & ({ hydrate: false } | { hydrate: true; pageName: string })

type EmailProps<T> = {
  Component: (props: T) => JSX.Element
  props,
}

const html = String.raw

function stripRequest(props: HasRequest) {
  const { query } = props.request
  return {
    ...props,
    request: { query },
  }
}

export const makeHtml = <T extends HasRequest>(args: PageProps<T>) => {
  const { Component, props } = args
  return html`
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
  
      <title>${args.title}</title>
  
      <link rel="apple-touch-icon" sizes="180x180" href="/static/favicon/apple-touch-icon.png">
      <link rel="icon" type="image/png" sizes="32x32" href="/static/favicon/favicon-32x32.png">
      <link rel="icon" type="image/png" sizes="16x16" href="/static/favicon/favicon-16x16.png">
      <link rel="manifest" href="/static/favicon/site.webmanifest">
      <link rel="stylesheet" media="screen,print" href='/react-tabulator/styles.css'/>
      <link rel="stylesheet" media="screen,print" href='/react-tabulator/tabulator.min.css'/>
      <link rel="stylesheet" media="screen,print" href='/react-datepicker/react-datepicker.css'/>
      <link rel="stylesheet" media="screen,print" href='/react-markdown-editor-lite/index.css'/>

      <link rel="stylesheet" href="/static/css/main.css">
        ${args.hydrate
          ? html`
              <script src="/public/js/shared.js"></script>
              <script src="/public/js/${args.pageName}.js?${process.env.npm_package_version}"></script>
            `
          : ''}
      </head>
      <!-- Matomo -->
      <script>
        var _paq = window._paq = window._paq || [];
        /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
        _paq.push(['trackPageView']);
        _paq.push(['enableLinkTracking']);
        (function() {
          var u="https://stats.data.gouv.fr/";
          _paq.push(['setTrackerUrl', u+'piwik.php']);
          _paq.push(['setSiteId', '260']);
          var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
          g.async=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
        })();
      </script>
      <!-- End Matomo Code -->
      <!-- Matomo Tag Manager -->
      <script>
        var _mtm = window._mtm = window._mtm || [];
        _mtm.push({'mtm.startTime': (new Date().getTime()), 'event': 'mtm.Start'});
        var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
        g.async=true; g.src='https://stats.data.gouv.fr/js/container_nSSiLydj.js'; s.parentNode.insertBefore(g,s);
      </script>
      <!-- End Matomo Tag Manager -->
      <body>
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

export const makeHtmlEmail = <T>(args: EmailProps<T>) => {
  const { Component, props } = args
  return html`
  <!DOCTYPE html>
    <html>
      <body>
        <div id="root">${ReactDOMServer.renderToString(Component(props))}</div>
      </body>
    </html>
  `
}

export const makeMarkdownContent = <T>(args: EmailProps<T>) => {
  const { Component, props } = args
  return String.raw`${ReactDOMServer.renderToString(Component(props))}`
}

