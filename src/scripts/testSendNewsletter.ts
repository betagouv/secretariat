import HedgedocApi from 'hedgedoc-api';
import config from '../config';
import { sendMail } from '../controllers/utils';
import { renderHtmlFromMdWithAttachements } from "../lib/mdtohtml";

const args = process.argv.slice(2);

async function testSendNewsletter() {
    const pad = new HedgedocApi(
        config.padEmail,
        config.padPassword,
        config.padURL
      );
    const newsletterContent = await pad.getNoteWithId(args[0]);
    const { html, attachments } = await renderHtmlFromMdWithAttachements(newsletterContent);
     console.log(attachments)
    await sendMail(
    args[1],
      `Test`,
      html,
      {
        headers: {
          'X-Mailjet-Campaign': 2,
          'X-Mailjet-TrackOpen': '1',
          'X-Mailjet-TrackClick': '1',
        },
      },
      attachments
    );
}

testSendNewsletter()
