import React from "react"
import Select from 'react-select'

import { ClientOnly } from "./ClientOnly"

export default({
    members,
    defaultValue,
    onChange,
    name,
    placeholder } : {
        members: any,
        defaultValue: any,
        onChange: any,
        name?: string,
        placeholder?: string
    }) => {
    return <ClientOnly><Select
        options={members}
        defaultValue={defaultValue}
        onChange={onChange}
        name={name}
        placeholder={placeholder || 'Sélectionne un référent'}  /></ClientOnly>
  }