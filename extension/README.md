# DealDost Saver (Chrome extension)

Saves the profile you are looking at to your DealDost dashboard (`/admin`) in one click.
Works on Instagram, YouTube, X, LinkedIn and any website.

## Install (developer mode)

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick this `extension` folder.
3. Pin "DealDost Saver" from the puzzle icon.

## Connect it to your dashboard

1. Sign in to DealDost with an admin account (listed in `ADMIN_EMAILS`) and open `/admin`.
2. Under **Browser extension**, click **Make extension key**.
3. Click the extension, paste the **Server** and **Key**, and save.

## Use it

- **Popup:** open someone's profile, click the extension, add a note if you like, click **Save to dashboard**.
- **Right-click a link:** "Save link to DealDost" saves it without opening it (link only, no page details).
- **Right-click a page:** "Save this page to DealDost". A green ✓ on the icon means saved, a red ! means it failed.

Saving the same person again updates their details and keeps your status and notes.

## How it works

- It reads the page only when you click: titles, the profile header text, its links and visible posts.
- The server keeps only name, handle, bio, counts, links and recent post links. The raw page text is dropped.
- The key is stored in Chrome's local extension storage. Making a new key in the dashboard turns off the old one.
- Works with `localhost` and `*.hosted.app` out of the box. For another domain, Chrome asks for permission when you save settings.
