import React from "react"
import Select from 'react-select'

import { ClientOnly } from "./ClientOnly"

export default({ defaultValue, onChange, email, value } : { defaultValue?: string, onChange: any, email: string, value }) => {
    const options = [{
        value: 'secondary',
        label: `mon adresse pro ${email ? `: ${email}` : ''}`
    },
    {
        value: 'primary',
        label: 'mon adresse @beta.gouv.fr'
    }]

    return <ClientOnly><Select
        options={options}
        defaultValue={{
            value: 'secondary',
            label: `mon adresse pro/perso ${email ? `: ${email}` : ''}`
        }}
        value={options.find(opt => opt.value === value)}
        onChange={onChange}
        name={'communication_email'}
     /></ClientOnly>
  }