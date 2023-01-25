import ejs from 'ejs'
import { getEventsForCalendarFromDateToDate } from "../lib/icalhelper"
import betagouv from '../betagouv'
import * as utils from '@controllers/utils';
import { sendCampaignEmail } from '@/config/email.config';
import { MAILING_LIST_TYPE } from '@/modules/email';


interface ReadableEvents {
  startDate: Date,
  endDate: Date,
  location: string,
  title: string
}

const makeReadableEvent = events => {
  const titles = []
  return events.sort(event => event.startDate).map(event => ({
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
}

export const sendForumBetaReminder = async (numberOfDays:number=6, canal: string='general') => {
    const today = new Date()
    const dayInSixDays = new Date()
    dayInSixDays.setDate(today.getDate() + numberOfDays)
    const calendarURL = process.env.CALENDAR_URL
    const events : {} = await getEventsForCalendarFromDateToDate(calendarURL, today, dayInSixDays)
    let readableEvents : ReadableEvents[] = makeReadableEvent(events)
    const forumBetaEvent = readableEvents.find(event => event.title.toLowerCase().includes('forum beta.gouv'))
    if (forumBetaEvent) {
      const messageContent = await ejs.renderFile('./src/views/templates/emails/forumBetaMessage.ejs', {
        event: forumBetaEvent,
        CALENDAR_PUBLIC_URL: process.env.CALENDAR_PUBLIC_URL
      });
      await betagouv.sendInfoToChat(messageContent, canal);
      if (process.env.FEATURE_SEND_FORUM_REMINDER_EMAIL) {
        await sendCampaignEmail({
          type: MAILING_LIST_TYPE.FORUM_REMINDER,
          variables: undefined,
          forceTemplate: true,
          campaignName: `Forum beta reminder du ${forumBetaEvent.startDate}`,
        })
      }
    }
    return forumBetaEvent
}

export const postEventsOnMattermost = async (numberOfDays:number=6, canal: string='general') => {
    const today = new Date()
    const dayInSixDays = new Date()
    dayInSixDays.setDate(today.getDate() + numberOfDays)
    const calendarURL = process.env.CALENDAR_URL
    const events = await getEventsForCalendarFromDateToDate(calendarURL, today, dayInSixDays)
    console.log(events)
    let readableEvents : ReadableEvents[] = makeReadableEvent(events)
    
    const messageContent = await ejs.renderFile('./src/views/templates/emails/eventMessage.ejs', {
        events: readableEvents,
        CALENDAR_PUBLIC_URL: process.env.CALENDAR_PUBLIC_URL
    });
    await betagouv.sendInfoToChat(messageContent, canal);
}

