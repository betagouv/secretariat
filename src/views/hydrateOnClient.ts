import { hydrateRoot } from 'react-dom/client';

export const hydrateOnClient = (Component: (props: any) => JSX.Element) => {
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', function () {
      const props = (window as any).__INITIAL_PROPS__
      hydrateRoot(document.querySelector('#root'), Component(props))
    })
  }
}