import React from "react"
import Select from 'react-select'

import { ClientOnly } from "./ClientOnly"
const options = [
    {value:"non conforme", label:"non conforme"},
    {value: "partiellement conforme", label:"partiellement conforme"},
    {value: "totalement conforme", label: "totalement conforme"}
]
export default({ value, onChange }) => {
    return <ClientOnly><Select
        options={options}
        onChange={onChange}
        defaultValue={options.find(opt => opt.value === value)}
        isMulti={false}
        placeholder={'Sélectionne un ou plusieurs domaines'}  /></ClientOnly>
  }