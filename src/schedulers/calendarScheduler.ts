import ejs from 'ejs'
import { getEventsForCalendarFromDateToDate } from "../lib/icalhelper"
import betagouv from '../betagouv'
import * as utils from '@controllers/utils';

export const postEventsOnMattermost = async () => {
    const today = new Date()
    const dayInSixDays = new Date()
    dayInSixDays.setDate(today.getDate() + 6)
    const calendarURL = process.env.CALENDAR_URL
    const events = await getEventsForCalendarFromDateToDate(calendarURL, today, dayInSixDays)
    const titles = []
    console.log(events)
    let readableEvents = events.sort(event => event.startDate).map(event => ({
        startDate: utils.formatDateToReadableDateAndTimeFormat(event.startDate),
        endDate: utils.formatDateToReadableDateAndTimeFormat(event.endDate),
        location: event.location,
        title: event.title
    }))
    .filter((event) => {
      // hack to prevent duplicate
      if (!titles.includes(event.title)) {
        titles.push(event.title)
        return true
      } else {
        return false
      }
    })  
    
    const messageContent = await ejs.renderFile('./src/views/templates/emails/eventMessage.ejs', {
        events: readableEvents,
        CALENDAR_PUBLIC_URL: process.env.CALENDAR_PUBLIC_URL
    });
    await betagouv.sendInfoToChat(messageContent, process.env.CALENDAR_PUBLIC_CHANNEL || 'general');
}

