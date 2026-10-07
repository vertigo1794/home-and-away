# Home & Away

**One helps you find a home. One takes you away.**

An Apple-style landing page that introduces two mobile apps built for the Mobile Application Development course (Semester 4): **Renly** and **Sky Saver**.

**Live site:** https://vertigo1794.github.io/home-and-away/

---

## The apps

### Renly
*Find your buyer. Faster.*

A property app for real-estate agents. Post listings, browse a co-broking marketplace, and chat with leads to book viewings, all in one place.

- Built by **Fakhrullah Bin Rassul**
- Flutter + Supabase
- Download: [latest Android APK](https://github.com/vertigo1794/renly/releases/latest/download/app-release.apk)
- Source: [vertigo1794/renly](https://github.com/vertigo1794/renly)

### Sky Saver
*The sky, in your pocket.*

A flight booking app. Search a route, pick a seat from a live seat map, and keep the boarding pass ready.

- Built by **Mohamad Hairi Bin Abdul Ahmad**

---

## What's on the page

| Section | What it does |
|---|---|
| **Intro** | 3D "clay" app icon that flips between the Renly and Sky Saver logos over a grid of icons, then zooms away as you scroll |
| **Get the highlights.** | Film gallery with each app's promo video. Press play to watch (with sound); when one film ends it slides to the next. Swipe, dots or arrows to switch |
| **About & stats** | Short story of the project with words that light up as you scroll, plus count-up numbers |
| **Team** | One card per developer with photo, short bio and a direct APK link |
| **Renly / Sky Saver** | Per-app showcase: sticky titanium phone whose screen changes with each feature, a bento "Highlights" grid and tech specs |
| **Explore** | Tap through each app's features, switch apps, and change the phone's finish (Emerald, Ocean, Graphite, Silver) |
| **Compare** | Side-by-side summary of both apps |
| **FAQ** | Installing the APK, Android "unknown apps" warning, and more |

The page switches its colour theme as you scroll (dark, light, Renly, Sky Saver), works on phones, and respects the *reduce motion* accessibility setting.

---

## Built with

- Plain **HTML, CSS and JavaScript**, no build step or framework
- [GSAP](https://gsap.com/) + ScrollTrigger (from CDN) for scroll animations
- System font (SF Pro on Apple devices) with [Inter](https://fonts.google.com/specimen/Inter) as fallback
- Hosted on **GitHub Pages**

## Run it locally

```bash
git clone https://github.com/vertigo1794/home-and-away.git
cd home-and-away
python3 -m http.server 5173
```

Then open http://localhost:5173. Opening `index.html` directly also works.

## Project structure

```
index.html   page content and sections
style.css    layout, themes, phone mockups and animations
main.js      film gallery, explorer, scroll effects
assets/      app screenshots, logos, films and team photos
```

## Team

| Name | App |
|---|---|
| Fakhrullah Bin Rassul | Renly |
| Mohamad Hairi Bin Abdul Ahmad | Sky Saver |

---

Made for Mobile Application Development, Semester 4.
