const obfuscatingTransformer = require("react-native-obfuscating-transformer")
const typescriptTransformer = require('react-native-typescript-transformer')

module.exports = obfuscatingTransformer({
    upstreamTransformer: typescriptTransformer
})