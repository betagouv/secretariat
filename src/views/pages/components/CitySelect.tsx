import React from "react"
import AsyncSelect from 'react-select/async';
import { searchCommunes } from "../../../lib/searchCommune";

import { ClientOnly } from "./ClientOnly"

interface OpenStreetMapCity {
	place_id: number,
	licence: string,
	osm_id: number,
	lat: string,
	lon: string,
	display_name: string,
	type: string,
	importance: number,
}

async function getCountry(value: string) {
	const search = value

	const response = await fetch(
		`https://nominatim.openstreetmap.org/search?country=${search}&format=json`
	)
	if (!response.ok) {
		return null
	}
	const countries : OpenStreetMapCity[] = (await response.json())

	const res = countries[0]
	const data = res ? {
		country_label: res.display_name,
		country_place_id: res.place_id,
		country_lat: res.lat,
		country_lon: res.lon,
	} : {}
	console.log(data)
	return data
}

async function searchForeignCity(
	value : string
){
    const frenchCities = searchCommunes(value)
    const search = value

	const response = await fetch(
		`https://nominatim.openstreetmap.org/search?city=${search}&format=json&featuretype=city`
	)
	if (!response.ok) {
		return null
	}
	const cities : OpenStreetMapCity[] = (await response.json())

	const res = cities
		.sort((a, b) => b.importance - a.importance)
	const data = res.map(d => {
        const splitLabel = d.display_name.split(',')
        return {
		place_id: d.place_id,
		lat: d.lat,
		lon: d.lon,
		label: `${d.display_name}`,
        country: splitLabel[splitLabel.length - 1],
        isOSM: true
    }})
    .filter(d => d.country !== 'France')
	return [...frenchCities, ...data].slice(0, 15)
}


export default ({ defaultValue, onChange, placeholder }) => {

    const loadOptions = (inputValue: string) => searchForeignCity(inputValue)

    return <ClientOnly>
        <AsyncSelect
            cacheOptions
            loadOptions={loadOptions}
            defaultOptions
            placeholder={placeholder}
            defaultInputValue={defaultValue}
            defaultValue={defaultValue}
            onChange={async (newValue) => {
                let value = newValue
                if (newValue.isOSM) {
                    const country = await getCountry(newValue.country)
                    value = {
                        ...newValue,
                        ...country
                    }
                }
				onChange(value)
			}}
        />
    </ClientOnly>
}
