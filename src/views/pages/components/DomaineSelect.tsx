import React from "react"
import Select from 'react-select'

import { ClientOnly } from "./ClientOnly"

export default({ domaines, onChange }) => {
    return <ClientOnly><Select
      options={domaines}
      onChange={onChange}
      isMulti
      placeholder={'Sélectionne un ou plusieurs domaines'}  /></ClientOnly>
  }