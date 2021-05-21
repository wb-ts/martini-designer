import messages from "martini-messages/lib/messages";
import * as yup from "yup";

export const initYupLocale = () => {
    yup.setLocale({
        mixed: {
            notType: params => messages.must_be_type(params.type),
            required: messages.not_blank
        },
        number: {
            integer: messages.must_be_integer,
            min: params => messages.must_be_greater_or_equal(params.min),
            max: params => messages.must_be_less_or_equal(params.max)
        },
        string: {
            min: params => messages.min_length(params.min),
            max: params => messages.max_length(params.max),
            email: messages.must_be_valid_email
        }
    });
};
