import axios from "axios";

export type Commune = {
	code: string
	nom: string
}

export type ApiCommuneJson = {
	_score: number
	code: string
	codesPostaux: Array<string>
	departement: {
		code: string
		nom: string
	}
	nom: string
	region: {
		code: string
		nom: string
	}
}

export async function fetchCommuneDetails(
	codeCommune: string,
): Promise<Commune | null> {
	const response = await axios(
		`https://geo.api.gouv.fr/communes/${codeCommune}?fields=nom,code,departement,region,codesPostaux`
	)
	if (response.status === 401) {
		return null
	}
	const apiCommune = response.data as ApiCommuneJson
	const commune: Commune = { ...apiCommune }
	return commune
}

export async function searchCommunes(
	value
){
    const input = value

	const number = /[\d]{5}/.exec(input)?.join('') ?? ''
	const arrondissement = /[\d]{1,2}/.exec(input)?.join('') ?? ''
	const rawtext = /[^\d]+/.exec(input)?.join('') ?? ''
	const text = number && !arrondissement ? rawtext : input
	const response = await fetch(
		`https://geo.api.gouv.fr/communes?type=arrondissement-municipal,commune-actuelle&fields=nom,code,departement,region,codesPostaux${
			text ? `&nom=${text}` : ''
		}${number ? `&codePostal=${number}` : ''}&boost=population`
	)
	if (!response.ok) {
		return null
	}
	const json = (await response.json())

	const res = json
		.flatMap(({ codesPostaux, ...commune }) =>
			codesPostaux
				.sort()
				.map((codePostal) => ({ ...commune, codePostal }))
				.filter(({ codePostal }) => codePostal.startsWith(number))
        .filter(({ code }) => !["13055", "69123", "75056"].includes(code))
		)
		.slice(0, 10)
	const data = res.map(d => ({
		value: d.code,
		label: `${d.nom} (${d.codePostal})`
	}))
	return data
}
