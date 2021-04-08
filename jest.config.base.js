module.exports = {
    roots: ["<rootDir>/src"],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    testRegex: "(/tests/.*.(test|spec)).(jsx?|tsx?)$",
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    moduleNameMapper: {
        "\\.css$": "identity-obj-proxy"
    },
    collectCoverage: true,
    coveragePathIgnorePatterns: ["(tests/.*.mock).(jsx?|tsx?)$"],
    verbose: true,
    setupFilesAfterEnv: ["../../jest.setup.ts"]
};