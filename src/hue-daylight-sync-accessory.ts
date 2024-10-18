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

  constructor(private readonly platform: HueDaylightSyncPlatform, private readonly accessory: PlatformAccessory, private readonly config: Config) {
    this.temperatureCalculator = new TemperatureCalculator(config, platform.log);
    this.queueProcessor = new QueueProcessor(config, platform.log);
    this.autoModeService = new AutoModeService(platform, accessory, this.temperatureCalculator, config);

    this.lightService = new LightService(
      platform,
      accessory,
      this.temperatureCalculator,
      this.queueProcessor,
      () => this.autoModeService.disableAutoModeDueToManualChange(), // Callback
      config.inputDebounceDelay,
    );

    this.autoModeService.setLightService(this.lightService);
    setInterval(() => this.queueProcessor.processQueue(), 100);
  }
}
