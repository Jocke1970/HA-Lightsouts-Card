# HA Lightsouts Card 🏁

A customizable Home Assistant dashboard card for [Lightsouts Motorsport Calendar](https://github.com/mm98/ha-lightsouts-motorsport-calendar).

Display the next motorsport sessions with countdowns, race-weekend schedules and a multi-series overview.

![Lightsouts integration icon](https://raw.githubusercontent.com/mm98/ha-lightsouts-motorsport-calendar/main/custom_components/lightsouts/brand/icon.png)

*Icon from the source integration. Screenshots of HA Lightsouts Card will be added separately.*

## Features

- **Series Card:** countdown in days, hours and minutes, event and circuit information, country flag, and series-specific styling
- **Motorsport Overview:** upcoming sessions from multiple series, in a vertical list or a responsive two-column grid
- **Weekend schedule:** expand the schedule for a selected event, including past sessions when the calendar retains them
- **Configurable long press:** navigate from an individual Series Card to another Home Assistant dashboard view
- **Visual editor:** configure series, calendar, language, view and layout
- **Languages:** English, Spanish and Swedish; automatic language selection based on Home Assistant
- **Responsive layout:** suitable for desktop and mobile dashboards
- **WRC support:** date-only and multi-day calendar events

Session status is inferred from the published schedule, not from live telemetry.

## Requirements

Install [Lightsouts Motorsport Calendar](https://github.com/mm98/ha-lightsouts-motorsport-calendar) in Home Assistant and enable the motorsport series you want to follow.

## Installation

Install **HA Lightsouts Card** from Home Assistant Marketplace as an **Instrumentpanel / Dashboard** repository.

Marketplace normally registers the JavaScript module automatically. If adding the card fails, check **Settings → Dashboards → Resources** for the installed resource before manually adding another one.

After installation, add a **Custom: Motorsport Card** using the visual editor, or use YAML as shown below.

### Series Card

```yaml
type: custom:motorsport-card
calendar_entity: auto
view: series
series: F1
language: auto
hold_action:
  action: navigate
  navigation_path: /lovelace/f1-sensor
```

Replace the example navigation path with the actual URL path of your Home Assistant view.

### Motorsport Overview

```yaml
type: custom:motorsport-card
calendar_entity: auto
view: overview
overview_layout: grid
max_series: 12
days_ahead: 120
language: auto
```

Set `overview_layout: list` for the vertical layout. The default calendar setting, `auto`, detects a unique Lightsouts calendar even if its entity ID is customized.

Additional examples are available in the [examples folder](examples/).

## Language

Supported options are `auto`, `en`, `es` and `sv`. Set `language: auto` to use Home Assistant's configured language. Unsupported locales fall back to English.

The translation catalogs are available in [translations/](translations/) so contributors can propose additional languages. Translation data is bundled into `dist/motorsport-card.js` for installation.

Series, event and circuit names are taken from Lightsouts; common session labels and card controls are translated.

## Notes

Completed sessions appear only when they remain available in the Lightsouts calendar. Weather, live timing, race results and standings are not provided by this card.

## Credits

Uses calendar data from [Lightsouts Motorsport Calendar](https://github.com/mm98/ha-lightsouts-motorsport-calendar). This is an independent dashboard card.

## License

MIT. See [LICENSE](LICENSE).
