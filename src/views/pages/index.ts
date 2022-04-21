import { makeHtml } from '../index.html'
import { Home } from './HomePage'

export const HomePage = (props: Parameters<typeof Home>[0]) =>
  makeHtml({
    Component: Home,
    props,
    hydrate: true,
    pageName: 'Home', // This must match the Component name
  })