import React from "react"
import Select from 'react-select'

import { ClientOnly } from "./ClientOnly"

const options = [
  { value: 'acceleration', label: 'acceleration'},
  { value: 'success', label: 'success'},
  { value: 'transfer', label: 'transfer'},
  { value: 'investigation', label: 'investigation'},
  { value: 'construction', label: 'construction'},
  { value: 'alumni', label: 'alumni' }
]

export default ({ onChange, isMulti, placeholder, defaultValue }: {
  startups?: any,
  onChange?: any,
  isMulti?: any,
  placeholder?: any,
  defaultValue?: any
}) => {
    return <ClientOnly><Select
      options={options}
      isMulti={isMulti}
      defaultValue={defaultValue}
      onChange={onChange}
      placeholder={placeholder || 'Sélectionne une ou plusieurs phases'} /></ClientOnly>
}