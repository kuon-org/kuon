import { DISCORD_TEMPLATE, TWITTER_TEMPLATE } from "../../init";
export const DiscordTemplate = (data) => {
    return {
        ...DISCORD_TEMPLATE,
        config: {
            ...DISCORD_TEMPLATE.config,
            ...data // ←ここでdataをconfigにまとめて入れる
        }
    };
};
export const TwitterTemplate = (data) => {
    return {
        ...TWITTER_TEMPLATE,
        config: {
            ...TWITTER_TEMPLATE.config,
            ...data // ←ここでdataをconfigにまとめて入れる
        }
    };
};
