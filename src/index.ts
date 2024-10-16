import { API } from 'homebridge';
import { PLATFORM_NAME } from './settings';
import { HueDaylightSyncPlatform } from './platform';

export = (api: API) => {
  console.log('homebridge-hue-daylight-sync is loading!');
  api.registerPlatform(PLATFORM_NAME, HueDaylightSyncPlatform);
};
