# Emotional Support Pet

## Run
    npm install
    npm start

- Click the pink heart (drag it anywhere) -> your character peeks up from the bottom of the screen.
- Right-click the heart -> "Choose character…", "Summon now", "Quit".
- Global shortcut: Ctrl/Cmd + Shift + H.

## Add your own characters
Right-click heart -> Choose character… -> "Open my characters folder", drop in .gif / .png / .webp / .svg / Lottie .json.
Folder location:
- macOS:   ~/Library/Application Support/Emotional Support Pet/characters
- Windows: %APPDATA%\Emotional Support Pet\characters

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

## Built-in extra characters
Drop files into `src/characters/` (gif/png/webp/svg/Lottie json) and rebuild the installer; they ship with the app under "More characters".

## Updates (GitHub Releases, public repo)
One-time setup:
1. Create a PUBLIC GitHub repo and put its owner name in package.json -> build.publish.owner (and repo name if different).
2. Push the project.

Release a new version:
    npm version patch        # bumps version + creates tag vX.Y.Z
    git push --follow-tags   # GitHub Actions builds mac + win and publishes the release

- Windows: the app checks on start, downloads in the background, asks to restart.
- macOS (unsigned): the app tells the user a new version exists and opens the download page; they replace the app with the new .dmg.
- Right-click the heart -> "Check for updates…" to check manually.
