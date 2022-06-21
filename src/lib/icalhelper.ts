import ICAL from 'ical.js';
import axios from 'axios';

const buildEvent = (occurence, initialEvent) => {
    const occStartDate = new Date(occurence.startDate)
    const occEndDate = new Date(occurence.endDate)
    const startDate = new Date(initialEvent.startDate)
    const endDate = new Date(initialEvent.endtDate)
    startDate.setDate(occStartDate.getDate())
    endDate.setDate(occEndDate.getDate())
    return {
        startDate,
        endDate,
        location: initialEvent.location,
        title: initialEvent.summary,
        duration: initialEvent.duration
    }
}

export const getEventsForCalendarFromDateToDate = async (calendarIcalUrl, startDate, endDate) => {
    const iCalendarData = await axios.get(calendarIcalUrl).then(res => res.data)
    const jcalData = ICAL.parse(iCalendarData);
    const vcalendar = new ICAL.Component(jcalData);
    // Get all non recurrent event
    const time = new ICAL.Time({
        year: startDate.getFullYear(),
        month: startDate.getMonth(),
        day: startDate.getDate(),
        minute: 0,
        second: 0,
        isDate: false
    });
    const vevents = vcalendar.getAllSubcomponents('vevent')
        .map((c) => new ICAL.Event(c))
    const events = []
    for (const vevent of vevents) {
        if (vevent.isRecurring()) {
            const iter = vevent.iterator(time)
            let next = iter.next();
            if (next) {
            const occ = vevent.getOccurrenceDetails(next);
            if ((new Date(occ.startDate) >= startDate && new Date(occ.endDate) <= endDate)) {
                events.push(buildEvent(occ, event))
            }
            for (; next; next = iter.next()) {
                const occ = vevent.getOccurrenceDetails(next);
                if ((new Date(occ.startDate) >= startDate && new Date(occ.endDate) <= endDate)) {
                    events.push(buildEvent(occ, event))
                }
                if ((new Date(occ.startDate) > endDate)) {
                    break;
                }
            }
            }
        } else {
            if (new Date(vevent.startDate) >= startDate && new Date(vevent.endDate) <= endDate) {
            events.push({
                startDate: new Date(vevent.startDate),
                endDate: new Date(vevent.endDate),
                location: vevent.location,
                title: vevent.summary,
                duration: vevent.duration
            })
            }
        }
    }
    return events
}

export default {
    getEventsForCalendarFromDateToDate
}
