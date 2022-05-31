import { makeHtml } from './index.html'
import { Home } from './pages/HomePage'
import { Admin } from './pages/AdminPage'
import { InfoUpdate } from './pages/InfoUpdatePage'

export const HomePage = (props: Parameters<typeof Home>[0]) =>
  makeHtml({
    Component: Home,
    props,
    hydrate: true,
    title: 'Secretariat BetaGouv',
    pageName: 'Home', // This must match the Component name
  })

export const AdminPage = (props: Parameters<typeof Admin>[0]) =>
  makeHtml({
    Component: Admin,
    props,
    hydrate: true,
    title: 'Administration Page',
    pageName: 'Admin', // This must match the Component name
  })

export const InfoUpdatePage = (props: Parameters<typeof InfoUpdate>[0]) =>
  makeHtml({
    Component: InfoUpdate,
    props,
    hydrate: true,
    title: 'Info Update Page',
    pageName: 'InfoUpdate', // This must match the Component name
  })
