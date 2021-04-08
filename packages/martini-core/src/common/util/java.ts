export const JAVA_INTEGER_MAX_VALUE = 2147483647;

export const JAVA_KEYWORDS: Set<string> = new Set([
    "abstract",
    "continue",
    "for",
    "new",
    "switch",
    "assert",
    "default",
    "goto",
    "package",
    "synchronized",
    "boolean",
    "do",
    "if",
    "private",
    "this",
    "break",
    "double",
    "implements",
    "protected",
    "throw",
    "byte",
    "else",
    "import",
    "public",
    "throws",
    "case",
    "enum",
    "instanceof",
    "return",
    "transient",
    "catch",
    "extends",
    "int",
    "short",
    "try",
    "char",
    "final",
    "interface",
    "static",
    "void",
    "class",
    "finally",
    "long",
    "strictfp",
    "volatile",
    "const",
    "float",
    "native",
    "super",
    "while"
]);

export const PRIMITIVES = new Set<string>([
    "void",
    "boolean",
    "byte",
    "char",
    "short",
    "int",
    "long",
    "float",
    "double"
]);

export const javaClassNameRegExp = /^[a-zA-Z_$][a-zA-Z\d_$]*$/;
export const javaPackageNameRegExp = /^[a-z_][a-z0-9_]*$/i;
export const javaIdentifierStartRegExp = /[a-z_\$]/i;
export const javaIdentifierPartRegExp = /[a-z0-9_\$]/i;
export const notJavaIdentifierPartRegExp = /[^a-z0-9_\$]/gi;

export const isValidJavaPackageName = (name: string) => {
    return javaPackageNameRegExp.test(name) && !JAVA_KEYWORDS.has(name);
};

export const isJavaIdentifierStart = (char: string) => {
    return javaIdentifierStartRegExp.test(char);
};

export const isJavaIdentifierPart = (char: string) => {
    return javaIdentifierPartRegExp.test(char);
};
