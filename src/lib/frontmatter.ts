import YAML from "yaml";

export function applyChanges(text, changes) {
    const changeKeys = Object.keys(changes)
    const updates = {}

    const [frontmatter, ...body] = text.split("\n---")
    const [front] = new YAML.Parser().parse(frontmatter + "\n")
    const doc = front as YAML.CST.Document
    if (doc.value?.type !== "block-map") {
        throw `${doc.value?.type} should equal "block-map"`
    }
    const map = doc.value as YAML.CST.BlockMap
    changeKeys.forEach(key => {
        const newValue = changes[key]
        map.items.forEach(e => {
            const keyScalar = YAML.CST.resolveAsScalar(e.key)
            if (keyScalar.value === key) {
                const valueScalar = YAML.CST.resolveAsScalar(e.value)
                if (valueScalar && valueScalar.value !== newValue) {
                    updates[key] = "updated"
                    YAML.CST.setScalarValue(e.value, newValue)
                } else {
                    updates[key] = "exists"
                }
            }
        })

        if (!updates[key]) {
            const { indent } = map
            map.items.push({
                start: [],
                key: YAML.CST.createScalarToken(key, { end: [], indent }),
                sep: [
                    { type: 'map-value-ind', source: ':', offset: -1, indent: 0 },
                    { type: 'space', source: ' ', offset: -1, indent: 0 },
                ],
                value: YAML.CST.createScalarToken(newValue, { indent }),
            })
            updates[key] = "inserted"
        }
    })
    const content = YAML.CST.stringify(doc) + "---" + body.join("\n---")

    return {
        content,
        updates
    }
}
