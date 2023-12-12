
var map = new maplibregl.Map({
    container: 'mapcontainer', // container id
    style: 'https://api.' + location.hostname + '/static/json/osm.style.json',
    // style: 'https://api.maptiler.com/maps/streets/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL', //style, //https://etalab-tiles.fr/styles/osm-bright/style.json?vector', // style URL
    // center: [2.087, 46],
    zoom: 0,
    zoomMobile: 0
});

function capitalizeWord(str) {
    return str.split('.').map(element => {
        return element.charAt(0).toUpperCase() + element.substring(1).toLowerCase();
    }).join(' ');
    }

// var DEPARTEMENTS_GEOJSON = "https://gist.githubusercontent.com/maximepvrt/26dd5ed5f26a63bc3040cb3f67594325/raw/c6af19f94f2743b9a445a5a2e6d657a4c0bfc3d6/departements-avec-outre-mer.geojson"
// var DEPARTEMENTS_GEOJSON = 'https://raw.githubusercontent.com/etalab/barometre-resultats/master/frontend/static/datasets/geodata/departements-1000m.geojson' 
var DEPARTEMENTS_GEOJSON = 'https://api.' + location.hostname + '/static/json/departements-1000m.geojson'
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



function centroid(poly, test){
    if (poly.type === 'MultiPolygon') {
        return centroid({
            type: 'Polygon',
            coordinates: poly.coordinates[0]
        })
    }
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

const cityWithArrondissement = [
    {"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[5.455065095978754,43.335699981985464],[5.450252909362564,43.33911308813974],[5.452800537571135,43.34716286680548],[5.457612724187325,43.35276551275684],[5.464689469211133,43.3601069109],[5.462047484402244,43.364550388723494],[5.460254708996213,43.36899386654698],[5.447516567953358,43.386960972528925],[5.441760815333994,43.38985889284859],[5.435344566512408,43.38786254773949],[5.430532379896218,43.3851578221078],[5.424682270676535,43.383419069915995],[5.41383126164003,43.37781642396464],[5.409019075023839,43.37601327354351],[5.399960841393365,43.374081326663735],[5.392412313367969,43.37317975145317],[5.379674172325115,43.36970224706957],[5.375711195111783,43.372149379783956],[5.377692683718448,43.37665725583677],[5.376371691314003,43.38039235313768],[5.377598327118132,43.38419184866791],[5.37467327250829,43.38869972472072],[5.368445736887339,43.389601299931286],[5.364671472874641,43.387733751280834],[5.354575316640674,43.38464263627319],[5.350423626226706,43.38251749470543],[5.353726107237818,43.37543368947958],[5.346649362214008,43.375304893020925],[5.342120245398772,43.37601327354351],[5.336458849379725,43.37601327354351],[5.333062011768296,43.372406972701256],[5.3308918099609945,43.371505397490694],[5.32145614992925,43.36995983998687],[5.31890852172068,43.37144099926137],[5.319191591521633,43.37343734437047],[5.315322970908617,43.377236839900704],[5.311171280494649,43.37955517615644],[5.306264737278142,43.38116513188959],[5.304094535470841,43.38477143273184],[5.297961356450206,43.38876412295005],[5.288808766219414,43.38496462741982],[5.285789355009256,43.384385043355884],[5.281165881593702,43.380263556679026],[5.278806966585765,43.380456751367],[5.282015090996558,43.37659285760744],[5.282392517397828,43.37395253020508],[5.279939245789575,43.370732618738785],[5.278146470383542,43.36628914091529],[5.278146470383542,43.36352001705428],[5.281543307994972,43.35682260120438],[5.282203804197192,43.3536670879674],[5.294847588639731,43.35875454808416],[5.306076024077506,43.36113728256922],[5.3127753427000455,43.360686494963936],[5.324003778137821,43.35727338880966],[5.32664576294671,43.354568663177965],[5.322399715932424,43.354311070260664],[5.317304459515284,43.356436211828424],[5.313058412500998,43.35463306140729],[5.320512583926075,43.35006078712515],[5.323154568734965,43.35398907911404],[5.332024089164805,43.350189583583806],[5.3410823227952795,43.34510212346705],[5.3392895473892485,43.341173831478166],[5.329476460956234,43.345681707530986],[5.328438538352741,43.34465133586177],[5.337779841784168,43.33956387574502],[5.345328369809564,43.33685915011333],[5.347215501815913,43.334991601462875],[5.349857486624802,43.32951775197017],[5.3536317506375,43.32500987591735],[5.356745518447975,43.31908523881936],[5.364671472874641,43.312065831822835],[5.362689984267974,43.30530401774361],[5.3593875032568645,43.297769424912474],[5.362973054068926,43.294678309904825],[5.372691783901623,43.296095070949995],[5.373729706505116,43.2940987258409],[5.364954542675593,43.29235997364909],[5.358538293854006,43.29500030105146],[5.3551414562425785,43.295064699280786],[5.353443037436864,43.292746363025046],[5.353914820438452,43.288946867494815],[5.345988866011786,43.28141227466368],[5.3571229448492454,43.27677560215221],[5.36212384466607,43.273684487144564],[5.367973953885751,43.267953044734554],[5.37429584610702,43.25971007138083],[5.3752394121101945,43.25674775283184],[5.373069210302893,43.25146709802711],[5.373729706505116,43.24695922197429],[5.372220000900037,43.24496287686519],[5.367785240685117,43.243288522902716],[5.361652061664482,43.23845865570327],[5.359576216457499,43.235496337154274],[5.355990665645435,43.23298480621056],[5.349857486624802,43.23195443454134],[5.348725207420993,43.23053767349617],[5.342214601999088,43.2154684878339],[5.3451396566089295,43.21218417813828],[5.356839875048293,43.208513479066696],[5.363916620072101,43.207289912709506],[5.370144155693052,43.20767630208546],[5.376277334713687,43.209930240111866],[5.38241051373432,43.20986584188254],[5.387694483352097,43.21038102771715],[5.389015475756541,43.21115380646906],[5.395997864180033,43.21263496574356],[5.400998763996857,43.213021355119515],[5.407792439219713,43.211604594074345],[5.414397401241934,43.20799829323209],[5.418171665254632,43.2070323197922],[5.420908006663839,43.21076741709311],[5.4277960384870125,43.20999463834119],[5.437042985318121,43.20651713395759],[5.4478939943546285,43.20426319593118],[5.447233498152406,43.20838468260804],[5.4494980565600235,43.20986584188254],[5.458745003391134,43.211411399386364],[5.467237097419704,43.20883547021333],[5.477144540453035,43.20407000124321],[5.485636634481605,43.20439199238984],[5.491675456901922,43.20342601894995],[5.497619922721921,43.19853175352117],[5.500639333932079,43.19724378893466],[5.509886280763189,43.19769457653994],[5.511490342968586,43.204456390619164],[5.517529165388903,43.21360093918345],[5.516774312586363,43.217142841796374],[5.50658379975208,43.22673817796594],[5.506961226153348,43.23253401860528],[5.509603210962237,43.23504554954899],[5.523096204807632,43.23485235486101],[5.525738189616519,43.23820106278596],[5.519227584194616,43.24161416894024],[5.519605010595886,43.24431889457193],[5.514792823979696,43.26009646075679],[5.513188761774299,43.26331637222309],[5.514415397578428,43.267695451817254],[5.509320141161285,43.270979761512876],[5.505168450747317,43.27729078798682],[5.504696667745731,43.28134787643435],[5.505357163947951,43.28315102685548],[5.5119621259701725,43.28688612415639],[5.51837837479176,43.2879164958256],[5.521303429401601,43.29171599135584],[5.525360763215251,43.29429192052887],[5.5280971046244565,43.294871504592805],[5.53168265543652,43.30002336293888],[5.529701166829853,43.30195530981866],[5.527059182020964,43.308910318585866],[5.523662344409536,43.313997778702614],[5.52281313500668,43.32075959278184],[5.517623521989219,43.32101718569914],[5.512528265572079,43.32056639809386],[5.500261907530811,43.31535014151846],[5.490731890898748,43.315156946830484],[5.4797865252619244,43.31412657516127],[5.474879982045418,43.31535014151846],[5.472709780238115,43.3167025043343],[5.459499856193674,43.33054812363939],[5.455065095978754,43.335699981985464]]]},"properties":{"code":"13055","dep":"13","reg":"93","xcl2154":892395,"ycl2154":6247047,"nom":"Marseille"}},
    {"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[2.3656412883849507,48.90176773908656],[2.351959581338921,48.90151014616926],[2.3204444768328942,48.90080176564667],[2.319878337230989,48.90047977450004],[2.3124241658059113,48.897775048868354],[2.303743358576706,48.8941687480261],[2.2986481021595644,48.89172161531171],[2.2911939307344857,48.88933888082665],[2.2844946121119474,48.88566818175507],[2.2809090612998846,48.88283465966473],[2.27996549529671,48.87858437652922],[2.277512223688456,48.87800479246528],[2.2584521904243324,48.880387526950344],[2.2547722830119517,48.8740765004764],[2.245714049381477,48.87645923496146],[2.242977707972271,48.8738189075591],[2.239203443959573,48.871564969532685],[2.231749272534495,48.8691178368183],[2.2283524349230674,48.86538273951739],[2.2257104501141782,48.85939370419008],[2.2242007445090994,48.85353346532142],[2.239203443959573,48.850055960937816],[2.2424115683703665,48.847673226452756],[2.2505262359976665,48.845548084884996],[2.251752871801794,48.8388506690351],[2.255149709413222,48.834793580587565],[2.2627925940389346,48.83395640360633],[2.267510424054807,48.834600385899584],[2.26996369566306,48.83305482839577],[2.267321710854172,48.83157366912127],[2.267604780655124,48.82796736827901],[2.2727943936725836,48.82796736827901],[2.2790219292935356,48.83247524433183],[2.289401155328455,48.828353757654966],[2.292231853337978,48.827130191297776],[2.3012900869684527,48.82513384618867],[2.314122584611625,48.82230032409833],[2.3324277650732093,48.8182432356508],[2.331861625471305,48.8170196692936],[2.3429957043087635,48.81611809408304],[2.356205628353206,48.815989297624384],[2.364225939380189,48.816440085229665],[2.380738344435742,48.821720740034394],[2.390079647867169,48.825713430252605],[2.394325694881454,48.82758097890306],[2.402251649308119,48.82957732401216],[2.410083247134467,48.82513384618867],[2.4199906901677988,48.824103474519454],[2.424614163583354,48.82423227097811],[2.43065298600367,48.82320189930889],[2.4354651726198604,48.81965999669597],[2.442353204443034,48.81792124450416],[2.459148679299539,48.817406058669555],[2.461224524506523,48.818372032109444],[2.462734230111602,48.81908041263203],[2.4657536413217604,48.826228616087214],[2.465281858320173,48.82770977536171],[2.468489982730966,48.83350561600105],[2.4695279053344583,48.836918722155325],[2.4673577035271563,48.839108261952404],[2.465281858320173,48.84116900529084],[2.4617906641084275,48.842714562794654],[2.4478258872614456,48.84490410259174],[2.446599251457319,48.8458056778023],[2.440749142237637,48.845998872490284],[2.4379184442281137,48.84464650967443],[2.4371635914255743,48.84091141237353],[2.4275392181931945,48.84161979289612],[2.424897233384306,48.84181298758409],[2.4221608919751008,48.83582395225678],[2.4173487053589104,48.83421399652363],[2.412253448941769,48.834535987670264],[2.4156502865531966,48.845032899050395],[2.416310782755419,48.84921878395658],[2.4152728601519264,48.85520781928389],[2.4139518677474827,48.86473875722413],[2.4133857281455775,48.873174925265836],[2.410838099937007,48.878455580070565],[2.4093283943319275,48.88025873049169],[2.4014967965055796,48.88264146497675],[2.3992322380979614,48.885410588837765],[2.3989491682970083,48.88953207551463],[2.3976281758925646,48.89461953563138],[2.3956466872858977,48.89816143824431],[2.3893247950646295,48.90118815502262],[2.384512608448439,48.90215412846251],[2.3656412883849507,48.90176773908656]]]},"properties":{"code":"75056","dep":"75","reg":"11","xcl2154":652492,"ycl2154":6862009,"nom":"Paris"}},
    {"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[4.898361154105825,45.75288751973525],[4.893548967489635,45.75391789140447],[4.8844907338591605,45.7542398825511],[4.876092996430908,45.75533465244963],[4.873167941821067,45.760100121419754],[4.865430700595035,45.76802110362685],[4.858448312171546,45.772400183221016],[4.859863661176306,45.78688978481936],[4.853636125555355,45.7865033954434],[4.847597303135038,45.783605475123736],[4.839954418509326,45.780836351262714],[4.831179254679804,45.78205991761991],[4.823347656853456,45.78521543085688],[4.819007253238852,45.78978770513903],[4.822309734249964,45.792299236082734],[4.829009052872503,45.79616312984229],[4.832972030085835,45.79674271390623],[4.837123720499803,45.79828827141005],[4.841464124114405,45.80350452798545],[4.838822139305516,45.80389091736141],[4.837029363899485,45.80839879341423],[4.8360857978963105,45.806788837681076],[4.832594603684565,45.806144855387814],[4.8237250832547245,45.803246935068145],[4.819573392840758,45.79938304130859],[4.818441113636948,45.79931864307927],[4.815327345826472,45.79577674046634],[4.811081298812188,45.79300761660532],[4.807118321598854,45.79191284670678],[4.802400491582982,45.791977244936106],[4.795323746559174,45.790367289202955],[4.788341358135683,45.7897233069097],[4.784944520524255,45.78804895294722],[4.785699373326795,45.785795014920815],[4.791549482546476,45.78309028928912],[4.795135033358538,45.775748891145966],[4.792493048549651,45.77343055489023],[4.790888986344254,45.76879388237876],[4.7862655129287,45.76216086475819],[4.785227590325207,45.758876555062564],[4.777962132100764,45.7542398825511],[4.773244302084891,45.7530163161939],[4.771923309680447,45.750762378167494],[4.777584705699494,45.74715607732524],[4.783434814919176,45.7443225552349],[4.7918325523474286,45.74792885607715],[4.802400491582982,45.751663953378056],[4.813440213820123,45.748057652535806],[4.817120121232503,45.74818644899445],[4.814195066622664,45.744708944610856],[4.813062787418853,45.73987907741141],[4.81428942322298,45.7329240686442],[4.8187241834379,45.72654864394094],[4.820800028644885,45.71914284756845],[4.823347656853456,45.71457057328631],[4.825140432259487,45.713025015782485],[4.837595503501389,45.70742236983112],[4.840520558111231,45.707744360977756],[4.838161643103294,45.71354020161709],[4.837595503501389,45.71849886527519],[4.849673148342023,45.71882085642182],[4.854485334958212,45.71894965288047],[4.853730482155673,45.72976855540723],[4.859863661176306,45.730670130617796],[4.862411289384878,45.72693503331689],[4.880905183047097,45.72171877674149],[4.887604501669636,45.72030201569632],[4.887038362067732,45.726097856335656],[4.886849648867096,45.72963975894858],[4.8963796654991585,45.746705289719955],[4.898361154105825,45.75288751973525]]]},"properties":{"code":"69123","dep":"69","reg":"84","xcl2154":842605,"ycl2154":6520326,"nom":"Lyon"}},
]

const createForeignCityClusters = (users) => {
    const usersByCity = groupBy(users, 'place_id')
    const dataCity = Object.keys(usersByCity).map(city => {
        const usersOfCommune = usersByCity[city]
        return {
            users: usersOfCommune,
            osm_city: usersOfCommune[0].osm_city
        }
    })
    const geojson = {
        "type": "geojson",
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 30,
        'clusterProperties': {
            // keep separate counts for each magnitude category in a cluster
            'count_users': ['+', ['get', 'nbUsers']],
            'concat_usernames': ['concat', ['concat', ['get', 'usernames'], ',']],
            'concat_noms': ['concat', ['concat', ['get', 'nom'], ',']],
        }, 
        "data": {
            "type": "FeatureCollection",
            "features": dataCity.map(row => {
                return {
            "type": "Feature",
            "properties": {
                "usernames": row.users.map(user => capitalizeWord(user.username)).join(','),
                "code": row.osm_city.place_id,
                "nom": row.osm_city.label,
                "nbUsers": row.users.length,
                "description": `${row.osm_city.label.slice(0, 10)}${row.osm_city.label.length > 10 ? '...' : ''}\n${row.users.length}`,
                fillColor: ["#003f5c", "#58508d", "#bc5090", "#ff6361", "#ffa600"][[2, 10, 20, 50, 100000].findIndex(r => row.users.length < r)]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [parseFloat(row.osm_city.lon), parseFloat(row.osm_city.lat)]
            }}
            })
        }
    }

    map.addSource("foreign-cities", geojson)

    map.addLayer({
        id: 'foreign-city-clusters',
        type: 'circle',
        source: "foreign-cities",
        filter: ['has', 'point_count'],
        layout: {
            visibility: 'visible',
        },
        paint: {
            // Use step expressions (https://maplibre.org/maplibre-gl-js-docs/style-spec/#expressions-step)
            // with three steps to implement three types of circles:
            //   * Blue, 20px circles when point count is less than 100
            //   * Yellow, 30px circles when point count is between 100 and 750
            //   * Pink, 40px circles when point count is greater than or equal to 750
            'circle-color': [
                'step',
                ['get', 'point_count'],
                '#11b4da',
                100,
                '#11b4da',
                750,
                '#11b4da'
            ],
            'circle-radius': [
                'step',
                ['get', 'point_count'],
                30,
                100,
                40,
                750,
                50
            ]
        }
        });
         
        map.addLayer({
            id: 'foreign-city-unclustered-point',
            type: 'circle',
            source: "foreign-cities",
            filter: ['!', ['has', 'point_count']],
            paint: {
            'circle-color': '#11b4da',
            'circle-radius': 20
            },
            layout: {
                visibility: 'visible',
            },
            // 'minzoom': 2,
        });

        map.addLayer({
            id: 'foreign-city-unclustered-point-count',
            type: 'symbol',
            source: "foreign-cities",
            filter: ['!',['has', 'point_count']],
            layout: {
                'text-field': ['get', 'nbUsers'],
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            },
            'minzoom': 0,
        });

        map.addLayer({
            id: 'foreign-city-clusters-count',
            type: 'symbol',
            source: "foreign-cities",
            filter: ['has', 'point_count'],
            layout: {
              'text-field': '{count_users}',
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 12
            },
            'minzoom': 0,
        });

    let popup = new maplibregl.Popup({
    })
    map.on('click', 'foreign-city-clusters', e => {
        let features = map.queryRenderedFeatures(e.point)
        console.log(features)
        if (features[0].properties.nom) {
            map.getCanvas().style.cursor = 'pointer'
            let description = `
            <div class="popup">
                <center><h1>${features[0].properties.nom.slice(0,30)}${features[0].properties.nom.length > 30 ? '...' : ''}</h1></center>
                <p>${features[0].properties.usernames.split(',').join('<br/>')}</p>
                </div>`
            popup.setLngLat(features[0].geometry.coordinates).setHTML(description).addTo(map)
        } else {
            map.getCanvas().style.cursor = 'pointer'
            let description = `
            <div class="popup">
                <center><h1>${features[0].properties.concat_noms.split(',').join('/').slice(0, 30)}${features[0].properties.concat_noms.length > 30 ? '...' : ''}</h1></center>
                <p>${features[0].properties.concat_usernames.split(',').join('<br/>')}</p>
                </div>`
            popup.setLngLat(features[0].geometry.coordinates).setHTML(description).addTo(map)
        }
    })

    map.on('click', 'foreign-city-unclustered-point', e => {
        let features = map.queryRenderedFeatures(e.point)
        map.getCanvas().style.cursor = 'pointer'
        let description = `
        <div class="popup"><center><h1>${features[0].properties.nom.slice(0, 30)}</h1></center>
            <p>${features[0].properties.usernames.split(',').join('<br/>')}</p>
            </div>`
        popup.setLngLat(features[0].geometry.coordinates).setHTML(description).addTo(map)
    })

    map.on('mouseenter', 'foreign-city-clusters', e => {
        map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mouseleave', 'foreign-city-clusters', e => {
        map.getCanvas().style.cursor = ''
    })

    // map.addLayer({
    //     'id': 'foreign-cities',
    //     'type': 'circle',
    //     'source': 'foreign-cities',
    //     'minzoom': 2,
    //     paint: {
    //         'circle-radius': 15, //["get", "circleRadius"],
    //         'circle-stroke-color': 'black',
    //         'circle-stroke-width': 1,
    //         'circle-opacity': 0.8,
    //         'circle-color': ["get", "fillColor"],
    //         'circle-opacity': 0.5
    //     }
    // });

    // map.addLayer({
    //     'id': 'foreign-cities-text',
    //     'type': 'symbol',
    //     'source': 'foreign-cities',
    //     'minzoom': 2,
    //     layout: {
    //         'text-field': ["get", "nbUsers"],
    //     }
    // });

    // let popup = new maplibregl.Popup({
    // })
    // map.on('click', 'foreign-cities', e => {
    //     let features = map.queryRenderedFeatures(e.point)
    //     map.getCanvas().style.cursor = 'pointer'
    //     let description = `
    //     <div class="popup">
    //         <center><h1>${features[0].properties.nom}</h1></center>
    //         <p>${features[0].properties.usernames.split(',').join('<br/>')}</p>
    //         </div>`
    //     popup.setLngLat(features[0].geometry.coordinates).setHTML(description).addTo(map)
    // })
}

const createDepartementClusters = (users) => {
    const usersByDep = groupBy(users, 'communeDep')
    const dataDep = Object.keys(usersByDep).filter(dep => dep).map(dep => {
        const usersOfDep = usersByDep[dep]
        return {
            users: usersOfDep,
            dep: usersOfDep[0].dep
        }
    })
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
                "description": `${row.dep.properties.nom.slice(0, 30)}\n${row.users.length}`,
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
    map.addSource("departements-user", geojsonDep)

    map.addLayer({
        'id': 'departements-user',
        'type': 'circle',
        'source': 'departements-user',
        'minzoom': 2,
        'maxzoom': 7,
        layout: {
            visibility: 'none',
        },
        paint: {
            'circle-radius': 30, //["get", "circleRadius"],
            'circle-stroke-color': 'white',
            'circle-stroke-width': 1,
            'circle-opacity': 0.8,
            'circle-color': ["get", "fillColor"],
            'circle-opacity': 0.5,
        }
    });
                
    map.addLayer({
        'id': 'departements-text',
        'type': 'symbol',
        'source': 'departements-user',
        'minzoom': 2,
        'maxzoom': 7,
        layout: {
            visibility: 'none',
            'text-field': ["get", "description"],
        }
    });

    map.on('mouseenter', 'departements-user', e => {
        map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mouseleave', 'departements-user', e => {
        map.getCanvas().style.cursor = ''
    })
    let popup = new maplibregl.Popup({
    })
    map.on('click', 'departements-user', e => {
        let features = map.queryRenderedFeatures(e.point)
        map.getCanvas().style.cursor = 'pointer'
        let description = `
            <div class="popup">
            <center><h1>${features[0].properties.nom.slice(0,30)}${features[0].properties.nom.length > 30 ? '...' : ''}</h1></center>
            <p>${features[0].properties.usernames.split(',').join('<br/>')}</p>
            </div>`
        popup.setLngLat(features[0].geometry.coordinates).setHTML(description).addTo(map)
    })
}

const createCommuneClusters = (users) => {
    const usersByCommune = groupBy(users, 'communeCode')
    const dataCommune = Object.keys(usersByCommune).map(commune => {
        const usersOfCommune = usersByCommune[commune]
        return {
            users: usersOfCommune,
            commune: usersOfCommune[0].commune
        }
    })
    const geojson = {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": dataCommune.map(row => {
                return {
            "type": "Feature",
            "properties": {
                "usernames": row.users.map(user => `${capitalizeWord(user.username)} (${row.commune.properties.nom})`).join(','),
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
        layout: {
            visibility: 'none',
        },
        paint: {
            'circle-radius': 15, //["get", "circleRadius"],
            'circle-stroke-color': 'white',
            'circle-stroke-width': 1,
            'circle-opacity': 0.8,
            'circle-color': ["get", "fillColor"],
            'circle-opacity': 0.5
        }
    });

    map.addLayer({
        'id': 'communes-text',
        'type': 'symbol',
        'source': 'communes',
        'minzoom': 7,
        layout: {
            visibility: 'none',
            'text-field': ["get", "nbUsers"],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
        }
    });

    let popup = new maplibregl.Popup({
    })
    map.on('click', 'communes', e => {
        let features = map.queryRenderedFeatures(e.point)
        map.getCanvas().style.cursor = 'pointer'
        let description = `
        <div class="popup">
            <center><h1>${features[0].properties.nom.slice(0,30)}${features[0].properties.nom.length > 30 ? '...' : ''}</h1></center>
            <p>${features[0].properties.usernames.split(',').join('<br/>')}</p>
            </div>`
        popup.setLngLat(features[0].geometry.coordinates).setHTML(description).addTo(map)
    })

    map.on('mouseenter', 'communes', e => {
        map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mouseleave', 'communes', e => {
        map.getCanvas().style.cursor = ''
    })
}


const createClusterClusters = (users) => {
    const usersByCommune = groupBy(users, 'communeCode')
    const dataCommune = Object.keys(usersByCommune).map(commune => {
        const usersOfCommune = usersByCommune[commune]
        return {
            users: usersOfCommune,
            commune: usersOfCommune[0].commune
        }
    })
    const geojson = {
        "type": "geojson",
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50, // 
        'clusterProperties': {
            // keep separate counts for each magnitude category in a cluster
            'count_users': ['+', ['get', 'nbUsers']],
            'concat_usernames': ['concat', ['concat', ['get', 'usernames'], ',']],
            'concat_noms': ['concat', ['concat', ['get', 'nom'], ',']],
        },
        "data": {
            "type": "FeatureCollection",
            "features": dataCommune.map(row => {
                return {
            "type": "Feature",
            "properties": {
                "usernames": row.users.map(user => `${capitalizeWord(user.username)} (${row.commune.properties.nom})`).join(','),
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

    map.addSource("clusters", geojson)


    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: "clusters",
        filter: ['has', 'point_count'],
        // 'minzoom': 2,
        paint: {
            // Use step expressions (https://maplibre.org/maplibre-gl-js-docs/style-spec/#expressions-step)
            // with three steps to implement three types of circles:
            //   * Blue, 20px circles when point count is less than 100
            //   * Yellow, 30px circles when point count is between 100 and 750
            //   * Pink, 40px circles when point count is greater than or equal to 750
            'circle-color': [
                'step',
                ['get', 'point_count'],
                '#11b4da',
                100,
                '#11b4da',
                750,
                '#11b4da'
            ],
            'circle-radius': [
                'step',
                ['get', 'point_count'],
                30,
                100,
                40,
                750,
                50
            ]
        }
        });
         
        map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: "clusters",
            filter: ['!', ['has', 'point_count']],
            paint: {
            'circle-color': '#11b4da',
            'circle-radius': 20,
            },
            // 'minzoom': 2,
        });

        map.addLayer({
            id: 'unclustered-point-count',
            type: 'symbol',
            source: "clusters",
            filter: ['!',['has', 'point_count']],
            layout: {
                'text-field': ['get', 'nbUsers'],
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            },
            // 'minzoom': 2,
        });

        map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: "clusters",
            filter: ['has', 'point_count'],
            layout: {
            'text-field': '{count_users}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
            },
            // 'minzoom': 2,
        });

    let popup = new maplibregl.Popup({
    })
    map.on('click', 'clusters', e => {
        let features = map.queryRenderedFeatures(e.point)
        console.log(features)
        if (features[0].properties.nom) {
            map.getCanvas().style.cursor = 'pointer'
            let description = `
            <div class="popup">
                <center><h1>${features[0].properties.nom.slice(0,30)}${features[0].properties.nom.length > 30 ? '...' : ''}</h1></center>
                <p>${features[0].properties.usernames.split(',').join('<br/>')}</p>
                </div>`
            popup.setLngLat(features[0].geometry.coordinates).setHTML(description).addTo(map)
        } else {
            map.getCanvas().style.cursor = 'pointer'
            let description = `
            <div class="popup">
            <center><h1>${features[0].properties.concat_noms.split(',').join('/').slice(0, 30)}${features[0].properties.concat_noms.length > 30 ? '...' : ''}</h1></center>
            <p>${features[0].properties.concat_usernames.split(',').join('<br/>')}</p>
                </div>`
            popup.setLngLat(features[0].geometry.coordinates).setHTML(description).addTo(map)
        }
    })

    map.on('click', 'unclustered-point', e => {
        let features = map.queryRenderedFeatures(e.point)
        map.getCanvas().style.cursor = 'pointer'
        let description = `
        <div class="popup">
            <center><h1>${features[0].properties.nom.slice(0,30)}${features[0].properties.nom.length > 30 ? '...' : ''}</h1></center>
            <p>${features[0].properties.usernames.split(',').join('<br/>')}</p>
            </div>`
        popup.setLngLat(features[0].geometry.coordinates).setHTML(description).addTo(map)
    })

    // // inspect a cluster on click
    // map.on('click', 'clusters', function (e) {
    //     var features = map.queryRenderedFeatures(e.point, {
    //         layers: ['clusters']
    //     });
    //     var clusterId = features[0].properties.cluster_id;
    //     if (clusterId) {
    //         map.getSource('communes').getClusterExpansionZoom(
    //             clusterId,
    //             function (err, zoom) {
    //                 if (err) return;
                    
    //                 map.easeTo({
    //                     center: features[0].geometry.coordinates,
    //                     zoom: zoom
    //                 });
    //             }
    //         );
    //     }
    // });

    map.on('mouseenter', 'clusters', e => {
        map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mouseleave', 'clusters', e => {
        map.getCanvas().style.cursor = ''
    })
}

const createDepartementBoarders = (departementsJson) => {
    map.addSource("departements", {type: "geojson", data: departementsJson})
    map.addLayer({
        'id': 'departements-lines',
        'type': 'line',
        'source': 'departements',
        'maxzoom': 9,
        paint: {
        'line-color': "black",
        'line-width': 1,
        'line-dasharray': [2, 3],
        }
    });
}

const createCountryClusters = (users, usersForeignCity) => {
    const usersByCountry = groupBy(usersForeignCity.map(user => ({
        ...user,
        country_place_id: user.osm_city.country_place_id
    })), 'country_place_id')
    let dataCountry = Object.keys(usersByCountry).map(city => {
        const usersOfCountry = usersByCountry[city]
        return {
            users: usersOfCountry,
            osm_city: usersOfCountry[0].osm_city
        }
    })
    dataCountry = [
        {
            osm_city: {
                country_label: 'France',
                country_lon: '2.087',
                country_lat: '46'
            },
            users: users
        },
        ...dataCountry
    ]
    const geojsonCountry = {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": dataCountry.map(row => {
                // console.log(row.commune.geometry.coordinates[0])

                return {
            "type": "Feature",
            "properties": {
                "usernames": row.users.map(user => `${capitalizeWord(user.username)}`).join(','),
                "nom": row.osm_city.country_label,
                "nbUsers": row.users.length,
                "description": `${row.osm_city.country_label}`,
                fillColor: ["#003f5c", "#58508d", "#bc5090", "#ff6361", "#ffa600"][[2, 10, 20, 50, 100000].findIndex(r => row.users.length < r)]
                // "objetsCount": row.objets_count,
                // "circleRadius": [2, 5, 10, 20][[5, 20, 50, 100000].findIndex(i => row.objets_count < i)]
            },
            //"geometry": row.commune.geometry
            "geometry": {
                "type": "Point",
                "coordinates": [
                    parseFloat(row.osm_city.country_lon),
                    parseFloat(row.osm_city.country_lat)
                ]
            }}
            })
        }
    }
    map.addSource("country", geojsonCountry)
    map.addLayer({
        'id': 'country',
        'type': 'circle',
        'source': 'country',
        'minzoom': 0,
        'maxzoom': 2,
        layout: {
            visibility: 'none'
        },
        paint: {
            'circle-color': '#55d9da',
            'circle-radius': 30,
        }
    });

    map.addLayer({
        'id': 'country-text',
        'type': 'symbol',
        'source': 'country',
        'minzoom': 0,
        'maxzoom': 2,
        layout: {
            visibility: 'none',
            'text-field': ["get", "nbUsers"],
        }
    });

    let popup = new maplibregl.Popup({
    })
    map.on('click', 'country', e => {
        let features = map.queryRenderedFeatures(e.point)
        map.getCanvas().style.cursor = 'pointer'
        let description = `
        <div class="popup">
            <center><h1>${features[0].properties.nom.slice(0,30)}${features[0].properties.nom.length > 30 ? '...' : ''}</h1></center>
            <p>${features[0].properties.usernames.split(',').join('<br/>')}</p>
            </div>`
        popup.setLngLat(features[0].geometry.coordinates).setHTML(description).addTo(map)
    })

    map.on('mouseenter', 'communes', e => {
        map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mouseleave', 'communes', e => {
        map.getCanvas().style.cursor = ''
    })
}

async function fetchData() {
    const res = await fetch('/static/communes-avec-outre-mer.geojson')
    let communes = await res.json().then(data => data.features)
    communes = [...communes, ...cityWithArrondissement]
    const res2 = await fetch('/api/get-users-location')
    const departementsJson = await fetch(DEPARTEMENTS_GEOJSON).then(res => res.json())
    const departements = departementsJson.features
    const usersJson = await res2.json().then(users => users)
    const usersForeignCity = usersJson.filter(users => users.osm_city).map(user => ({
        ...user,
        place_id: JSON.parse(user.osm_city).place_id,
        osm_city: JSON.parse(user.osm_city)
    }))
    const users = usersJson.filter(user => user.workplace_insee_code)
        .map(user => {
            const dep = departements.find(c => c.properties.code === user.workplace_insee_code.slice(0, 2) || c.properties.code === user.workplace_insee_code.slice(0, 3))
            const userCommune = communes.find(c => c.properties.code === user.workplace_insee_code)
            return {
                ...user,
                communeCode: userCommune ? userCommune.properties.code : undefined,
                communeDep: userCommune ? userCommune.properties.code.slice(0,2) : undefined,
                commune: userCommune,
                dep
            }
        })
        .filter(user => user.commune)
    // createDepartementBoarders(departementsJson)
    createCommuneClusters(users)
    createDepartementClusters(users)
    createClusterClusters(users)
    createForeignCityClusters(usersForeignCity)
    createCountryClusters(users, usersForeignCity)
    const helptext = document.getElementById('helptext')
    helptext.innerHTML = "<span>Données chargées !</span>"
    setTimeout(() => {
        helptext.style.display = 'none';
    }, 1000)
    
}
map.on('load', fetchData)
map.on('idle', () => {
    const buttons = document
.getElementsByClassName('button')
for (button of buttons) {
button.onclick = function (event) {
// var id = event.target.id
// // var button = document.getElementById(id)
event.preventDefault();
event.stopPropagation();
const isButtonActive = this.className.includes('active')
var layer = event.target.id.substr('button-'.length);
console.log(button, layer)

if (isButtonActive) {
    this.className = 'button'
} else {
    this.className = 'button active'
}
if (layer === 'clusters') {
    const showCluster = !isButtonActive
    map.setLayoutProperty('departements-user', 'visibility', !showCluster ? 'visible' : 'none');
    map.setLayoutProperty('departements-text', 'visibility', !showCluster ? 'visible' : 'none');
    map.setLayoutProperty('communes', 'visibility', !showCluster ? 'visible' : 'none');
    map.setLayoutProperty('communes-text', 'visibility', !showCluster ? 'visible' : 'none');
    map.setLayoutProperty('country', 'visibility', !showCluster ? 'visible' : 'none');
    map.setLayoutProperty('country-text', 'visibility', !showCluster ? 'visible' : 'none');

    map.setLayoutProperty('clusters', 'visibility', showCluster ? 'visible' : 'none');
    map.setLayoutProperty('unclustered-point', 'visibility', showCluster ? 'visible' : 'none');
    map.setLayoutProperty('unclustered-point-count', 'visibility', showCluster ? 'visible' : 'none');
    map.setLayoutProperty('cluster-count', 'visibility', showCluster ? 'visible' : 'none');
} else if (layer === 'foreign') {
    map.setLayoutProperty('foreign-city-clusters', 'visibility', map.getLayoutProperty('foreign-city-clusters', 'visibility') === 'none' ? 'visible' : 'none');
    map.setLayoutProperty('foreign-city-unclustered-point', 'visibility', map.getLayoutProperty('foreign-city-unclustered-point', 'visibility') === 'none' ? 'visible' : 'none');
    map.setLayoutProperty('foreign-city-unclustered-point-count', 'visibility', map.getLayoutProperty('foreign-city-unclustered-point-count', 'visibility') === 'none' ? 'visible' : 'none');
    map.setLayoutProperty('foreign-city-clusters-count', 'visibility', map.getLayoutProperty('foreign-city-clusters-count', 'visibility') === 'none' ? 'visible' : 'none');
}
}
}
// Use setLayoutProperty to set the value of a layout property in a style layer.
// The three arguments are the id of the layer, the name of the layout property,
// and the new property value.
})
