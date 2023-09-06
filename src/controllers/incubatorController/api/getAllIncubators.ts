import betagouv from "@/betagouv"

export default async (req, res) => {
    const incubator = await betagouv.incubators()
    console.log(incubator)
    res.json(incubator)
}