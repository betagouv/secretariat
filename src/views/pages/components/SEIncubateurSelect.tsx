import React from "react"
import Select from 'react-select'

import { ClientOnly } from "./ClientOnly"

export default ({ incubators, onChange }) => {
    return <ClientOnly><Select options={incubators}
      isMulti
      onChange={onChange}
      placeholder={'Sélectionne un ou plusieurs incubateurs'}  /></ClientOnly>
  }