import { SendEmailProps } from "@modules/email"

const sentEmails: Array<SendEmailProps> = [] // For testing purposes only

function fakeSendEmail(props: SendEmailProps): Promise<null> {
  if (process.env.NODE_ENV === 'test') {
    // Register the sent email but don't send it for real
    sentEmails.push(props)
    return null
  }

  const { subject, toEmail, type, variables } = props

  console.info(
    `EMAIL OUT: ${toEmail
      .map((item) => item)
      .join(', ')} with subject "${subject}" and type ${type}`,
    variables
  )

  return null
}

// For tests only
const getSentEmails = () => {
  return sentEmails
}

const resetSentEmails = () => {
  while (sentEmails.length) {
    sentEmails.pop()
  }
}

export { getSentEmails, fakeSendEmail, resetSentEmails }
