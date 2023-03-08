import React from "react"

import Datepicker from "react-datepicker";
import { ClientOnly } from "./ClientOnly"

export default ({ name, onChange, title, required, dateFormat, selected, min, max } : {
    name, onChange, title, required, dateFormat, selected: Date, min, max?
}) => {

    return <ClientOnly>
        <Datepicker
            type="date"
            name={name}
            min={min}
            max={max}
            title={title}
            required={required}
            dateFormat={dateFormat}
            selected={selected}
            onChange={onChange} />
    </ClientOnly>
}
