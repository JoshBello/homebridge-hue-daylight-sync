import axios from 'axios';
import https from 'https';
import { Logger } from 'homebridge';
import { Config, LightState, QueueItem } from './types';

export class QueueProcessor {
  private bridgeIp: string;
  private apiToken: string;
  private requestQueue: QueueItem[] = [];
  private isProcessingQueue = false;

  constructor(config: Config, private readonly log: Logger) {
    this.bridgeIp = config.bridgeIp;
    this.apiToken = config.apiToken;
  }

  async getLightState(): Promise<LightState> {
    if (!this.bridgeIp) {
      this.log.error('Cannot get light state: Hue Bridge IP is not set');
      throw new Error('Hue Bridge IP not set');
    }

    const url = `https://${this.bridgeIp}/clip/v2/resource/light`;
    const headers = { 'hue-application-key': this.apiToken };

    try {
      const response = await axios.get(url, {
        headers,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      });

      if (response.status === 200) {
        const lights = response.data.data as Record<string, unknown>[];
        if (lights.length > 0) {
          const firstLight = lights[0];
          const isOn = (firstLight.on as { on: boolean })?.on ?? false;
          const colorTemp = (firstLight.color_temperature as { mirek: number })?.mirek;
          if (colorTemp) {
            const kelvin = Math.round(1000000 / colorTemp);
            this.log.debug(`Light state - On: ${isOn}, Temperature: ${kelvin}K`);
            return { isOn, temperature: kelvin };
          }
        }
        throw new Error('No lights found or no color temperature data available');
      } else {
        throw new Error(`Failed to get lights: ${response.status}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.log.error(`Error fetching light state: ${error.message}`);
      } else {
        this.log.error('Unknown error fetching light state');
      }
      throw error;
    }
  }

  async updateLightsColor(targetTemp: number) {
    if (!this.bridgeIp) {
      this.log.error('Cannot update lights: Hue Bridge IP is not set');
      return;
    }

    const url = `https://${this.bridgeIp}/clip/v2/resource/light`;
    const headers = { 'hue-application-key': this.apiToken };

    try {
      const response = await axios.get(url, {
        headers,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      });

      if (response.status === 200) {
        const lights = response.data.data as Record<string, unknown>[];
        for (const light of lights) {
          const lightId = light.id as string;
          const lightName = ((light.metadata as Record<string, unknown>)?.name as string) || 'Unknown';
          this.queueLightUpdate(lightId, lightName, targetTemp);
        }
      } else {
        this.log.error(`Failed to get lights: ${response.status}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.log.error(`Error fetching lights: ${error.message}`);
      } else {
        this.log.error('Unknown error fetching lights');
      }
    }
  }

  private queueLightUpdate(lightId: string, lightName: string, kelvin: number) {
    this.requestQueue.push({ lightId, lightName, kelvin });
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const item = this.requestQueue.shift();

    if (item) {
      try {
        await this.changeLightSettings(item.lightId, item.lightName, item.kelvin);
      } catch (error) {
        this.log.error(`Error processing queue item: ${error}`);
        // Optionally, re-queue the failed item
        // this.requestQueue.unshift(item);
      }
    }

    this.isProcessingQueue = false;
  }

  private async changeLightSettings(lightId: string, lightName: string, kelvin: number) {
    const url = `https://${this.bridgeIp}/clip/v2/resource/light/${lightId}`;
    const headers = { 'hue-application-key': this.apiToken };
    const mirek = Math.round(1000000 / kelvin);

    const data = { color_temperature: { mirek } };

    try {
      const response = await axios.put(url, data, {
        headers,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      });
      if (response.status === 200) {
        this.log.info(`${lightName} has been updated to ${kelvin}K`);
      } else {
        this.log.error(`Failed to change ${lightName}: ${response.status}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        this.log.warn(`Rate limit hit for ${lightName}, re-queueing`);
        this.queueLightUpdate(lightId, lightName, kelvin);
      } else if (error instanceof Error) {
        this.log.error(`Error updating ${lightName}: ${error.message}`);
      } else {
        this.log.error(`Unknown error updating ${lightName}`);
      }
    }
  }
}
