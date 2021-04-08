import { ConnectionHandler, JsonRpcConnectionHandler } from "@theia/core";
import { interfaces } from "inversify";
import { DocumentTypeManager, documentTypeManagerPath } from "../../common/tracker/document-type-manager";
import { DocumentTypeManagerNode } from "./node-document-type-manager";

export const bindTrackerBindings = (bind: interfaces.Bind) => {
    bind(DocumentTypeManager)
        .to(DocumentTypeManagerNode)
        .inSingletonScope();
    bind(ConnectionHandler)
        .toDynamicValue(
            ctx => new JsonRpcConnectionHandler(documentTypeManagerPath, () => ctx.container.get(DocumentTypeManager))
        )
        .inSingletonScope();
};
