
var map = new maplibregl.Map({
    container: 'map', // container id
    style: 'https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json', // style URL
    center: [2.087, 46],
    zoom: 5,
    zoomMobile: 4
});

function capitalizeWord(str) {
    return str.split('.').map(element => {
        return element.charAt(0).toUpperCase() + element.substring(1).toLowerCase();
    }).join(' ');
    }

var DEPARTEMENTS_GEOJSON = 'https://raw.githubusercontent.com/etalab/barometre-resultats/master/frontend/static/datasets/geodata/departements-1000m.geojson'
//"https://gist.githubusercontent.com/maximepvrt/26dd5ed5f26a63bc3040cb3f67594325/raw/c6af19f94f2743b9a445a5a2e6d657a4c0bfc3d6/departements-avec-outre-mer.geojson"

var groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

function area(poly){
    var s = 0.0;
    var ring = poly.coordinates[0];
    for(i= 0; i < (ring.length-1); i++){
        s += (ring[i][0] * ring[i+1][1] - ring[i+1][0] * ring[i][1]);
    }
    return 0.5 *s;
}



function centroid(poly){
    var c = [0,0];
    var ring = poly.coordinates[0];
    for(i= 0; i < (ring.length-1); i++){
        c[0] += (ring[i][0] + ring[i+1][0]) * (ring[i][0]*ring[i+1][1] - ring[i+1][0]*ring[i][1]);
        c[1] += (ring[i][1] + ring[i+1][1]) * (ring[i][0]*ring[i+1][1] - ring[i+1][0]*ring[i][1]);
    }
    var a = area(poly);
    c[0] /= a *6;
    c[1] /= a*6;
    return c;
}

async function fetchData() {
    const res = await fetch('/static/communes.geojson')
    const communes = await res.json().then(data => data.features)
    const res2 = await fetch('/api/get-users-location')
    const departements = await fetch(DEPARTEMENTS_GEOJSON)
    .then(res => res.json())
    .then(data => data.features)
    const users = await res2.json()
        .then(users => users
        .filter(user => user.workplace_insee_code)
        .map(user => {
            let userCommune
            const dep = departements.find(c => c.properties.code === user.workplace_insee_code.slice(0, 2))
            if (["13055", "69123", "75056"].includes(user.workplace_insee_code)) {
                userCommune = dep
            } else {
                userCommune = communes.find(c => c.properties.code === user.workplace_insee_code)
            }
            return {
                ...user,
                communeCode: userCommune ? userCommune.properties.code : undefined,
                communeDep: userCommune ? userCommune.properties.code.slice(0,2) : undefined,
                commune: userCommune,
                dep
            }
        })
        .filter(user => user.commune))
    
    const usersByCommune = groupBy(users, 'communeCode')
    const dataCommune = Object.keys(usersByCommune).map(commune => {
        const usersOfCommune = usersByCommune[commune]
        return {
            users: usersOfCommune,
            commune: usersOfCommune[0].commune
        }
    })
    const usersByDep = groupBy(users, 'communeDep')
    const dataDep = Object.keys(usersByDep).map(dep => {
        const usersOfDep = usersByDep[dep]
        return {
            users: usersOfDep,
            dep: usersOfDep[0].dep
        }
    })
    
    const geojson = {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": dataCommune.map(row => {
                // console.log(row.commune.geometry.coordinates[0])

                return {
            "type": "Feature",
            "properties": {
                "usernames": row.users.map(user => capitalizeWord(user.username)).join(','),
                "code": row.commune.properties.code,
                "nom": row.commune.properties.nom,
                "nbUsers": row.users.length,
                "description": `${row.commune.properties.nom.slice(0, 10)}${row.commune.properties.nom.length > 10 ? '...' : ''}\n${row.users.length}`,
                fillColor: ["#003f5c", "#58508d", "#bc5090", "#ff6361", "#ffa600"][[2, 10, 20, 50, 100000].findIndex(r => row.users.length < r)]
            },
            "geometry": {
                "type": "Point",
                "coordinates": centroid(row.commune.geometry)
            }}
            })
        }
    }

    map.addSource("communes", geojson)

    map.addLayer({
        'id': 'communes',
        'type': 'circle',
        'source': 'communes',
        'minzoom': 7,
        paint: {
            'circle-radius': 10, //["get", "circleRadius"],
            'circle-stroke-color': 'black',
            'circle-stroke-width': 1,
            'circle-opacity': 0.8,
            'circle-color': ["get", "fillColor"],
            'circle-opacity': 0.5
        }
    });

    const geojsonDep = {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": dataDep.map(row => {
                // console.log(row.commune.geometry.coordinates[0])

                return {
            "type": "Feature",
            "properties": {
                "usernames": row.users.map(user => capitalizeWord(user.username)).join(','),
                "code": row.dep.properties.code,
                "nom": row.dep.properties.nom,
                "nbUsers": row.users.length,
                "description": `${row.dep.properties.nom}\n${row.users.length}`,
                fillColor: ["#003f5c", "#58508d", "#bc5090", "#ff6361", "#ffa600"][[2, 10, 20, 50, 100000].findIndex(r => row.users.length < r)]
                // "objetsCount": row.objets_count,
                // "circleRadius": [2, 5, 10, 20][[5, 20, 50, 100000].findIndex(i => row.objets_count < i)]
            },
            //"geometry": row.commune.geometry
            "geometry": {
                "type": "Point",
                "coordinates": centroid(row.dep.geometry)
            }}
            })
        }
    }
    map.addSource("departements_user", geojsonDep)

    map.addLayer({
        'id': 'departements_user',
        'type': 'circle',
        'source': 'departements_user',
        'minzoom': 0,
        'maxzoom': 7,
        paint: {
            'circle-radius': 20, //["get", "circleRadius"],
            'circle-stroke-color': 'black',
            'circle-stroke-width': 1,
            'circle-opacity': 0.8,
            'circle-color': ["get", "fillColor"],
            'circle-opacity': 0.5,
        }
    });
                
    map.addLayer({
        'id': 'departements-text',
        'type': 'symbol',
        'source': 'departements_user',
        'minzoom': 0,
        'maxzoom': 7,
        layout: {
            'text-field': ["get", "description"],
        }
    });

    map.addLayer({
        'id': 'communes-text',
        'type': 'symbol',
        'source': 'communes',
        'minzoom': 7,
        layout: {
            'text-field': ["get", "description"],
        }
    });

    let popup = new maplibregl.Popup({
    })
    map.on('mouseenter', 'communes', e => {
        let features = map.queryRenderedFeatures(e.point)
        map.getCanvas().style.cursor = 'pointer'
        let description = `
            <div class="popup">
            <center><h1>${features[0].properties.nom}</h1></center>
            <p>${features[0].properties.usernames.split(',').join('<br/>')}</p>
            </div>`
        popup.setLngLat(e.lngLat).setHTML(description).addTo(map)
        })
        map.on('mouseleave', 'communes', () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
    })

    map.on('mouseenter', 'departements_user', e => {
        let features = map.queryRenderedFeatures(e.point)
        map.getCanvas().style.cursor = 'pointer'
        let description = `
            <div class="popup">
            <center><h1>${features[0].properties.nom}</h1></center>
            <p>${features[0].properties.usernames.split(',').join('<br/>')}</p>
            </div>`
        popup.setLngLat(e.lngLat).setHTML(description).addTo(map)
        })
        map.on('mouseleave', 'departements_user', () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
    })
    
}
map.on('load', fetchData)
