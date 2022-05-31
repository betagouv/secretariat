import React from "react"
import AsyncSelect from 'react-select/async';

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
