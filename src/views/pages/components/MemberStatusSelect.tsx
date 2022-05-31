import React from "react"
import Select from 'react-select'

import { ClientOnly } from "./ClientOnly"

export default ({ status, onChange }) => {
    return <ClientOnly><Select
      options={status}
      onChange={onChange}
      placeholder={'Sélectionne les membres actifs/inactifs/les deux'} /></ClientOnly>
  }
  