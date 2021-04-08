module.exports = {
  projects:
	[
	  "<rootDir>/packages/*/jest.config.js"
	],
  coverageDirectory: "<rootDir>/coverage/",
  reporters: [ "default", "bamboo-jest-reporter" ]
};
