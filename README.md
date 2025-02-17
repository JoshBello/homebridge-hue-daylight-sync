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
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

</span>

## Hue Daylight Sync: Automated Philips Hue Light Adjustment for Natural Daylight Cycles

Hue Daylight Sync is a Homebridge plugin that automatically adjusts your Philips Hue lights based on the natural daylight cycle. It calculates the ideal color temperature throughout the day based on your geographical location and smoothly transitions your lights to match.

## Demo

<img src="demo.gif" height="400px">  

## Features

- Natural Bell Curve Color Temperature Transitions
- Smooth, Gradual Changes: The plugin now uses a cosine function to create a smooth, bell-shaped curve for color temperature transitions throughout the day.
- Enhanced Natural Lighting: Mimics the natural progression of daylight, providing a more comfortable and realistic lighting environment.
- Automatic color temperature adjustment based on time of day
- Customizable warm and cool temperature ranges
- Geolocation-based calculations for accurate sunlight mimicking
- Manual override option with automatic mode switch
- Exclude specific lights from automatic adjustments
- Smart retry mechanism for reliable updates

## Auto Mode and Manual Adjustments

- **Auto Mode**: Automatically adjusts your lights' color temperature based on the time of day. Enabled by default.
- **Manual Adjustments**: Changing the brightness slider or color temperature in the Home app will disable Auto Mode, allowing you to set your preferred lighting.
- **Re-Enabling Auto Mode**: To resume automatic adjustments, simply toggle the "Auto Mode" switch back on in the Home app.
- **Excluded Lights**: Specify lights that should never be automatically adjusted, perfect for accent lighting or areas where you want consistent color temperature.

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
      "latitude": 51.5072,  // Replace with your latitude
      "longitude": 0.1276,  // Replace with your longitude
      "warmTemp": 2700,
      "coolTemp": 3000,
      "curveExponent": 3,
      "updateInterval": 300000,
      "inputDebounceDelay": 750,
      "defaultAutoMode": true,
      "excludedLights": []  // Array of light IDs to exclude from auto adjustments
    }
  ]
}
```

### Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `bridgeIp` | `string` | The IP address of your Hue Bridge | Required |
| `apiToken` | `string` | Your Hue API token | Required |
| `latitude` | `number` | Your geographical decimal degrees latitude. Example: 51.5072 for London, but use your location's coordinates | Required |
| `longitude` | `number` | Your geographical decimal degrees longitude. Example: 0.1276 for London, but use your location's coordinates | Required |
| `warmTemp` | `number` | Warmest color temperature in Kelvin | 2700 |
| `coolTemp` | `number` | Coolest color temperature in Kelvin | 3000 |
| `curveExponent` | `number` | Adjusts the steepness of the transition curve | 3 |
| `updateInterval` | `number` | Interval in milliseconds between temperature updates | 300000 (5 minutes) |
| `inputDebounceDelay` | `number` | Delay in milliseconds to prevent rapid successive updates | 750 |
| `defaultAutoMode` | `boolean` | Enable Auto Mode by default | true |
| `excludedLights` | `string[]` | Array of light IDs to exclude from automatic adjustments | [] |

**Note**: For `latitude` and `longitude`, you must enter the coordinates for your specific location. The values shown in the example are for London, UK - make sure to replace these with your own coordinates.

You can find your coordinates using online services like Google Maps or websites like https://www.latlong.net/

### Excluding Lights

To exclude specific lights from automatic adjustments:

1. Find the light ID from your Hue Bridge (using the Hue API or developer tools)
2. Add the light ID to the `excludedLights` array in your config
3. Excluded lights will maintain their manual settings and won't be affected by the daylight sync

Example configuration with excluded lights:
```json
{
  "excludedLights": ["light1", "light2"]
}
```

## Usage

Once installed and configured, the plugin will appear in your Home app as a light accessory with an additional switch for the Auto Mode.

- Toggle the main switch to turn the Daylight Sync on or off.
- Use the brightness slider to manually adjust the color temperature.
- Toggle the Auto Mode switch to enable or disable automatic temperature adjustments.
- Excluded lights will maintain their manual settings regardless of Auto Mode status.

When Auto Mode is enabled, the plugin will automatically adjust your Hue lights' color temperature throughout the day to match natural daylight patterns.

## Troubleshooting

If you encounter any issues:

1. Check your Homebridge logs for any error messages.
2. Ensure your Hue Bridge IP and API token are correct.
3. Verify that your latitude and longitude are set correctly.
4. Make sure your Hue lights support color temperature adjustments.
5. Verify that excluded light IDs are correct if using that feature.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgements

- [Homebridge](https://homebridge.io/) for making this integration possible.
- [Philips Hue](https://www.philips-hue.com/) for their smart lighting system and API.