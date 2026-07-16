# StreamKH 📺

StreamKH is a premium, lightweight, fully localized streaming web application prototype built for Khmer audiences. It displays movie metadata from TMDB (The Movie Database) and streams contents using third-party embed providers (e.g. VidAPI / `vaplayer.ru`).

## Features
- **Cinematic UI**: Modern dark theme layout with glassmorphic elements and hover zoom animations.
- **Bi-lingual Interface**: Clean toggle between English (EN) and Khmer (ខ្មែរ) language localization.
- **Search & Filters**: Search movies/shows, filter by type (Movies or TV Series), and get related recommendations.
- **Bookmarking System**: Easily save your favorite movies/shows to watch later.
- **Multi-Server Streaming**: Support switching between various stream providers like VidAPI, VidSrc, and SuperEmbed.
- **TV Show Episode Navigation**: Fully interactive TV show season dropdown selector and episode grid numbers.
- **IFrame Sandboxing**: Sandbox protection applied on the player iframe to minimize annoying ad redirects.

---

## Getting Started

### 1. Run the Local Server
You don't need any complex installation or external npm libraries. Run the application locally using the built-in Node.js web server.

1. Open your terminal in this directory.
2. Run:
   ```bash
   node server.js
   ```
3. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```

### 2. Configure TMDB API Key
When you load the app for the first time, a Settings Modal will appear prompting you for a TMDB API Key.

1. Create a free account on [The Movie Database (TMDB)](https://www.themoviedb.org/).
2. Navigate to your TMDB account settings, click **API** in the left sidebar, and create a new key.
3. Copy either your **API Key (v3 auth)** or the **API Read Access Token (v4 auth)**.
4. Paste it into the StreamKH Settings panel and click **Save**.
5. The API key is securely saved to your browser's local storage and will load automatically on your next visit.

---

## Technologies Used
- **Core Structure**: HTML5 Semantic markup
- **Styling**: Modern CSS3 Custom Properties (variables)
- **Logic**: Vanilla ES6 Javascript (zero third-party dependencies)
- **Icons**: Lucide Icons CDN
- **Server**: Node.js Native HTTP server
