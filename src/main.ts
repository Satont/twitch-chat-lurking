// eslint-disable-next-line @typescript-eslint/no-var-requires
import dotenv from 'dotenv';
dotenv.config();

import { ApiClient } from 'twitch';
import { RefreshableAuthProvider, StaticAuthProvider } from 'twitch-auth';
import { ChatClient } from 'twitch-chat-client';
import { promises as fs } from 'fs';

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const tokenData = JSON.parse(await fs.readFile('./tokens.json', 'utf-8'));
const auth = new RefreshableAuthProvider(new StaticAuthProvider(clientId, tokenData.accessToken), {
  clientSecret,
  refreshToken: tokenData.refreshToken,
  expiry: tokenData.expiryTimestamp === null ? null : new Date(tokenData.expiryTimestamp),
  onRefresh: async ({ accessToken, refreshToken }) => {
    const newTokenData = {
      accessToken,
      refreshToken,
    };
    await fs.writeFile('./tokens.json', JSON.stringify(newTokenData, null, 4), 'utf-8');
  },
});

const apiClient = new ApiClient({
  authProvider: auth,
});

const getFollowedChannels = async () => {
  return (await (await apiClient.helix.users.getMe()).getFollows()).data;
};

const chatClient = new ChatClient(auth, { channels: (await getFollowedChannels()).map((c) => c.followedUserName) });
await chatClient.connect();

chatClient.onJoin((channel) => console.info(`Joined ${channel}`));

setInterval(async () => {
  (await getFollowedChannels()).forEach((c) => chatClient.join(c.followedUserName));
}, 10 * 60 * 1000);

process.on('unhandledRejection', (r) => console.error(r));
