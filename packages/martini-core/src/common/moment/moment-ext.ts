import "@rangerrick/moment-javaformat";

declare module "moment-timezone" {
    interface Moment {
        formatJavaSDF(format: string): string;
    }
}

import moment = require("moment-timezone");
export = moment;
