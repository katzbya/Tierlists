# Tier Lists

A mobile app (iOS & Android) for building your own tier lists. Create a
template by choosing how many tiers you want and what each one is called,
add your own photos, then drag-and-drop them into tiers to rank them.
Everything is stored locally on your device — no account, no internet needed.

## Features

- **Custom templates** — choose the number of tiers, name each one, and pick a
  color. Reorder, add, or remove tiers at any time.
- **Your own photos** — import images from your photo library into a pool.
- **Drag-and-drop ranking** — long-press a photo to lift it, then drag it into
  any tier, between tiers, or back to the pool.
- **Multiple lists** — create, edit, and delete as many tier lists as you like.
- **Offline & local** — tier lists and photos persist on-device between launches.

## Tech stack

- [Expo](https://expo.dev) (SDK 56) + React Native + TypeScript
- [expo-router](https://docs.expo.dev/router/introduction/) for navigation
- [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/)
  + [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/)
  for the custom cross-container drag-and-drop
- [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
  + [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/)
  for importing and persisting photos
- [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/)
  for saving tier-list data
- [zustand](https://github.com/pmndrs/zustand) for state management

## Getting started

```bash
npm install
npx expo start
```

Then open the app on your phone:

1. Install **Expo Go** from the App Store / Play Store.
2. Scan the QR code printed in the terminal.
3. The app loads on your device.

### Try it out

1. Tap **+ New tier list**.
2. Name it, then add/rename/recolor tiers (it starts with S/A/B/C/D).
3. Tap **Create & add photos**, then **+ Add photos** to import images.
4. **Long-press** a photo and drag it into a tier. Drag between tiers or back
   to the pool to rearrange.
5. Close and reopen the app — your list and photos are still there.

> A web preview (`npx expo start --web`) is handy for checking screens and
> navigation, but native drag-and-drop, photo import, and on-device persistence
> are best tested on a real device via Expo Go.

## Installing a standalone APK on Android

You can build a real, installable `.apk` (no Expo Go required) using
[EAS Build](https://docs.expo.dev/build/introduction/) — Expo's cloud build
service. No Android Studio or Mac needed.

1. Install the EAS CLI and log in with a free Expo account:
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. First time only, link the project (creates an EAS project id):
   ```bash
   eas init
   ```
3. Build the APK in the cloud (~10–15 min):
   ```bash
   eas build -p android --profile preview
   ```
4. When it finishes, EAS prints a **download link** and QR code. Open it on
   your Android phone, download the `.apk`, and tap it to install. You'll need
   to allow "Install unknown apps" for your browser the first time.

The `preview` and `production` profiles in `eas.json` are configured to output
an installable APK (the default Play Store build produces an `.aab`, which
can't be sideloaded directly).

## Project structure

```
app/                    # expo-router screens
  _layout.tsx           # providers, store hydration, navigation stack
  index.tsx             # Home: saved tier lists
  template/[id].tsx     # create/edit a template (tiers)
  editor/[id].tsx       # drag-and-drop ranking editor
src/
  components/           # UI: TierBoard, TierRow, ItemPool, DraggableItem, ...
  dnd/                  # drag controller + pure geometry helpers
  store/                # zustand store + AsyncStorage persistence
  storage/              # image import/persistence + metadata read/write
  theme/                # colors + default tier palette
  types/                # data model
```

## Scripts

- `npm start` — start the Expo dev server
- `npm run android` / `npm run ios` / `npm run web` — start on a platform
- `npm run typecheck` — TypeScript type-check
