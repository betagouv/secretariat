import crypto from "crypto";

export function createBranchName(name) {
    const refRegex = /( |\.|\\|~|^|:|\?|\*|\[)/gm;
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    return `${name.replace(refRegex, '-')}-update-end-date-${randomSuffix}`;
}
