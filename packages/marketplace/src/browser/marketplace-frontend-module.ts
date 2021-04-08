import { ContainerModule } from "inversify";
import { bindMarketplaceView } from "./marketplace-view";
import { bindTeamWorkspaceView } from "./teamworkspace-view";

export default new ContainerModule(bind => {
    bindMarketplaceView(bind);
    bindTeamWorkspaceView(bind);
});
