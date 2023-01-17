import crypto from "crypto";

export function createBranchName(username) {
    const refRegex = /( |\.|\\|~|^|:|\?|\*|\[)/gm;
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    return `author${username.replace(refRegex, '-')}-update-end-date-${randomSuffix}`;
}
