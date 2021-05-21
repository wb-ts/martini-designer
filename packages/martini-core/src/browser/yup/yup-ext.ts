import messages from "martini-messages/lib/messages";
import { addMethod, string, StringSchema, TestContext } from "yup";

declare module "yup" {
    interface StringSchema {
        minChar(minChar: string): StringSchema;
        maxChar(maxChar: string): StringSchema;
        url(): StringSchema;
    }
}

export const initYupExt = () => {
    function minChar(this: StringSchema, minChar: string) {
        return this.test("min-char", "", function(this: TestContext, value?: any) {
            const { path, createError } = this;
            if (value < minChar) return createError({ path, message: messages.min_value(minChar) });
            return value;
        });
    }

    addMethod(string, "minChar", minChar);

    function maxChar(this: StringSchema, maxChar: string) {
        return this.test("max-char", "", function(this: TestContext, value?: any) {
            const { path, createError } = this;
            if (value > maxChar) return createError({ path, message: messages.max_value(maxChar) });
            return value;
        });
    }

    addMethod(string, "maxChar", maxChar);

    function url(this: StringSchema) {
        return this.test("url", "", function(this: TestContext, value?: any) {
            if (!value) return value;
            const { path, createError } = this;
            let valid = typeof value === "string" && value.match(URL_REGEX);
            if (!valid) return createError({ path, message: messages.invalid_url });
            return value;
        });
    }

    addMethod(string, "url", url);
};

export const URL_REGEX =
    "^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$";
