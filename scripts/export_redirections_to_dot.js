require('dotenv').config()
const BetaGouv = require('./../betagouv')
BetaGouv.redirections().then(function(redirections){
    console.log("digraph D {") 
    console.log("rankdir=LR; ")
    redirections.forEach(function(redirection){
        const nodeIdFrom = redirection["from"]
        const nodeIdTo = redirection["to"] 
        console.log(`"${nodeIdFrom}" -> "${nodeIdTo}";`)
    })
    console.log("}")
})
