# Sharing React state across tabs

- **Auteur** : Florian Cousin
- **Date** : 2024-07-21

## Statut

Developped

## Context

The goal is to have a simple way of sharing state between tabs with no more installation than the tools needed to run a React application locally.

## Possibilities

- write in a file
- use localStorage and keep the data in the localStorage indefinitely (until the user removes the browser cache)
- use localStorage and clean up data after every use

## Constraints

Writing in a file does not enable to register listener on content change, wheras localStorage enables it.

Keeping the data in the localStorage indefinitely has a simpler implementation but I wanted something as clean as possible for the browser.

It is not possible to clean localStorage at page shutdown.

## Choice

localStorage is used only to send data between tabs via localStorage onChange listener : a data is remove from localStorage right after it is added.

When a new tab wants to use the state, it emits a state initialisation on the specified key.
If no other tab is using the shared state, then nothing occurs.
If another tab is using the shared state, then it receives the initialisation event and sends back the current state it holds.
Finally, the initialising tab receives the shared state and updates its local one.

## Drawbacks

Let n be the number of tabs that are using the shared state.
When another tab appears and uses the shared state, then every existing tab sends its current state, so every existing tab rerender n-1 times.
