import React from "react"
import Select from 'react-select'

import { ClientOnly } from "./ClientOnly"

export default ({ startups, onChange, isMulti, placeholder, defaultValue }: {
  startups?: any,
  onChange?: any,
  isMulti?: any,
  placeholder?: any,
  defaultValue?: any
}) => {
    return <ClientOnly><Select
      options={startups}
      isMulti={isMulti}
      defaultValue={defaultValue}
      onChange={onChange}
      placeholder={placeholder || 'Sélectionne une ou plusieurs startups'} /></ClientOnly>
}