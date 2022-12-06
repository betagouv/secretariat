import { unblockEmailsThatAreActive } from "@/schedulers/unblockEmailsThatAreActive"

unblockEmailsThatAreActive().then(() => {
    console.log('Done')
})
