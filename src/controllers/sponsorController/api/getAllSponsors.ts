import betagouv from "@/betagouv"

export default async (req, res) => {
    const sponsors = await betagouv.sponsors()
    res.json(sponsors)
}
