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

	const number = /[\d]+/.exec(input)?.join('') ?? ''
	const text = /[^\d]+/.exec(input)?.join(' ') ?? ''
	const response = await fetch(
		`https://geo.api.gouv.fr/communes?fields=nom,code,departement,region,codesPostaux${
			text ? `&nom=${text}` : ''
		}${/[\d]{5}/.exec(number) ? `&codePostal=${number}` : ''}&boost=population`
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
		)
		.slice(0, 10)
	const data = res.map(d => ({
		value: d.code,
		label: `${d.nom} (${d.codePostal})`
	}))
	return data
}
