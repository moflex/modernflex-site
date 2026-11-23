# MODERNFLEX website

The culture. Unfiltered. This is the code and content for modernflex.co.uk.

The site is plain HTML generated from simple text files, with no frameworks or packages to keep up to date. Netlify rebuilds and publishes it every time something changes on GitHub.

## Where things live

| Folder | What's in it |
|---|---|
| `content/stories/` | One `.md` file per story. The file name becomes its web address. |
| `content/episodes/` | One `.md` file per MFTV episode. |
| `content/pages/about.md` | The About page text. |
| `content/settings.json` | Contact email, social links, homepage picks, newsletter, community lists. |
| `public/uploads/` | Photos uploaded through the editor. |
| `src/` | Design (`site.css`), behaviour (`site.js`), drawn plates and the Markdown reader. |
| `build.mjs` | Turns all of the above into the finished site in `dist/`. |

## Three ways to change the site

1. **Ask Claude.** Describe the change in chat. Claude edits the files and commits to GitHub, and Netlify publishes it in a minute or two.
2. **Use the editor.** Go to [app.pagescms.org](https://app.pagescms.org), sign in with GitHub and open this repository. You get forms for stories, episodes, the About page and site settings, with photo uploads. Saving publishes.
3. **Edit files directly** on GitHub, or locally followed by a push.

### Writing a story

Each story has a headline, section, format, location tag, date, standfirst and body. In the body:

- Leave an empty line between paragraphs.
- Start a line with `>` to make a big pull quote.
- Use `## Heading` for a subheading, `**bold**` and `*italic*` for emphasis, and `[text](https://link)` for links.
- Use `![Caption](/uploads/photo.jpg)` to place a photo in the story.

If a story has no main photo, the site draws one of the halftone plates. Choose it with `plate` and `tone`.

Set `draft: true` to hide a story without deleting it.

### Homepage curation

In `content/settings.json`, under `home`, you choose:

- the cover story;
- the four stories in **The Edit** (the third one appears as a big italic quote);
- the three **Also reading** links.

Use story file names without `.md`. Any empty slot is filled with the latest stories.

### MFTV

MFTV fills itself from the MODERNFLEX YouTube channel. Upload a video to YouTube and it appears on the site at the next rebuild. The rebuild happens automatically every morning, and after any change to the site. Only public (or unlisted, if added by hand) videos appear. The channel's feed holds its 15 newest videos.

To give an episode a series, location, running time or better description, add a file in `content/episodes/` (or use the editor) with the same YouTube link. Its details override what YouTube provides. Older videos beyond the newest 15 can be added the same way.

The channel is set in `content/settings.json` under `mftv.channel_id`. Set `auto_from_youtube` to `false` to switch this off.

**Daily rebuild setup (one time):**
1. In Netlify, go to *Project configuration → Build & deploy → Build hooks*, click *Add build hook*, name it "Daily", and copy the URL.
2. In GitHub, go to the repository's *Settings → Secrets and variables → Actions*, click *New repository secret*, name it `NETLIFY_BUILD_HOOK`, and paste the URL.

## Going live (one-time setup)

1. **GitHub:** put this folder in a GitHub repository. Claude can push it for you once the repository exists.
2. **Netlify:** choose *Add new site* and then *Import from Git*, and pick the repository. Netlify reads `netlify.toml`, so the build command (`node build.mjs`) and publish folder (`dist`) fill in automatically.
3. **Forms:** in Netlify, open *Forms* and enable form detection. The newsletter and contact forms will then collect entries. Under *Forms → Notifications*, add your email address to receive each message.
4. **Domain (Fasthosts):**
   - In Netlify, open *Domain management* and add `modernflex.co.uk` and `www.modernflex.co.uk`.
   - Netlify shows the DNS records it needs, usually an A record for the root and a CNAME for `www`.
   - Add exactly those records in the Fasthosts control panel under *Domains → DNS settings*, and remove any old A or CNAME records for the same names.
   - Netlify issues the HTTPS certificate automatically once the DNS has updated. This usually takes minutes but can take up to a day.
5. **Editor:** go to app.pagescms.org, sign in with GitHub and give it access to the repository.

### Newsletter service (optional)

Out of the box, sign-ups are saved in Netlify Forms. To send newsletters, sign up with a service such as Buttondown, Beehiiv or Mailchimp. Then put its form address in `settings.json` under `newsletter.action`, and the field name it expects under `newsletter.field`.

## Running it on your computer

You need Node 20 or newer.

```
node build.mjs
```

Then open `dist/index.html` through any local server. `npm run preview` does both steps.
