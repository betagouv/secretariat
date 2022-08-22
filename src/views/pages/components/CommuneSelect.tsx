import React from "react"
import AsyncSelect from 'react-select/async';
import { searchCommunes } from "@/lib/searchCommune";

import { ClientOnly } from "./ClientOnly"

export default ({ defaultValue, onChange, placeholder }) => {
    const loadOptions = (inputValue: string) => searchCommunes(inputValue)

    return <ClientOnly>
        <AsyncSelect
            cacheOptions
            loadOptions={loadOptions}
            defaultOptions
            placeholder={placeholder}
            defaultInputValue={defaultValue}
            defaultValue={defaultValue}
            hideSelectedOptions={false}
            onChange={onChange}
            blurInputOnSelect={false}
        />
    </ClientOnly>
}
