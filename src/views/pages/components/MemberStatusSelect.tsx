import React from "react"
import Select from 'react-select'

import { ClientOnly } from "./ClientOnly"

const statusOptions = [
  { value: 'active', label: 'Membres Actifs'},
  { value: 'unactive', label: 'Alumnis'},
  { value: 'both', label: 'Membres actifs et Alumnis'}
]


export default ({ onChange }) => {
    return <ClientOnly><Select
      options={statusOptions}
      onChange={onChange}
      placeholder={'Sélectionne les membres actifs/inactifs/les deux'} /></ClientOnly>
  }
  