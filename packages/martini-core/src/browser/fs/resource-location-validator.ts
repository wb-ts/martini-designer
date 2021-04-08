import { inject, injectable } from "inversify";
import messages from "martini-messages/lib/messages";
import { codeDirRegExp, codeDirResourceRegExp, corePackageResourceRegExp } from "../../common/fs/file-util";
import { MartiniFileSystem } from "../../common/fs/martini-filesystem";

export const ResourceLocationValidator = Symbol("ResourceLocationValidator");

export interface ResourceLocationValidator {
    validate(location: string): Promise<true | string>;
}

@injectable()
export class DefaultResourceLocationValidator implements ResourceLocationValidator {
    @inject(MartiniFileSystem)
    private readonly fileSystem: MartiniFileSystem;

    async validate(location: string): Promise<true | string> {
        try {
            const resource = await this.fileSystem.get(location);
            if (!resource) return messages.location_not_exists;
            if (!resource.directory) return messages.not_directory;
            if (resource.readOnly || corePackageResourceRegExp.test(resource.location))
                return messages.directory_readonly;
        } catch (error) {
            return error.message;
        }
        return true;
    }
}

@injectable()
export class CodeFileLocationValidator implements ResourceLocationValidator {
    @inject(DefaultResourceLocationValidator)
    private readonly defaultValidator: DefaultResourceLocationValidator;

    async validate(location: string): Promise<true | string> {
        if (!codeDirRegExp.test(location) && !codeDirResourceRegExp.test(location))
            return messages.location_must_inside_code_dir;
        return this.defaultValidator.validate(location);
    }
}
