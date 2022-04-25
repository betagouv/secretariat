import { makeHtml } from './index.html'
import { Home } from './pages/HomePage'

export const HomePage = (props: Parameters<typeof Home>[0]) =>
  makeHtml({
    Component: Home,
    props,
    hydrate: true,
    title: 'Secretariat BetaGouv',
    pageName: 'Home', // This must match the Component name
  })