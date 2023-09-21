import { createFormation } from "@/db/dbFormations";
import Airtable from "airtable";
import * as Sentry from '@sentry/node';

export const syncFormationFromAirtable = (syncOnlyNewRecord) => {
    var base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_FORMATION_BASE_ID);
    let filterByFormula = "DATETIME_DIFF(DATETIME_PARSE('2021-06-01', 'YYYY-MM-DD'),{Début}, 'days')<0"
    if (syncOnlyNewRecord) {
        var date = new Date();
        date.setDate(date.getDate() - 1);
        const dateStr = date.toISOString().split('T')[0]
        filterByFormula = `AND(DATETIME_DIFF(DATETIME_PARSE('2023-06-01', 'YYYY-MM-DD'),{Début}, 'days')<0, DATETIME_DIFF(DATETIME_PARSE('`+ dateStr +`', 'YYYY-MM-DD'),{Created}, 'days')<0)`
    }
    base('Formations').select({
        // Selecting the first 3 records in Formations accessibles à l'inscription:
        fields: ["Formation", "Record ID", "Début", "formationTypeName", 'formationType', 'embarquement'],
        view: "Formations passées",
        filterByFormula
    }).eachPage(async function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        for (const record of records) {
                try {
                    await createFormation({
                        is_embarquement: record.get('embarquement') === true || record.get('embarquement') === 'true',
                        formation_date: new Date(record.get('Début') as string),
                        formation_type: (record.get('formationTypeName') as [string])[0],
                        formation_type_airtable_id: (record.get('formationType') as [string])[0],
                        airtable_id: record.get('Record ID') as string,
                        name: record.get('Formation') as string
                    })
                } catch(e) {
                    Sentry.captureException(e);
                    console.error(e)
                }
        }
        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();

    }, function done(err) {
        if (err) { console.error(err); return; }
    });
}
