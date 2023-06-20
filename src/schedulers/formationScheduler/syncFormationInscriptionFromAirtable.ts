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
    base.table('Inscriptions').select({
        filterByFormula,
        view: 'Inscrits',
        fields: ['Email', 'Record ID (from Formation)']
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
        for (const record of records) {
            const username = (record.get('Email') as string).split('@')[0]
            try {
                createUserFormation({
                    formation_id: record.get('Record ID (from Formation)') as string,
                    username
                })
            } catch(e) {
                Sentry.captureException(e);
                console.error(e)
            }
        } 
       fetchNextPage();
    }, function done(err) {
        if (err) { console.error(err); return; }
    });
}
