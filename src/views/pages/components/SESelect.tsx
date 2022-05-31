import React from "react"
import Select from 'react-select'

import { ClientOnly } from "./ClientOnly"

export default ({ startups, onChange }) => {
    return <ClientOnly><Select
      options={startups}
      isMulti
      onChange={onChange}
      placeholder={'Sélectionne une ou plusieurs startups'} /></ClientOnly>
}