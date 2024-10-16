import { PlatformAccessory } from 'homebridge';
import { HueDaylightSyncPlatform } from './platform';
import { LightService } from './light-service';
import { AutoModeService } from './auto-mode-service';
import { TemperatureCalculator } from './temperature-calculator';
import { QueueProcessor } from './queue-processor';
import { Config } from './types';

export class HueDaylightSyncAccessory {
  private lightService: LightService;
  private autoModeService: AutoModeService;
  private temperatureCalculator: TemperatureCalculator;
  private queueProcessor: QueueProcessor;

  constructor(private readonly platform: HueDaylightSyncPlatform, private readonly accessory: PlatformAccessory) {
    const config: Config = this.accessory.context.device;

    this.temperatureCalculator = new TemperatureCalculator(config, platform.log);
    this.queueProcessor = new QueueProcessor(config, platform.log);

    this.lightService = new LightService(platform, accessory, this.temperatureCalculator, this.queueProcessor);

    this.autoModeService = new AutoModeService(platform, accessory, this.lightService, this.temperatureCalculator, this.updateTemperature.bind(this));

    // Start processing the queue
    setInterval(() => this.queueProcessor.processQueue(), 100);
  }

  private async updateTemperature() {
    const newTemp = await this.temperatureCalculator.calculateIdealTemp();
    const currentTemp = this.lightService.getCurrentTemp();

    if (newTemp !== currentTemp) {
      this.platform.log.debug(`Updating temperature from ${currentTemp}K to ${newTemp}K`);
      this.lightService.updateTemperature(newTemp);
    } else {
      this.platform.log.debug(`Temperature remains unchanged at ${currentTemp}K`);
    }
  }
}
