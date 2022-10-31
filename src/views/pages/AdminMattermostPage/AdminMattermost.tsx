import React from 'react'
import type { Request } from 'express'

import { Member } from '@models/member';
import { InnerPageLayout } from '../components/InnerPageLayout';
import { hydrateOnClient } from '../../hydrateOnClient'
import { ReactTabulator, ColumnDefinition } from 'react-tabulator';

interface CommunityProps {
    title: string,
    currentUserId: string,
    errors: string[],
    messages: string[],
    users: Member[],
    activeTab: string,
    request: Request,
}
  
const columns: ColumnDefinition[] = [
    { title: 'email', field: 'email'},
    { title: 'username', field: 'username' },
    { title: 'status', field: 'status' },
];
  
const css = ".panel { min-height: 400px; }" // to have enough space to display dropdown

/* Pure component */
export const AdminMattermost = InnerPageLayout((props: CommunityProps) => {

    const [state] = React.useState<any>({
        users: [],
        selectedName: '',
        ...props,
    });

    function exportToCsv(filename, rows) {

        const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
        const header = Object.keys(rows[0])
        const csv = [
        header.join(';'), // header row first
        ...rows.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(';'))
        ].join('\r\n')

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        if (navigator['msSaveBlob']) { // IE 10+
            navigator['msSaveBlob'](blob, filename);
        } else {
            const link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }

    const onClickDownload = async () => {
        exportToCsv('users.csv', state.users)
    }

    return (
    <>
        <div className="module">
            <div key={'filter-user'} className="panel panel-full-width" id="filter-user">
                <h3>
                    Filtrer les membres
                </h3>
            { Boolean(state.users.length) && <button onClick={onClickDownload}  className="button">Télécharger</button> }
            <br/>
            <br/>
            <ReactTabulator
                data-instance={'user-table'}
                columns={columns}
                data={state.users}
                options={{ pagination: 'local', paginationSize: 50 }}
            />
            <br/>
            <br/>
        </div>
        </div>
        <style media="screen">
            {css}
        </style>
    </>)
})

hydrateOnClient(AdminMattermost)
