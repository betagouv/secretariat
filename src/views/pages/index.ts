import { makeHtml } from './templates/index.html'
import { Home } from './pages/HomePage'

export const HomePage = (props: Parameters<typeof Home>[0]) =>
  makeHtml({
    Component: Home,
    props,
    hydrate: true,
    pageName: 'Home', // This must match the Component name
  })