import { Startup } from "@/models/startup";

export const generateMailingListName = (startup: Startup) : string => {
    const MAX_MAILING_LIST_NAME = 32
    const name = startup.id.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    return `set-${name}`.slice(0, MAX_MAILING_LIST_NAME);
}
