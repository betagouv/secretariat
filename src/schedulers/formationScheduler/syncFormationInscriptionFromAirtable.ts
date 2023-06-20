import { createUserFormation } from "@/db/dbUsersFormations"
import Airtable from "airtable"
import * as Sentry from '@sentry/node'
import config from '@config'

export const syncFormationInscriptionFromAirtable = (syncOnlyNewRecord) => {
    var base = new Airtable({apiKey: config.AIRTABLE_API_KEY}).base(config.AIRTABLE_FORMATION_BASE_ID);
    var date = new Date();
    date.setDate(date.getDate() - 19);
    const dateStr = date.toISOString().split('T')[0]
    let filterByFormula = `DATETIME_DIFF(DATETIME_PARSE(`+ dateStr +`, 'YYYY-MM-DD'),{Created}, 'days')<0`
    base('Inscriptions').select({
        filterByFormula
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
   

        records.forEach(function(record) {
            const username = (record.get('email') as string).split('@')[0]
            try {
                createUserFormation({
                    formation_id: record.get('Record ID (from Formation)') as string,
                    username
                })
            } catch(e) {
                Sentry.captureException(e);
                console.error(e)
            }
        });

        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();

    }, function done(err) {
        if (err) { console.error(err); return; }
    });
}
