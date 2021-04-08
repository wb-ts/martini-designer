import { Path } from "@theia/core";
import { inject, injectable } from "inversify";
import messages from "martini-messages/lib/messages";
import { MartiniFileSystem } from "../../common/fs/martini-filesystem";
import { isValidJavaPackageName, javaClassNameRegExp, JAVA_KEYWORDS } from "../../common/util/java";

export const ResourceNameValidator = Symbol("ResourceNameValidator");

export interface ResourceNameValidator {
    validate(parentPath: string, name: string): Promise<true | string>;
}

@injectable()
export class DefaultResourceNameValidator implements ResourceNameValidator {
    @inject(MartiniFileSystem)
    private readonly fileSystem: MartiniFileSystem;

    async validate(parentPath: string, name: string): Promise<true | string> {
        if (name.trim().length === 0) return messages.not_blank;
        const path = new Path(parentPath).join(name);

        try {
            const exists = await this.fileSystem.exists(path.toString());
            if (exists) return messages.resource_exists;
            return true;
        } catch (error) {
            return error.message;
        }
    }
}

@injectable()
export class CodeFileNameValidator implements ResourceNameValidator {
    @inject(DefaultResourceNameValidator) private defaultValidator: DefaultResourceNameValidator;

    async validate(parentPath: string, name: string): Promise<true | string> {
        const path = new Path(name);
        const transformedPath = new Path(path.name.split(/\./).join("/") + path.ext);

        let dir = transformedPath;

        while (dir.hasDir) {
            dir = dir.dir;
            if (!isValidJavaPackageName(dir.name)) return messages.invalid_code_dir_name(dir.name);
        }

        const fullPath = new Path(parentPath).join(transformedPath.toString());
        if (JAVA_KEYWORDS.has(fullPath.name)) return messages.cannot_use_java_keywords;
        if (!javaClassNameRegExp.test(fullPath.name)) return messages.not_valid_name;
        return this.defaultValidator.validate(parentPath, name);
    }
}
