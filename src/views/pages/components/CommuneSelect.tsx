import React from "react"
import AsyncSelect from 'react-select/async';

import { ClientOnly } from "./ClientOnly"

export default ({ loadOptions, defaultValue, onChange, placeholder}) => {
    return <ClientOnly>
        <AsyncSelect
            cacheOptions
            loadOptions={loadOptions}
            defaultOptions
            placeholder={placeholder}
            onBlur={() => {}}
            defaultInputValue={defaultValue}
            defaultValue={defaultValue}
            onChange={onChange}
        />
    </ClientOnly>
}
