import React from 'react'
import { Request } from 'express'

import { Member } from '@models/member';
import { ReactTabulator, ColumnDefinition } from 'react-tabulator';

interface CommunityProps {
    title: string,
    currentUserId: string,
    errors: string[],
    messages: string[],
    users: Member[],
    activeTab: string,
    request: Request,
    isAdmin: boolean
}
  
const columns: ColumnDefinition[] = [
    { title: 'email', field: 'email'},
    { title: 'username', field: 'username' },
    { title: 'status', field: 'status' },
];
  
const css = ".panel { min-height: 400px; }" // to have enough space to display dropdown

var groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};
/* Pure component */
export const AdminMattermostUser = (props: CommunityProps) => {

    const [state] = React.useState<any>({
        users: props.users,
        selectedName: '',
        fromBeta: true,
        excludeEmails: [],
    });

    const [showMattermostAndStatus, setShowMattermostAndStatus] = React.useState(false)
    
    function toggleShowMattermostAndStatus() {
        setShowMattermostAndStatus(!showMattermostAndStatus)
    }

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

    const countData = groupBy(state.users, 'status')

    const usersValidWithDomain = countData['USER_IS_VALID_WITH_DOMAIN'] || []
    const usersByDomain = {}
    usersValidWithDomain.map(user => {
        const domain = user.email.split('@')[1]
        const usersForDomain = usersByDomain[domain] || []
        usersForDomain.push(user)
        usersByDomain[domain] = usersForDomain
    })

    return (
    <>
        <div className="module">
            <div key={'filter-user'} className="panel panel-full-width" id="filter-user">
                <h3 className="margin-10-0 collapse-header">
                    <button aria-expanded="false" id="webmail" onClick={toggleShowMattermostAndStatus}>
                    Membre mattermost et status
                        <div className="icon fa fa-chevron-down"></div>
                    </button>
                </h3>
                {showMattermostAndStatus && <div>
                    { Object.keys(countData).map(key => {
                        return <div>{key} : {countData[key].length}</div>
                    })}
                    { Object.keys(usersByDomain).map(key => {
                        return <div>{key} : {usersByDomain[key].length}</div>
                    })}
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
                </div>}
            </div>
        </div>
        <style media="screen">
            {css}
        </style>
    </>)
}
