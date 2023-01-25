import ejs from 'ejs'
import { getEventsForCalendarFromDateToDate } from "../lib/icalhelper"
import betagouv from '../betagouv'
import * as utils from '@controllers/utils';
import { sendCampaignEmail } from '@/config/email.config';
import { EMAIL_TYPES, MAILING_LIST_TYPE } from '@/modules/email';


interface ReadableEvents {
  startDate: string,
  endDate: string,
  startDateAsDate: Date,
  location: string,
  title: string
}

const makeReadableEvent = events => {
  const titles = []
  return events.sort(event => event.startDate).map(event => ({
    startDate: utils.formatDateToReadableDateAndTimeFormat(event.startDate),
    startDateAsDate: event.startDate,
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
      console.log(forumBetaEvent)
      await betagouv.sendInfoToChat(messageContent, canal);
      await sendCampaignEmail({
        mailingListType: MAILING_LIST_TYPE.FORUM_REMINDER,
        type: EMAIL_TYPES.EMAIL_FORUM_REMINDER,
        variables: {
          date: forumBetaEvent.startDateAsDate.toISOString(),
          calendar_public_url: process.env.CALENDAR_PUBLIC_URL
        },
        forceTemplate: true,
        campaignName: `Forum beta reminder du ${forumBetaEvent.startDate}`,
      })
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

