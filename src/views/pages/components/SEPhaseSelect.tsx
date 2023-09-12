import React from "react"
import Select from 'react-select'

import { ClientOnly } from "./ClientOnly"

const options = [
  { value: 'acceleration', label: 'En Accélération'},
  { value: 'success', label: 'Pérennisé (success)'},
  { value: 'transfer', label: 'Transféré'},
  { value: 'investigation', label: 'En Investigation'},
  { value: 'construction', label: 'En Construction'},
  { value: 'alumni', label: 'Partenariat terminé (alumni)' }
]

export default ({ onChange, isMulti, placeholder, defaultValue }: {
  startups?: any,
  onChange?: any,
  isMulti?: any,
  placeholder?: any,
  defaultValue?: string
}) => {
    return <ClientOnly><Select
      options={options}
      isMulti={isMulti}
      defaultValue={isMulti ? options.filter(opt => opt.value === defaultValue) : options.filter(opt => opt.value === defaultValue)[0]}
      onChange={onChange}
      placeholder={placeholder || 'Sélectionne une ou plusieurs phases'} /></ClientOnly>
}