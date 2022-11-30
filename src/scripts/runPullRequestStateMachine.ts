import { pullRequestStateMachine } from "@/schedulers/onboarding/sendMessageToSEMailingListOnNewMemberCreated";

pullRequestStateMachine().then(() => {
    console.log('Pull request state machine called')
})
