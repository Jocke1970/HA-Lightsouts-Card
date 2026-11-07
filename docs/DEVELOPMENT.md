# Development preview

## Branch policy
- `dev`: work in progress; **never installed as the HA update source**
- `beta`: tested preview builds (HACS beta installs)
- `main`: stable releases after successful beta testing

## Current functionality
- Reads events from a Lightsouts calendar through `calendar.get_events`
- Groups by series and event using calendar title/description
- Countdown, session schedule, circuit and country
- Basic colors for popular series, responsive compact mode
- Tap to expand; hold (650 ms) to navigate to a configured dashboard view

## Example
```yaml
type: custom:motorsport-card
calendar_entity: calendar.externa_sensorer_lightsouts
series: F1
hold_action:
  action: navigate
  navigation_path: /lovelace/f1-sensor
```

The dashboard path is an example. Use the actual dashboard URL path shown by Home Assistant.

## Notes and known limitations
- Initial development only: not yet validated in Home Assistant or HACS
- `calendar.get_events` returns a calendar response; events are not live race telemetry
- Future: shared fetching across instances, full card editor, translation files, WRC multi-day handling, robust refresh logic, richer styling and session filters
- No release/tag should be created until HA beta validation
