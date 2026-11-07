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

## Development checkpoint: 2026-11-07
- Fixed a major interaction bug: countdown updates its numeric cells without rebuilding the entire card every second.
- Added per-calendar request deduplication and a 5-minute in-memory cache shared by card instances.
- Added the built-in Lovelace visual editor for calendar entity, series, compact mode, refresh interval and hold navigation.
- Increased default calendar horizon to 120 days for distant WRC events.
- Added date-only (all-day) calendar parsing in browser-local time.
- Added Node regression tests in `tests/card.test.cjs`. Run with `node --test tests/card.test.cjs`.

### Validation
JS parsed successfully in V8 and MotoGP / F1 Academy / WRC sample normalization was exercised manually. Node tests and actual Home Assistant rendering have **not yet been run** in an HA environment. No beta published.

### Pending before beta
- Validate service-response shape against a live HA installation.
- Exercise pointer/long-press on mobile and desktop.
- Improve loading/empty/error handling and document the actual F1 Sensor dashboard path.
- Add accessibility and multi-language polish.
