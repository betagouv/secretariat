import React, { useState } from "react"
import AsyncSelect from 'react-select/async';

import { ClientOnly } from "./ClientOnly"

export default ({ loadOptions, defaultValue, onChange, placeholder }) => {
    const [input, setInput] = useState(defaultValue || '');

    return <ClientOnly>
        <AsyncSelect
            cacheOptions
            loadOptions={loadOptions}
            defaultOptions
            placeholder={placeholder}
            defaultInputValue={input}
            defaultValue={input}
            hideSelectedOptions={false}
            onChange={onChange}
            blurInputOnSelect={false}
        />
    </ClientOnly>
}
