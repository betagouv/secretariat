import ICAL from 'ical.js';
import axios from 'axios';

const isOccurenceOverdue = function(event, startDate) {
    const rule = event.component.getFirstPropertyValue('rrule')
    if (rule.count && rule.freq === 'WEEKLY') {
        const date = new Date(event.startDate)
        date.setDate(date.getDate() + (7 * rule.interval * rule.count))
        return date < startDate
    }
    return true
}

const buildEvent = (occurence, initialEvent) => {
    const startDate = new Date(occurence.startDate)
    const endDate = new Date(occurence.endDate)
    const initStartDate = new Date(initialEvent.startDate)
    const initEndDate = new Date(initialEvent.endtDate)
    startDate.setHours(initStartDate.getHours())
    endDate.setHours(initEndDate.getHours())
    startDate.setMinutes(initStartDate.getMinutes())
    endDate.setMinutes(initEndDate.getMinutes())
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
    console.log('Get events for calendar from date to date', calendarIcalUrl)
    // Get all non recurrent event
    const time = new ICAL.Time({
        year: startDate.getFullYear(),
        month: startDate.getMonth(),
        day: startDate.getDate(),
        minute: 0,
        second: 0,
        isDate: false
    });
    let vevents = vcalendar.getAllSubcomponents('vevent')
    console.log('Get events for calendar number of events : ', vevents.length)

    const events = []

    for (const item of vevents) {
        const vevent = new ICAL.Event(item)
        if (vevent.isRecurring()) {
            const iter = vevent.iterator(time)
            for (let next = iter.next(); next; next = iter.next()) {
                if (vevent.component.getFirstPropertyValue('rrule').count && isOccurenceOverdue(vevent, startDate)) {
                    continue;
                }
                const occ = vevent.getOccurrenceDetails(next);
                if ((new Date(occ.startDate) >= startDate && new Date(occ.endDate) <= endDate)) {
                    events.push(buildEvent(occ, vevent))
                }
                if ((new Date(occ.startDate) > endDate)) {
                    break;
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
    return events.sort((a,b) => a.startDate - b.startDate);
}

export default {
    getEventsForCalendarFromDateToDate
}
