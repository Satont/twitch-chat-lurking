// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
import Express from 'express';
import got from 'got';
import { promises as fs } from 'fs';

const app = Express();

console.info(
  `For generate code follow that url: https://id.twitch.tv/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=http://localhost:3000&response_type=code&scope=chat:read+chat:edit`,
);

app.get('/', async (req, res) => {
  const code = req.query.code;
  const response = await got
    .post(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=http://localhost:3000`,
    )
    .json<Record<string, any>>();

  res.send('Ok');
  const newTokenData = {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
  };
  await fs.writeFile('./tokens.json', JSON.stringify(newTokenData, null, 4), 'utf-8');
  console.log('Now you can start application');
  process.exit();
});

app.listen(process.env.PORT || 3000);
