import ejs from 'ejs'
import { getEventsForCalendarFromDateToDate } from "../lib/icalhelper"
import betagouv from '../betagouv'
import * as utils from '../controllers/utils';

export const postEventsOnMattermost = async () => {
    const today = new Date()
    const dayInSevenDays = new Date()
    dayInSevenDays.setDate(today.getDate() + 7)
    const calendarURL = process.env.CALENDAR_URL
    const events = await getEventsForCalendarFromDateToDate(calendarURL, today, dayInSevenDays)
    const readableEvents = events.map(event => ({
        startDate: utils.formatDateToReadableDateAndTimeFormat(event.startDate),
        endDate: utils.formatDateToReadableDateAndTimeFormat(event.endDate),
        location: event.location,
        title: event.title
    }))
    const messageContent = await ejs.renderFile('./src/views/templates/emails/eventMessage.ejs', {
        events: readableEvents,
        CALENDAR_PUBLIC_URL: process.env.CALENDAR_PUBLIC_URL
    });
    await betagouv.sendInfoToChat(messageContent, 'incubateur-embauche-autre');
}

