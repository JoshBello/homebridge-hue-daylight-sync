export interface Config {
  bridgeIp: string;
  apiToken: string;
  latitude: number;
  longitude: number;
  updateInterval?: number;
  warmTemp?: number;
  coolTemp?: number;
}

export interface QueueItem {
  lightId: string;
  lightName: string;
  kelvin: number;
}
