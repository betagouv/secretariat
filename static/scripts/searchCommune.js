async function searchCommunes(
	event
){
    var input = event.target.value;

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
	renderNames(res)
}

function selectCode(code, nom, codePostal) {
	document.getElementById("input-insee-code").value = `${code}`;
	document.getElementById("input-commune").value = `${nom} (${codePostal})`;
	document.getElementById("list-container-city").innerHTML = '';
}

function renderNames(arrayOfNames) {
	let liElemet = "" ;
	for (let i= 0; i <arrayOfNames.length; i++) {
    const cleanedName = arrayOfNames[i].nom.replace(/'/g, " ");
		liElemet += `<li
		id=${arrayOfNames[i].code} onclick="selectCode(
			'${arrayOfNames[i].code}',
			'${cleanedName}',
			'${arrayOfNames[i].codePostal}')">${arrayOfNames[i].nom} (${arrayOfNames[i].codePostal})</li>`
	}
	document.getElementById("list-container-city").innerHTML= liElemet;
 }
 
