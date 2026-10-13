const { owner, repo } = require('./src/update-config.json');

module.exports = {
  "appId": "com.example.emotionalsupportpet",
  "productName": "Emotional Support Pet",
  "directories": {
    "output": "dist",
    "buildResources": "build"
  },
  "files": [
    "src/**/*",
    "package.json"
  ],
  "mac": {
    "identity": "-",
    "hardenedRuntime": true,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist",
    "category": "public.app-category.lifestyle",
    "icon": "build/icon.png",
    "target": [
      {
        "target": "dmg",
        "arch": [
          "arm64",
          "x64"
        ]
      }
    ]
  },
  "win": {
    "icon": "build/icon.png",
    "target": [
      {
        "target": "nsis",
        "arch": [
          "x64"
        ]
      }
    ]
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true
  }
};

module.exports.publish = { provider: 'github', owner, repo, releaseType: 'release' };
