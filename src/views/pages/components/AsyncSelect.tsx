import React from "react"
import Select from 'react-select'

import { ClientOnly } from "./ClientOnly"

export default ({ loadOptions, onInputChange }) => {
    return <ClientOnly>
        <AsyncSelect
            cacheOptions
            loadOptions={loadOptions}
            defaultOptions
            onInputChange={onInputChange}
        />
    </ClientOnly>
}
