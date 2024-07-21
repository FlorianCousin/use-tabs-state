# use-tabs-state

## Description

Hook for React state that is shared through all tabs.

## Installation

`npm install @florian-cousin/use-tabs-state`

## Implementation

localStorage and events on localStorage change are used to synchronise state across all tabs of a browser.

### Events

Each state listens to

- an initialisation event (i.e. a new tab using the shared state)
- a data change event

When a tab recieves an initialisation event, it sends its current local state.
When a tab recieves a data change event, it changes its current state via `setState` (it triggers a rerender).

When a tab changes its local state, it emits a data change event.

When a tab initialise the state for the first time, it emits an initialisation event.
