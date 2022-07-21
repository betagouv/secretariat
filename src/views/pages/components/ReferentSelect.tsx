import React from "react"
import Select from 'react-select'

import { ClientOnly } from "./ClientOnly"

export default({ referents, defaultValue, onChange }) => {
    return <ClientOnly><Select
        options={referents}
        defaultValue={defaultValue}
        onChange={onChange}
        placeholder={'Sélectionne un référent'}  /></ClientOnly>
  }