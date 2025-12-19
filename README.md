# The Great Suspender Recovery Tool

> Recover your lost Great Suspender tabs!

![screenshot](artwork/screenshot-list.png)

This tool helps you recover tabs that were suspended by the now-removed "The Great Suspender" extension. It searches your browser history for suspended tab URLs and presents them in a user-friendly interface.

## Features

- **View suspended tabs:** See a list or table of all your suspended tabs.
- **Group and sort:** Organize your tabs by domain or date, and sort them by date, title, or number of visits.
- **Copy to clipboard:** Copy your tab URLs to the clipboard for easy sharing or manual backup.
- **Bookmark all tabs:** Create a new bookmark folder containing all your recovered tabs.

## How to use

1. **Build the extension:**
   ```bash
   npm run build
   ```
2. **Load the extension in Chrome:**
   - Go to `chrome://extensions`.
   - Enable "Developer mode".
   - Click "Load unpacked" and select the `react-app/build` folder.
3. **Run the extension:**
   - Click the extension icon in your Chrome toolbar to open the recovery tool.
4. **Recover your tabs:**
   - Use the options to group and sort your tabs as needed.
   - Click "Copy URLs" to copy the tab URLs to your clipboard.
   - Click "Bookmark All" to save all your tabs to a new bookmark folder.
