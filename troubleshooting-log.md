# VS Code Flashing Troubleshooting Log
**Date:** October 10, 2025  
**Project:** c:\xampp\htdocs\fileIO2025

---

## Original Issue
- VS Code window was **flashing/pulsing** when editing code with `$$` variable syntax
- Flashing would **stop** when changing `$$` to `$`
- Flashing occurred when focused on code editor, but NOT when focused on chat
- No errors visible in Problems panel (`Ctrl+Shift+M`)

---

## What We Discovered

### Installed PHP Extensions
```
bmewburn.vscode-intelephense-client (PHP Intelephense)
neilbrayfield.php-docblocker
valeryanm.vscode-phpsab (PHP Sniffer & Beautifier) - installed during troubleshooting
xdebug.php-debug
xdebug.php-pack
zobo.php-intellisense
```

### User-Level Settings Found
Located in: `C:\Users\fatte\AppData\Roaming\Code\User\settings.json`

```json
"php.validate.executablePath": "C:\\xampp\\php\\php.exe",
"php.debug.executablePath": "C:\\xampp\\php\\php.exe",
"[php]": {
    "editor.defaultFormatter": "bmewburn.vscode-intelephense-client"
}
```

### The `$$` Variable Issue
**File:** `readexternal.php`  
**Lines 15 & 29:** Had `$$downloadedContent` and `$$handle`

**Technical Explanation:**
- `$$variable` is valid PHP syntax (variable variables)
- When `$downloadedContent = "/downloaded-content.html"`, then `$$downloadedContent` tries to access `${"/downloaded-content.html"}` which doesn't exist
- Causes: "Undefined variable" warnings at runtime
- Static analyzers (Intelephense) don't flag this as an error because it's syntactically valid

---

## Settings & Files We Created (ALL REMOVED)

### 1. `.vscode/settings.json` (Created, then deleted)

**First Version - Verbose Logging:**
```json
{
  "intelephense.trace.server": "verbose",
  "php.validate.enable": true,
  "php.validate.run": "onType",
  "problems.showCurrentInStatus": true
}
```
- **Result:** Too verbose output, no flashing

**Second Version - Diagnostics Focus:**
```json
{
  "intelephense.trace.server": "off",
  "intelephense.diagnostics.enable": true,
  "intelephense.diagnostics.run": "onType",
  "intelephense.diagnostics.undefinedVariables": true,
  "intelephense.diagnostics.undefinedFunctions": true,
  "intelephense.diagnostics.undefinedConstants": true,
  "intelephense.diagnostics.undefinedTypes": true,
  "intelephense.diagnostics.undefinedProperties": true,
  "intelephense.diagnostics.undefinedMethods": true,
  "intelephense.diagnostics.unusedSymbols": true,
  "intelephense.diagnostics.typeErrors": true,
  "intelephense.diagnostics.argumentCount": true,
  "intelephense.diagnostics.deprecated": true,
  "php.validate.enable": true,
  "php.validate.run": "onType",
  "php.validate.executablePath": "C:\\xampp\\php\\php.exe",
  "php.executablePath": "C:\\xampp\\php\\php.exe",
  "problems.showCurrentInStatus": true,
  "problems.decorations.enabled": true
}
```
- **Result:** No flashing, started flashing during reload but stopped after

**Third Version - Added PHP Sniffer:**
```json
{
  // ... previous settings ...
  "phpsab.executablePathCS": "C:\\xampp\\php\\phpcs.bat",
  "phpsab.snifferEnable": true,
  "phpsab.snifferMode": "onType",
  "phpsab.snifferShowSources": true,
  "php.suggest.basic": false
}
```
- **Result:** No flashing

### 2. `.vscode/tasks.json` (Created, then deleted)
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "PHP Lint Check with Warnings",
      "type": "shell",
      "command": "php",
      "args": [
        "-d", "display_errors=1",
        "-d", "error_reporting=E_ALL",
        "-l",
        "${file}"
      ],
      "problemMatcher": {
        "owner": "php",
        "fileLocation": ["relative", "${workspaceFolder}"],
        "pattern": {
          "regexp": "^(?:Parse|Fatal) error:\\s+(.*)\\s+in\\s+(.*)\\s+on line\\s+(\\d+)",
          "message": 1,
          "file": 2,
          "line": 3
        }
      },
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    }
  ]
}
```

---

## Commands We Ran

### PHP Validation Commands
```powershell
# Check syntax
php -l c:\xampp\htdocs\fileIO2025\readexternal.php

# Check with full error reporting (showed the undefined variable warnings)
php -d display_errors=1 -d error_reporting=E_ALL c:\xampp\htdocs\fileIO2025\readexternal.php
```

**Output from full error reporting:**
```
PHP Warning:  Undefined variable $\downloaded-content.html in readexternal.php on line 15
PHP Deprecated:  fopen(): Passing null to parameter #1 ($filename) of type string is deprecated
PHP Fatal error:  Uncaught ValueError: Path cannot be empty
```

### Extension Check
```powershell
code --list-extensions | Select-String -Pattern "php"
```

---

## What We Tried

1. ✅ **Checked Problems panel** (`Ctrl+Shift+M`) - No errors shown
2. ✅ **Checked Output panel** (`Ctrl+Shift+U`) - Selected "Intelephense"
3. ✅ **Enabled verbose Intelephense logging** - Too much output, no actionable warnings
4. ✅ **Configured all Intelephense diagnostics** - Didn't catch `$$` issue (valid syntax)
5. ✅ **Configured PHP built-in validator** - Only catches syntax errors, not logic issues
6. ✅ **Added PHP Sniffer extension** - Didn't trigger flashing
7. ✅ **Created task for manual PHP lint** - Works but manual
8. ✅ **Deleted all workspace settings** - Returned to original state
9. ✅ **Reloaded VS Code multiple times** - No consistent flashing behavior

---

## Recommended Settings for Future (Not Applied)

If you want to catch similar issues, consider these Code Lens settings in VS Code settings UI:

- ☑️ **Intelephense > Code Lens > References: Enable** - Shows reference count for variables/functions
- ☑️ **Intelephense > Code Lens > Usages: Enable** - Shows usage count

These help spot variables that are defined but never properly used.

---

## Alternative Detection Methods

### Option 1: Manual PHP Check (Always Works)
```powershell
php -d display_errors=1 -d error_reporting=E_ALL yourfile.php
```

### Option 2: Use PHP CodeSniffer with PSR Standards
```powershell
phpcs --standard=PSR12 yourfile.php
```

### Option 3: Use PHPStan (Static Analysis)
Install globally:
```powershell
composer global require phpstan/phpstan
phpstan analyse yourfile.php
```

---

## Conclusion

**Mystery Unsolved:** The original flashing behavior did not return after:
- Removing all workspace settings
- Reloading VS Code multiple times
- Restoring original user-level configuration

**Possible Original Causes:**
1. **Temporary notification from running the script** - PHP warnings triggered Windows notification that flashed taskbar
2. **zobo.php-intellisense extension behavior** - May have been doing runtime validation that's no longer active
3. **Xdebug notifications** - Debug extension may have been catching issues
4. **Windows Focus Assist** - Settings may have changed
5. **VS Code update** - Notification behavior may have changed between sessions

**The `$$` syntax is valid PHP** so static analyzers won't flag it as an error. Only runtime execution or very strict linting tools will catch the undefined variable issue.

---

## Files Modified During Troubleshooting

1. ✅ `index.php` - Fixed `if($handle = false)` to `if($handle === false)` on line 7
2. ℹ️ `readexternal.php` - User edited during session (removed/added `$$` for testing)
3. ✅ `.vscode/settings.json` - Created and deleted
4. ✅ `.vscode/tasks.json` - Created and deleted
5. ✅ `.vscode/` directory - Removed completely

**Current State:** All troubleshooting files removed, back to original configuration.

---

## Where to Find Flashing/Notification Sources

### In VS Code:
1. **Problems Panel** - `Ctrl+Shift+M`
2. **Output Panel** - `Ctrl+Shift+U` → Select source from dropdown
3. **Notification Center** - 🔔 Bell icon (bottom-right)
4. **Status Bar** - Check for badges/warnings (bottom-left and bottom-right)
5. **Activity Bar** - Check for orange/red badges on icons (left sidebar)

### In Windows:
1. **Action Center** - `Win+A` to see recent notifications
2. **Focus Assist Settings** - Control when apps can flash taskbar
3. **Notification Settings** - Per-app notification permissions

---

## Useful VS Code Commands

- `Ctrl+Shift+M` - Open Problems panel
- `Ctrl+Shift+U` - Open Output panel
- `Ctrl+Shift+P` - Command Palette
- `Ctrl+,` - Open Settings
- Reload Window command: `workbench.action.reloadWindow`

---

**End of Log**
