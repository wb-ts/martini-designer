import URI from "@theia/core/lib/common/uri";
import { Resource } from "./martini-filesystem";

export const isModifiable = (resource: Resource): boolean => {
    if (resource.readOnly) return false;
    if (codeDirRegExp.test(resource.location)) return false;
    return !corePackageResourceRegExp.test(resource.location);
};

export const codeDirRegExp = /^\/[\w\d_-]{1,50}\/code\/?$/;
export const codeDirResourceRegExp = /\/[\w\d_-]{1,50}\/code\/.+/;
export const corePackageResourceRegExp = /^\/core\/.+$/;
export const packageDirRegExp = /^\/[\w\d_-]{1,50}$/;

export const isResourceArray = (selection: any): selection is Resource[] =>
    selection instanceof Array && selection.length !== 0 && selection.every(e => Resource.is(e));

export const isFileArray = (object: any): object is Resource[] => {
    return !!object && object instanceof Array && object.every(o => Resource.isFile(o));
};

export const filterByParentDir = (resources: Resource[]): Resource[] =>
    resources.filter(resource => !resources.some(r => isParent(r, resource)));

export const isParent = (resource: Resource, child: Resource): boolean => {
    return (
        resource.directory && resource.location !== child.location && child.location.startsWith(resource.location + "/")
    );
};

export const isValidUrl = (url: string) => {
    try {
        // tslint:disable-next-line:no-unused-expression
        new URI(url);
        return true;
    } catch (error) {
        return false;
    }
};

export const getPackageRelativePath = (path: string): { packageName: string; relativePath: string } => {
    const segments = path.split("/");
    return {
        packageName: segments[1],
        relativePath: segments.slice(2, segments.length).join("/")
    };
};

/**
 * Returns the namespace from the given path.
 *
 * @param path
 */
export const getNamespace = (path: string) => {
    if (codeDirResourceRegExp.test(path)) {
        let namespace = path
            .split("/")
            .filter(p => p.length > 0)
            .slice(2)
            .join("/");

        // Remove file extension
        const i = namespace.lastIndexOf(".");
        if (i > 0) {
            namespace = namespace.substr(0, i);
        }
        return namespace.replace(/\//gi, ".");
    }
    return "";
};

export const withoutScheme = (uri: URI) => {
    if (uri.scheme) return uri.toString().replace(uri.scheme + ":/", "");
    return uri.toString();
};

export const withoutFileExtension = (name: string) => {
    const index = name.lastIndexOf(".");
    if (!index) return name;

    return name.substring(0, index);
};
