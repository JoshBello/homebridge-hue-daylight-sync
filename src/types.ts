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
  defaultAutoMode?: boolean;
  excludedLights?: string[];
  curveExponent?: number;
}

export interface QueueItem {
  lightId: string;
  lightName: string;
  kelvin: number;
  retries: number;
  lastError?: string;
}

export interface LightState {
  isOn: boolean;
  temperature: number;
}
