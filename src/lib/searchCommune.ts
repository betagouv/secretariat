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