import React from "react"
import Select from 'react-select'

import { ClientOnly } from "../ClientOnly"
import { SponsorType } from "@/models/sponsor"

const options = Object.values(SponsorType).map(type => ({
    value: type,
    label: type
}))

export default ({ onChange, isMulti, placeholder, defaultValue }: {
  value?: any,
  onChange?: any,
  isMulti?: boolean,
  placeholder?: any,
  defaultValue?: string
}) => {
    return <ClientOnly><Select
      options={options}
      isMulti={isMulti}
      defaultValue={isMulti ? options.filter(opt => opt.value === defaultValue) : options.filter(opt => opt.value === defaultValue)[0]}
      onChange={e => onChange(e['value'])}
      placeholder={placeholder || 'Sélectionne un type'} /></ClientOnly>
}