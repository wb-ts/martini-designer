import { addMethod, string, StringSchema, TestContext } from "yup";
import messages from "martini-messages/lib/messages";
import URI from "@theia/core/lib/common/uri";

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
            const { path, createError } = this;
            let valid = false;
            try {
                // tslint:disable-next-line:no-unused-expression
                new URI(value);
                valid = true;
            } catch (error) {}
            if (!valid) return createError({ path, message: messages.invalid_url });
            return value;
        });
    }

    addMethod(string, "url", url);
};
