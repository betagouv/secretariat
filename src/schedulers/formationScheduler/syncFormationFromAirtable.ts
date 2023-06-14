import Airtable from "airtable";

export const syncFormationFromAirtable = () => {
    var base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_FORMATION_BASE_ID);

    base('Formations').select({
        // Selecting the first 3 records in Formations accessibles à l'inscription:
        maxRecords: 3,
        fields: ["Formation", "Record ID", "Début"],
        view: "Formations passées",
        filterByFormula: "DATESTR({Début})>'2023-05-14'"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        records.forEach(function(record) {
            console.log('Retrieved', record.get('Formation'), record.get('Record ID'), record.get('Début'));
        });

        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();

    }, function done(err) {
        if (err) { console.error(err); return; }
    });
}
