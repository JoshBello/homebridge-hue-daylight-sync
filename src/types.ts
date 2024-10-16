import { PlatformConfig } from 'homebridge';

export interface Config extends PlatformConfig {
  bridgeIp: string;
  apiToken: string;
  latitude: number;
  longitude: number;
  updateInterval?: number;
  warmTemp?: number;
  coolTemp?: number;
  inputDebounceDelay?: number;
}

export interface QueueItem {
  lightId: string;
  lightName: string;
  kelvin: number;
}

export interface LightState {
  isOn: boolean;
  temperature: number;
}
