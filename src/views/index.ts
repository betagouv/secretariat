import { makeHtml } from './index.html'
import { Home } from './pages/HomePage'
import { Admin } from './pages/AdminPage'

export const HomePage = (props: Parameters<typeof Home>[0]) =>
  makeHtml({
    Component: Home,
    props,
    hydrate: true,
    title: 'Secretariat BetaGouv',
    pageName: 'Home', // This must match the Component name
  })

export const AdminPage = (props: Parameters<typeof Home>[0]) =>
  makeHtml({
    Component: Admin,
    props,
    hydrate: true,
    title: 'Administration Page',
    pageName: 'Admin', // This must match the Component name
  })