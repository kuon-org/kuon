import { DISCORD_TEMPLATE, TWITTER_TEMPLATE } from "../../init";

interface OAuthConf {
    provider_name: string;
    client_id: string;
    cleint_secret: string;
}


export const DiscordTemplate = (data: OAuthConf) => {
    return {
        ...DISCORD_TEMPLATE,
        config: {
            ...DISCORD_TEMPLATE.config,
            ...data  // ←ここでdataをconfigにまとめて入れる
        }
    }
}


export const TwitterTemplate = (data: OAuthConf) => {
    return {
        ...TWITTER_TEMPLATE,
        config: {
            ...TWITTER_TEMPLATE.config,
            ...data  // ←ここでdataをconfigにまとめて入れる
        }
    }
}