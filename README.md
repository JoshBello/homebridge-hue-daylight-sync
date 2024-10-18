<p align="center">
  <img src="homebridge-hue.png" height="200px">  
</p>
<span align="center">

# Hue Daylight Sync

[![npm version](https://img.shields.io/npm/v/homebridge-hue-daylight-sync
)](https://badge.fury.io/js/homebridge-hue-daylight-sync)
[![npm downloads](https://img.shields.io/npm/d18m/homebridge-hue-daylight-sync.svg)](https://www.npmjs.com/package/homebridge-hue-daylight-sync)
[![GitHub Issues](https://img.shields.io/github/issues/JoshBello/homebridge-hue-daylight-sync)](https://github.com/JoshBello/homebridge-hue-daylight-sync/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/JoshBello/homebridge-hue-daylight-sync/open)](https://github.com/JoshBello/homebridge-hue-daylight-sync/pulls)

</span>

## Hue Daylight Sync: Automated Philips Hue Light Adjustment for Natural Daylight Cycles

Hue Daylight Sync is a Homebridge plugin that automatically adjusts your Philips Hue lights based on the natural daylight cycle. It calculates the ideal color temperature throughout the day based on your geographical location and smoothly transitions your lights to match.

## Features

- Natural Bell Curve Color Temperature Transitions
- Smooth, Gradual Changes: The plugin now uses a cosine function to create a smooth, bell-shaped curve for color temperature transitions throughout the day.
- Enhanced Natural Lighting: Mimics the natural progression of daylight, providing a more comfortable and realistic lighting environment.
- Automatic color temperature adjustment based on time of day
- Customizable warm and cool temperature ranges
- Geolocation-based calculations for accurate sunlight mimicking
- Manual override option with automatic mode switch

## Auto Mode and Manual Adjustments

- **Auto Mode**: Automatically adjusts your lights' color temperature based on the time of day. Enabled by default.
- **Manual Adjustments**: Changing the brightness slider or color temperature in the Home app will disable Auto Mode, allowing you to set your preferred lighting.
- **Re-Enabling Auto Mode**: To resume automatic adjustments, simply toggle the "Auto Mode" switch back on in the Home app.

## Prerequisites

- [Homebridge](https://homebridge.io/) installed on your system
- Philips Hue Bridge with API access - [Hue Guide](https://developers.meethue.com/develop/hue-api-v2/getting-started/#follow-3-easy-steps)
- Philips Hue color temperature capable lights

## Installation

1. Install the plugin through Homebridge UI or manually:

```bash
npm install -g homebridge-hue-daylight-sync
```

2. Configure the plugin in your Homebridge `config.json` or through the Homebridge UI.

## Configuration

Add the following to your Homebridge `config.json` file:

```json
{
  "platforms": [
    {
      "platform": "HueDaylightSync",
      "name": "Hue Daylight Sync",
      "bridgeIp": "YOUR_HUE_BRIDGE_IP",
      "apiToken": "YOUR_HUE_API_TOKEN",
      "latitude": "YOUR_LATITUDE",
      "longitude": "YOUR_LONGITUDE",
      "warmTemp": 2700,
      "coolTemp": 3000,
      "updateInterval": 300000,
      "inputDebounceDelay": 750,
      "defaultAutoMode" : true
    }
  ]
}
```

### Configuration Options

- `bridgeIp` The IP address of your Hue Bridge
- `apiToken` Your Hue API token
- `latitude` Your geographical latitude
- `longitude` Your geographical longitude
- `warmTemp`  Warmest color temperature in Kelvin (default 2700K)
- `coolTemp`  Coolest color temperature in Kelvin (default 3000K)
- `updateInterval` Interval in milliseconds between temperature updates (default 300000 - 5 minutes)
- `inputDebounceDelay` Prevents rapid, successive updates when adjusting the brightness slider or color temperature (default 750ms)
- `defaultAutoMode` Set to true to enable Auto Mode by default, false to disable (default true)

## Usage

Once installed and configured, the plugin will appear in your Home app as a light accessory with an additional switch for the Auto Mode.

- Toggle the main switch to turn the Daylight Sync on or off.
- Use the brightness slider to manually adjust the color temperature.
- Toggle the Auto Mode switch to enable or disable automatic temperature adjustments.

When Auto Mode is enabled, the plugin will automatically adjust your Hue lights' color temperature throughout the day to match natural daylight patterns.

## Troubleshooting

If you encounter any issues:

1. Check your Homebridge logs for any error messages.
2. Ensure your Hue Bridge IP and API token are correct.
3. Verify that your latitude and longitude are set correctly.
4. Make sure your Hue lights support color temperature adjustments.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgements

- [Homebridge](https://homebridge.io/) for making this integration possible.
- [Philips Hue](https://www.philips-hue.com/) for their smart lighting system and API.