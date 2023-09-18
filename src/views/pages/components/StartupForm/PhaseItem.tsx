import React from 'react';
import { Phase } from '@/models/startup';
import SEPhaseSelect from '../SEPhaseSelect';
import DatepickerSelect from '../DatepickerSelect';

interface PhaseItemProps extends Phase {
    deletePhase(): void,
    onChange(phase: Phase): void
}

const PhaseItem = ({ name, start, deletePhase, onChange } : PhaseItemProps) => {
    const [startDate, setStartDate] : [Date, (Date) => void] = React.useState(start ? new Date(start) : undefined)
    const [phase, setPhase] = React.useState(name)
    React.useEffect(() => {
        onChange({
            name: phase,
            start: startDate,
        })
    }, [phase, startDate])
    return <>
        <tr style={{ border: 'none'}}>
            <td style={{ padding: 5 }}>                    {/* <label htmlFor="startup">
                        <strong>Phase</strong><br />
                    </label> */}
                    <SEPhaseSelect
                        onChange={(phase) => {
                            setPhase(phase.value)
                        }}
                        defaultValue={name}
                        isMulti={false}
                        placeholder={"Selectionne la phase"}
                    />
                </td>
                <td style={{ padding: 5 }}>
                    {/* <label htmlFor="end">
                        <strong>Date de début</strong>
                    </label> */}
                    {start && <DatepickerSelect
                        name="startDate"
                        min={'2020-01-31'}
                        title="En format YYYY-MM-DD, par exemple : 2020-01-31"
                        required
                        dateFormat='dd/MM/yyyy'
                        selected={startDate}
                        onChange={(dateInput:Date) => setStartDate(dateInput)} />}
                </td>
                <td style={{ padding: 5 }}>
                    <a style={{ textDecoration: 'none' }}
                    onClick={() => deletePhase()}
                    >🗑️</a>
                </td>
        </tr></>
}

export default PhaseItem
