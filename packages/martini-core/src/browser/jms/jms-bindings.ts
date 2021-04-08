import { interfaces } from "inversify";
import { bindSendJmsMessageDialogBindings } from "./send-jms-message-dialog";
import { WebSocketConnectionProvider } from "@theia/core/lib/browser";
import { MartiniBrokerManager, martiniBrokerPath } from "../../common/jms/martini-broker-manager";
import { CommandContribution } from "@theia/core";
import { JmsCommandContribution, JmsMenuContribution } from "./jms-contribution";
import { MenuContribution } from "@theia/core/lib/common/menu";
import { bindDestinationPickerDialogBindings } from "./destination-picker-dialog";

export const bindJmsBindings = (bind: interfaces.Bind) => {
    bind(MartiniBrokerManager)
        .toDynamicValue(ctx => {
            const connection = ctx.container.get(WebSocketConnectionProvider);
            return connection.createProxy(martiniBrokerPath);
        })
        .inSingletonScope();
    bindDestinationPickerDialogBindings(bind);
    bindSendJmsMessageDialogBindings(bind);

    bind(CommandContribution).to(JmsCommandContribution);
    bind(MenuContribution).to(JmsMenuContribution);
};
