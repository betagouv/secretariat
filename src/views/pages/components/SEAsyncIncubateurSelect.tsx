import React from "react"
import axios from "axios"
import Select from 'react-select'
import { ClientOnly } from "./ClientOnly"

export default ({ onChange, value }) => {
    const [options, setOptions] = React.useState([]);

    React.useEffect(() => {
        // React advises to declare the async function directly inside useEffect
        const getOptions = async () => {
            const incubators = await axios
              .get<any[]>('/api/incubators')
              .then((response) => response.data)
              .catch((err) => {
                throw new Error(`Error to get incubators infos : ${err}`);
              })
            const optionValues = Object.keys(incubators).map(incubator => {
                return {
                  value: incubator,
                  label: incubators[incubator].title 
                }
            })
            setOptions(optionValues);

        }
    
        // You need to restrict it at some point
        // This is just dummy code and should be replaced by actual
        if (!options.length) {
            getOptions();
        }
      }, []);
    if (!options.length) {
      return null
    }
    return <ClientOnly>
        <Select
            defaultValue={options.filter(opt => opt.value === value)}
            onChange={onChange}
            options={options}
            placeholder={'Sélectionne un ou plusieurs incubateurs'} 
            hideSelectedOptions={false}
            blurInputOnSelect={false}
          />
      </ClientOnly>
}
