const CONFIG = {
  // TMDB API Key / Access Token. 
  // Paste your key here (e.g., 'your_key_here') so visitors can watch instantly.
  // If left empty, the site will prompt visitors for a key (useful for local development).
  TMDB_API_KEY: '0878e9ebcc8f86af49b01da1c733a256' || localStorage.getItem('streamkh_tmdb_key') || '',
  TMDB_BASE_URL: 'https://api.themoviedb.org/3',
  TMDB_IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
  
  // Stream providers
  PROVIDERS: [
    {
      name: 'VidAPI (vaplayer.ru)',
      movieUrl: 'https://vaplayer.ru/embed/movie/{id}',
      tvUrl: 'https://vaplayer.ru/embed/tv/{id}/{season}/{episode}'
    },
    {
      name: 'VidSrc.to',
      movieUrl: 'https://vidsrc.to/embed/movie/{id}',
      tvUrl: 'https://vidsrc.to/embed/tv/{id}/{season}/{episode}'
    },
    {
      name: 'VidSrc.xyz',
      movieUrl: 'https://vidsrc.xyz/embed/movie/{id}',
      tvUrl: 'https://vidsrc.xyz/embed/tv/{id}/{season}/{episode}'
    },
    {
      name: 'SuperEmbed',
      movieUrl: 'https://multiembed.to/director.php?video_id={id}',
      tvUrl: 'https://multiembed.to/director.php?video_id={id}&s={season}&e={episode}'
    }
  ],
  DEFAULT_PROVIDER_INDEX: 0,
  DEFAULT_LANGUAGE: 'km-KH', // Default query language for movies
  UI_LANGUAGE: localStorage.getItem('streamkh_ui_lang') || 'km', // UI Interface language ('km' or 'en')
};
