import {
    AbstractDialog,
    DialogProps,
    LocalStorageService,
    ReactWidget
} from "@theia/core/lib/browser";
import { inject, injectable, postConstruct } from "inversify";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import {
    Video,
    WelcomeData,
    WelcomeDataProvider
} from "./welcome-data-provider";

@injectable()
export class WelcomeWidget extends ReactWidget {
    static readonly ID = "welcome-widget";
    static readonly KEY_SHOW = "showOnStartup";

    showOnStartup: boolean = true;

    constructor(
        @inject(WelcomeDataProvider) readonly provider: WelcomeDataProvider,
        @inject(LocalStorageService) readonly storage: LocalStorageService
    ) {
        super();
        this.title.label = messages.welcome;
        this.title.closable = true;
    }

    @postConstruct()
    protected init() {
        this.id = WelcomeWidget.ID;
        this.title.label = messages.welcome;
        this.title.caption = messages.welcome;
        this.title.closable = true;
        this.storage.getData(WelcomeWidget.KEY_SHOW, true).then(show => {
            this.showOnStartup = show as boolean;
            this.update();
        });
    }

    setShowOnStartup = (show: boolean) => {
        this.storage.setData(WelcomeWidget.KEY_SHOW, show);
    };

    protected render(): React.ReactNode {
        return (
            <WelcomePage
                dataProvider={this.provider}
                showOnStartup={this.showOnStartup}
                onShowOnStartup={this.setShowOnStartup}
            />
        );
    }
}

interface WelcomePageProps {
    dataProvider: WelcomeDataProvider;
    showOnStartup: boolean;
    onShowOnStartup: (show: boolean) => void;
}

class WelcomePage extends React.Component<WelcomePageProps, WelcomeData> {
    constructor(props: WelcomePageProps) {
        super(props);
        props.dataProvider.getWelcomeData().then(data => {
            this.setState(data);
        });
    }

    handleShowOnStartup = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onShowOnStartup(event.target.checked);
    };

    render() {
        if (this.state === null)
            return (
                <div className="loader-container">
                    <div className="loader">Loading</div>
                </div>
            );
        else
            return (
                <div className="welcome-root">
                    <div className="welcome-container">
                        <Banner data={this.state} />
                        <div className="onlineContent">
                            <div className="category-container gen-container">
                                {this.state.categories.map(category => (
                                    <table key={category.categoryTitle} className="category">
                                        <tbody>
                                            {category.sub_categories.map(subCategory => (
                                                <CategorySection
                                                    key={subCategory.subCategoryTitle}
                                                    title={subCategory.subCategoryTitle}
                                                    imageUrl={subCategory.image}
                                                    videos={subCategory.videos}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="welcome-footer">
                        <div>
                            <input
                                type="checkbox"
                                onChange={this.handleShowOnStartup}
                                defaultChecked={this.props.showOnStartup}
                            />
              Show on Startup
            </div>
                        <div>
                            <a href="https://docs.torocloud.com/martini/latest/">
                                {messages.learn_more_docs}
                            </a>
                        </div>
                    </div>
                </div>
            );
    }
}

const Banner: React.FC<{ data: WelcomeData; }> = ({ data }) => (
    <div className="banner gen-container">
        <table className="banner-title">
            <tbody>
                <tr>
                    <td>
                        <div className="banner-title-img"></div>
                    </td>
                    <td className="banner-title-content">
                        <a href={data.banner.link}>
                            <h2>{data.banner.title}</h2>
                        </a>
                    </td>
                </tr>
            </tbody>
        </table>
        <div className="banner-content">{data.banner.content}</div>
    </div>
);

const CategorySection: React.FC<{
    title: string;
    imageUrl: string;
    videos: Video[];
}> = ({ title, imageUrl, videos }) => (
    <React.Fragment>
        <tr className="title-row">
            <td valign="bottom">
                <table style={{ width: "100%" }}>
                    <tbody>
                        <tr>
                            <td>
                                <div className="category-title">
                                    <h2>{title}</h2>
                                    <div>
                                        <a href="https://docs.torocloud.com/martini/tutorials/">
                                            See all
                      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAABmwAAAZsBqMTCdgAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAKOSURBVEiJxZZLaBNRFIa/k0miSK2rVjOJ1CRVkS5dSlMFF1IEKxYfILhwUQQfUHQhIu6EIm4EH6A7F2KhGEt3VkpTEUQQN4pg2jRKU7UIimJpHnNcNKl5zExqivXfDPz33Pude7nnzIVVktQLaBnbsslveA4q9IBsBm0pTp0DPggazxas+Nye6U8NgUJj0XbL4CroIcBTJx8LZMgw5OLHXcnJZYPMRLQH9D7QVAdQrR+oHs90pYarB2oyDYxHzoEONQABWI/IIzMRPVM9ULEjczx6BNEH1X4DUlE9OtOVGqwBtSXaAjmMd0DzCiElfc9ndfuXvanPAN6SmxXjimhdyDyQKn7L1QxsrfI2eNfIZeA0FHcUer4taOXz0+XgColczy9Y10rZ2clMRN+C7qiycz4KbelYetYDYOVyPY4QAMvyuUGKQd9sTF8e4wCUbp2w33UNkbNmInwDdasnydm5yuLaxYkScc8WUDnc+jTc4hJhn4QQLR8062B+IZ5u1+NTh7pTgs5Z1Eafy8SSr9wiRNT1xpZAsy5L3M3EUveq3dbR8Ea0WIeDGIqEHBbIlIHUqRG+XPdTatpJYCK60+uX14FnkdsoEgiGQ4DfAZSE0pVWRhD22aBuJbuTC+VOaDzSbak+BJpE6TMnwmsV+eoAQWBkaUceny8O5KuDLPRUx5uOpUzNRPSCJQxT0XDlhEC/AyfnpfC4CFxUYCJyR5Q+m+AXApcUTgLHnDJ32M7NTOfUnxYE/76pLl3vdCw9i6W92BxhA8oj9JbXXUUdZXannqhyHrBWALFA+jOdU6Pl5v/7lQNkYpNxCt4wygC1/x47zaMMSNYftoPAXz63BG1XJLg4UWcUz/vlPrdWTb8B64DvhLjJ7ckAAAAASUVORK5CYII=" />
                                        </a>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="tables-container" valign="middle">
                                <CategoryCard imageUrl={imageUrl} videos={videos} />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </td>
        </tr>
    </React.Fragment>
);

const CategoryCard: React.FC<{ imageUrl: string; videos: Video[]; }> = ({
    imageUrl,
    videos
}) => (
        <div className="category-card">
            <table className="sub-table-content">
                <tbody>
                    <tr>
                        <td>
                            <table className="float-left" style={{ width: "30%" }}>
                                <tbody>
                                    <tr>
                                        <td className="img-cont">
                                            <img className="cat-img" src={imageUrl} />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <table className="float-right" style={{ width: "70%" }}>
                                <tbody>
                                    <tr className="videos">
                                        {videos.slice(0, 4).map(video => (
                                            <VideoCard
                                                key={video.title}
                                                title={video.title}
                                                url={video.videoUrl}
                                            />
                                        ))}
                                        {videos.length < 4 &&
                                            Array(4 - videos.length)
                                                .fill(0)
                                                .map((_, i) => (
                                                    <td
                                                        key={i}
                                                        className="vid-counter"
                                                        style={{ width: "25%" }}
                                                    >
                                                        <div className="vid-item"></div>
                                                    </td>
                                                ))}
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );

const VideoCard: React.FC<{ title: string; url: string; }> = ({
    title,
    url
}) => {
    const handleVideoClicked = () => {
        var dlg = new VideoDialog({
            title: title,
            videoId: getVideoId(url)
        });
        dlg.open();
    };

    const getVideoId = (url: string) => {
        if (url === null) {
            return "";
        }
        var results = url.match(/[?&]v=([^&#]*)/);
        return results === null ? url : results[1];
    };

    return (
        <td className="vid-counter" style={{ width: "25%" }}>
            <div className="vid-item vid-2">
                <div
                    className="vid-img"
                    style={{
                        backgroundImage: `url('http://img.youtube.com/vi/${getVideoId(
                            url
                        )}/0.jpg')`
                    }}
                    onClick={handleVideoClicked}
                ></div>
                <p className="vid-title line-height-default">{title}</p>
            </div>
        </td>
    );
};

interface VideoDialogProps extends DialogProps {
    videoId: string;
}

class VideoDialog extends AbstractDialog<void> {
    value: void;

    constructor(props: VideoDialogProps) {
        super(props);
        this.contentNode.appendChild(this.createVideoFrameNode(props.videoId));
        this.titleNode.parentElement?.parentElement?.setAttribute(
            "style",
            "transform: translate(-50px, -50px)"
        );
    }

    createVideoFrameNode(videoId: string) {
        const iframeNode = document.createElement("iframe");
        iframeNode.setAttribute("width", "640px");
        iframeNode.setAttribute("height", "360px");
        iframeNode.setAttribute("frameborder", "0");
        iframeNode.setAttribute(
            "allow",
            "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        );
        iframeNode.setAttribute("allowfullscreen", "");
        iframeNode.setAttribute(
            "src",
            `https://www.youtube-nocookie.com/embed/${videoId}`
        );

        return iframeNode;
    }
}
