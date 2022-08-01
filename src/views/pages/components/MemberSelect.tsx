import React from "react"
import Select from 'react-select'

import { ClientOnly } from "./ClientOnly"

export default({ members, defaultValue, onChange, name } : { members: any, defaultValue: any, onChange: any, name?: string}) => {
    return <ClientOnly><Select
        options={members}
        defaultValue={defaultValue}
        onChange={onChange}
        name={name}
        placeholder={'Sélectionne un référent'}  /></ClientOnly>
  }