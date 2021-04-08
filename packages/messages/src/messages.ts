import { I18nResolver } from "i18n-ts";
import en from "./messages-en";
import fr from "./messages-fr";

const i18n = {
    en,
    fr,
    default: fr
};

// this is necessary to export the messages in node.js
let navigatorExists = false;

try {
    navigator;
    navigatorExists = true;
} catch (e) {}

export default navigatorExists ? new I18nResolver(i18n).translation : en;
