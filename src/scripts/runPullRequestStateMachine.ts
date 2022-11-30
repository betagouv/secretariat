import { pullRequestStateMachine } from "@/schedulers/onboarding/pullRequestStateMachine";

pullRequestStateMachine().then(() => {
    console.log('Pull request state machine called')
})
