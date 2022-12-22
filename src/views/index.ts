import { makeHtml } from './index.html'
import { Home } from './pages/HomePage'
import { Admin } from './pages/AdminPage'
import { InfoUpdate } from './pages/InfoUpdatePage'
import { Onboarding } from './pages/OnboardingPage'
import { Community } from './pages/CommunityPage'
import { AdminMattermost } from './pages/AdminMattermostPage'
import { BaseInfoUpdate } from './pages/BaseInfoUpdatePage'

export const HomePage = (props: Parameters<typeof Home>[0]) =>
  makeHtml({
    Component: Home,
    props,
    hydrate: true,
    title: 'Espace-Membre BetaGouv',
    pageName: 'Home', // This must match the Component name
  })

  export const OnboardingPage = (props: Parameters<typeof Onboarding>[0]) =>
  makeHtml({
    Component: Onboarding,
    props,
    hydrate: true,
    title: 'Espace-Membre BetaGouv',
    pageName: 'Onboarding', // This must match the Component name
  })

  export const CommunityPage = (props: Parameters<typeof Community>[0]) =>
  makeHtml({
    Component: Community,
    props,
    hydrate: true,
    title: 'Page communauté',
    pageName: 'Community', // This must match the Component name
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
    title: 'Mise à jour de mes infos - Espace Membre',
    pageName: 'InfoUpdate', // This must match the Component name
  })

export const BaseInfoUpdatePage = (props: Parameters<typeof BaseInfoUpdate>[0]) =>
  makeHtml({
    Component: BaseInfoUpdate,
    props,
    hydrate: true,
    title: 'Mise à jour de mes infos - Espace Membre',
    pageName: 'BaseInfoUpdate', // This must match the Component name
})


export const AdminMattermostPage = (props: Parameters<typeof AdminMattermostPage>[0]) => makeHtml({
  Component: AdminMattermost,
  props,
  hydrate: true,
  title: 'Administration Mattermost Page',
  pageName: 'AdminMattermost', // This must match the Component name
})
