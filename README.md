# Emotional Support Pet

## Run
    npm install
    npm start

- Click the pink heart (drag it anywhere) to open **A moment together**, with a larger version of your selected pet.
- Choose **Take a breath** (three gentle cycles), **A little courage** (a personality-based message), or **A tiny break** (20 seconds). Pause, resume, or close with Escape at any time.
- Right-click the heart for **A moment together…**, **Pet settings…**, **Search dock**, updates, and Quit.
- Ctrl/Cmd + Shift + H opens a moment; Ctrl/Cmd + Shift + S focuses search.
- All pet scenes and activities work offline. AI chat remains optional.

## Choose your pet
Open **Pet settings… → Search Pet** and choose Wizard cat, Pomeranian, or Bamboo panda. The same selection and individual name are used for search, desktop walks, and support scenes. The old summon gallery and custom-character import have been retired; existing personal character files in app data are left untouched.

## Build installers
    npm install
    npm run dist:mac   # on a Mac  -> dist/*.dmg (Apple Silicon + Intel)
    npm run dist:win   # on Windows -> dist/*.exe (NSIS installer)

Or push the project to GitHub and run the "Build installers" workflow (Actions tab): it builds both and attaches them as artifacts.
Unsigned builds: macOS -> right-click the app -> Open the first time; Windows SmartScreen -> More info -> Run anyway.

## Sharing the Mac build with friends (unsigned)
The .dmg is intentionally not signed with a Developer ID. Friends: drag the app to Applications, then
right-click -> Open (first time only). If macOS says it is damaged, run in Terminal:
    xattr -cr "/Applications/Emotional Support Pet.app"

## Updates (GitHub Releases, public repo)
One-time setup:
1. Create a PUBLIC GitHub repo and put its owner name in src/update-config.json (owner, and repo name if different).
2. Push the project.

Release a new version:
    npm version patch        # bumps version + creates tag vX.Y.Z
    git push --follow-tags   # GitHub Actions builds mac + win and publishes the release

- Windows: the app checks on start, downloads in the background, asks to restart.
- macOS (unsigned): the app tells the user a new version exists and opens the download page; they replace the app with the new .dmg.
- Right-click the heart -> "Check for updates…" to check manually.

## Search dock
Toggle it in **Pet settings… → Search Pet**, or right-click the heart → **Search dock**. Enter opens a web search. Feed or play with your pet, release it for a desktop walk, or open ✦ for focus, hide-and-seek, gifts, and pack-away search.

## Checks
    node --test
    npm run check:support
    npm run check:activities
    npm run check:dock-stow

