// StreamKH Core Application Script

const TRANSLATIONS = {
  km: {
    nav_home: 'ទំព័រដើម',
    nav_movies: 'ភាពយន្ត',
    nav_tv: 'រឿងភាគ',
    nav_bookmarks: 'បញ្ជីកក់ទុក',
    search_placeholder: 'ស្វែងរកភាពយន្ត...',
    search_results_for: 'លទ្ធផលស្វែងរកសម្រាប់៖',
    featured_movie: 'ភាពយន្តពិសេស',
    btn_watch: 'ទស្សនាឥឡូវនេះ',
    btn_details: 'ព័ត៌មានលម្អិត',
    shelf_trending_movies: 'ភាពយន្តកំពុងពេញនិយម',
    shelf_trending_shows: 'រឿងភាគកំពុងពេញនិយម',
    shelf_top_rated: 'ភាពយន្តទទួលបានការវាយតម្លៃខ្ពស់',
    label_season: 'រដូវកាល៖',
    label_overview: 'សង្ខេបរឿង',
    label_cast: 'តួសម្តែងសំខាន់ៗ',
    label_server: 'ម៉ាស៊ីនមេ (Server)៖',
    settings_title: 'ការកំណត់ / Settings',
    settings_notice: 'សម្គាល់៖',
    settings_notice_body: 'StreamKH ត្រូវការកូដ TMDB API Key ដើម្បីទាញយកទិន្នន័យភាពយន្ត។',
    settings_api_help: 'ចុះឈ្មោះគណនី និងបង្កើតកូដ API នៅ៖',
    settings_label_server: 'ម៉ាស៊ីនមេលំនាំដើម (Default Player)៖',
    btn_cancel: 'បោះបង់',
    btn_save: 'រក្សាទុក',
    bookmark_add: 'កក់ទុក',
    bookmark_remove: 'បានកក់ទុក',
    no_bookmarks: 'មិនទាន់មានការកក់ទុកភាពយន្តនៅឡើយទេ។',
    no_results: 'រកមិនឃើញលទ្ធផលដែលត្រូវគ្នានឹងការស្វែងរករបស់អ្នកទេ។'
  },
  en: {
    nav_home: 'Home',
    nav_movies: 'Movies',
    nav_tv: 'TV Shows',
    nav_bookmarks: 'Bookmarks',
    search_placeholder: 'Search movies or shows...',
    search_results_for: 'Search results for:',
    featured_movie: 'Featured Content',
    btn_watch: 'Watch Now',
    btn_details: 'Details',
    shelf_trending_movies: 'Trending Movies',
    shelf_trending_shows: 'Trending TV Shows',
    shelf_top_rated: 'Top Rated',
    label_season: 'Season:',
    label_overview: 'Synopsis',
    label_cast: 'Top Cast',
    label_server: 'Player Server:',
    settings_title: 'Settings',
    settings_notice: 'Notice:',
    settings_notice_body: 'StreamKH requires a TMDB API Key or Access Token to fetch movies metadata.',
    settings_api_help: 'Register an account and generate an API key at:',
    settings_label_server: 'Default Server:',
    btn_cancel: 'Cancel',
    btn_save: 'Save',
    bookmark_add: 'Bookmark',
    bookmark_remove: 'Bookmarked',
    no_bookmarks: 'No movies bookmarked yet.',
    no_results: 'No results found matching your query.'
  }
};

class StreamKHApp {
  constructor() {
    this.apiKey = CONFIG.TMDB_API_KEY;
    this.currentView = 'home'; // 'home', 'movie', 'tv', 'bookmarks', 'search'
    this.selectedLanguage = CONFIG.UI_LANGUAGE; // 'km' or 'en'
    
    this.activeMedia = null; // Currently opened movie/show details
    this.activeMediaEpisodes = []; // If TV, stores episode lists for selected season
    this.selectedSeason = 1;
    this.selectedEpisode = 1;
    this.selectedServerIndex = parseInt(localStorage.getItem('streamkh_default_server') || CONFIG.DEFAULT_PROVIDER_INDEX);
    
    this.bookmarks = JSON.parse(localStorage.getItem('streamkh_bookmarks')) || [];
    this.searchTimeout = null;
  }

  init() {
    // Sync language switch UI buttons state
    this.updateLanguageUI();
    this.translateUI();
    this.populateSettingsServers();
    this.setupEventListeners();
    
    // Check if API Key exists, if not, open settings modal automatically
    if (!this.apiKey) {
      this.openSettings();
    } else {
      this.loadDashboardData();
    }
    
    // Handle scroll header transparency effect
    window.addEventListener('scroll', () => {
      const header = document.getElementById('app-header');
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Setup Event Handlers
  setupEventListeners() {
    // Live Search on input
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      clearTimeout(this.searchTimeout);
      
      if (query.length > 2) {
        this.searchTimeout = setTimeout(() => {
          this.search(query);
        }, 600);
      } else if (query.length === 0) {
        this.showHomeView();
      }
    });

    // Enter Key Search trigger
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        clearTimeout(this.searchTimeout);
        if (query.length > 0) {
          this.search(query);
        }
      }
    });

    // Hero buttons click handlers
    document.getElementById('hero-play-btn').addEventListener('click', () => {
      if (this.featuredMedia) {
        this.openDetails(this.featuredMedia.id, this.featuredMedia.media_type || 'movie');
        // Auto play if clicked watch now
        setTimeout(() => {
          document.getElementById('details-play-btn').click();
        }, 300);
      }
    });

    document.getElementById('hero-info-btn').addEventListener('click', () => {
      if (this.featuredMedia) {
        this.openDetails(this.featuredMedia.id, this.featuredMedia.media_type || 'movie');
      }
    });

    // Details Drawer watch now button handler
    document.getElementById('details-play-btn').addEventListener('click', () => {
      if (this.activeMedia) {
        this.playMedia(
          this.activeMedia.id, 
          this.activeMediaType, 
          this.selectedSeason, 
          this.selectedEpisode
        );
      }
    });
  }

  // TMDB HTTP Request client helper
  async fetchFromTMDB(endpoint, params = {}) {
    if (!this.apiKey) {
      throw new Error('TMDB API Key missing. Please update settings.');
    }

    // Determine query language context
    // tmdb language parameter can be set to km-KH to fetch Khmer translations
    const queryLang = this.selectedLanguage === 'km' ? 'km-KH' : 'en-US';
    const queryParams = new URLSearchParams({
      language: queryLang,
      ...params
    });

    const isBearer = this.apiKey.length > 50; // Long JWT access token check
    const url = `${CONFIG.TMDB_BASE_URL}${endpoint}?${queryParams.toString()}`;
    
    const headers = {};
    if (isBearer) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    } else {
      queryParams.set('api_key', this.apiKey);
      // Rebuild url with query api_key
      return fetch(`${CONFIG.TMDB_BASE_URL}${endpoint}?${queryParams.toString()}`).then(r => {
        if (!r.ok) throw new Error(`TMDB error status: ${r.status}`);
        return r.json();
      });
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`TMDB error status: ${response.status}`);
    }
    return response.json();
  }

  // Load Home Dashboard
  async loadDashboardData() {
    this.showSkeletons();
    
    try {
      // 1. Fetch Trending Movies
      const trendingMoviesData = await this.fetchFromTMDB('/trending/movie/week');
      const trendingMovies = trendingMoviesData.results || [];
      this.renderShelf('trending-movies-grid', trendingMovies, 'movie');
      
      // Select first popular movie for Hero Banner
      if (trendingMovies.length > 0) {
        this.renderHeroBanner(trendingMovies[0]);
      }

      // 2. Fetch Trending TV Shows
      const trendingTvData = await this.fetchFromTMDB('/trending/tv/week');
      const trendingTv = trendingTvData.results || [];
      this.renderShelf('trending-shows-grid', trendingTv, 'tv');

      // 3. Fetch Top Rated Movies
      const topRatedData = await this.fetchFromTMDB('/movie/top_rated');
      const topRated = topRatedData.results || [];
      this.renderShelf('top-rated-grid', topRated, 'movie');
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // If unauthorized, pop settings modal
      if (error.message.includes('401') || error.message.includes('404')) {
        alert(this.selectedLanguage === 'km' ? 'កូដ TMDB API មិនត្រឹមត្រូវទេ! សូមពិនិត្យការកំណត់ឡើងវិញ។' : 'Invalid TMDB API credentials. Please check settings.');
        this.openSettings();
      }
    }
  }

  // Render Hero Banner
  renderHeroBanner(movie) {
    this.featuredMedia = { ...movie, media_type: 'movie' };
    const backdropUrl = movie.backdrop_path ? `${CONFIG.TMDB_IMAGE_BASE_URL}/original${movie.backdrop_path}` : '';
    
    document.getElementById('hero-backdrop-img').style.backgroundImage = `url(${backdropUrl})`;
    document.getElementById('hero-title-text').textContent = movie.title || movie.name || 'StreamKH Movie';
    document.getElementById('hero-rating-val').querySelector('span').textContent = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    document.getElementById('hero-release-year').textContent = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    
    // Fallback description if Khmer is missing
    if (!movie.overview && this.selectedLanguage === 'km') {
      // Attempt english fallback
      this.fetchEnglishFallbackOverview(movie.id, 'movie').then(engOverview => {
        document.getElementById('hero-overview-text').textContent = engOverview || 'មិនមានសេចក្តីសង្ខេបជាភាសាខ្មែរទេ។';
      });
    } else {
      document.getElementById('hero-overview-text').textContent = movie.overview || 'No description available.';
    }
  }

  // Fetch English fallback overview in case Khmer details are blank
  async fetchEnglishFallbackOverview(id, type) {
    try {
      const response = await fetch(`${CONFIG.TMDB_BASE_URL}/${type}/${id}?api_key=${this.apiKey.length > 50 ? '' : this.apiKey}&language=en-US`, {
        headers: this.apiKey.length > 50 ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        return data.overview;
      }
    } catch(e) {
      console.error(e);
    }
    return '';
  }

  // Render Movie list Cards inside grids
  renderShelf(elementId, items, defaultMediaType) {
    const grid = document.getElementById(elementId);
    grid.innerHTML = '';
    
    if (items.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">${TRANSLATIONS[this.selectedLanguage].no_results}</div>`;
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'movie-card';
      const mediaType = item.media_type || defaultMediaType;
      
      const posterPath = item.poster_path ? `${CONFIG.TMDB_IMAGE_BASE_URL}/w342${item.poster_path}` : 'https://placehold.co/342x513/121214/fafafa?text=No+Poster';
      const title = item.title || item.name || 'Unknown Title';
      const year = (item.release_date || item.first_air_date || '').split('-')[0] || 'N/A';
      const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
      
      card.innerHTML = `
        <div class="movie-card-poster">
          <img class="movie-card-img" src="${posterPath}" alt="${title}" loading="lazy">
          <div class="movie-card-overlay">
            <i data-lucide="play" style="fill: var(--accent-color); stroke: var(--accent-color); width: 28px; height: 28px;"></i>
          </div>
        </div>
        <div class="movie-card-info-bottom">
          <div class="movie-card-title-bottom" title="${title}">${title}</div>
          <div class="movie-card-meta-bottom">
            <span class="movie-card-rating">
              <i data-lucide="star" style="fill: var(--accent-color); width:12px; height:12px; stroke:none;"></i>
              <span>${rating}</span>
            </span>
            <span>${year} • <span class="movie-card-type-label">${mediaType}</span></span>
          </div>
        </div>
      `;
      
      card.addEventListener('click', () => {
        this.openDetails(item.id, mediaType);
      });
      
      grid.appendChild(card);
    });
    
    // Refresh icons
    lucide.createIcons({
      attrs: {
        class: 'lucide-svg-icon'
      },
      nameAttr: 'data-lucide'
    });
  }

  // Open Details Drawer
  async openDetails(id, mediaType) {
    this.activeMediaId = id;
    this.activeMediaType = mediaType;
    this.selectedSeason = 1;
    this.selectedEpisode = 1;

    // Open drawer structure first to show transition
    document.getElementById('details-drawer').classList.add('open');
    document.getElementById('details-drawer-overlay').classList.add('open');

    // Show skeletons in details sheet
    document.getElementById('details-title').textContent = 'កំពុងផ្ទុក...';
    document.getElementById('details-original-title').textContent = '';
    document.getElementById('details-overview').textContent = 'សូមរង់ចាំបន្តិច...';
    document.getElementById('details-cast-grid').innerHTML = '';
    document.getElementById('details-episodes-module').style.display = 'none';

    try {
      // Fetch details with credits
      const details = await this.fetchFromTMDB(`/${mediaType}/${id}`, { append_to_response: 'credits' });
      this.activeMedia = details;

      // Update bookmark state button
      this.updateBookmarkButtonState();

      // Render main details text
      const backdropUrl = details.backdrop_path ? `${CONFIG.TMDB_IMAGE_BASE_URL}/w780${details.backdrop_path}` : '';
      document.getElementById('details-backdrop').src = backdropUrl;
      document.getElementById('details-title').textContent = details.title || details.name;
      document.getElementById('details-original-title').textContent = details.original_title || details.original_name || '';
      document.getElementById('details-rating').textContent = `★ ${details.vote_average ? details.vote_average.toFixed(1) : 'N/A'}`;
      
      const releaseDate = details.release_date || details.first_air_date || '';
      document.getElementById('details-year').textContent = releaseDate.split('-')[0] || 'N/A';
      
      const runtime = details.runtime || (details.episode_run_time && details.episode_run_time[0]) || null;
      document.getElementById('details-duration').textContent = runtime ? `${runtime} min` : (mediaType === 'tv' ? `${details.number_of_seasons} Seasons` : 'N/A');

      // Sync fallbacks for synopsis
      if (!details.overview && this.selectedLanguage === 'km') {
        const engSynopsis = await this.fetchEnglishFallbackOverview(id, mediaType);
        document.getElementById('details-overview').textContent = engSynopsis || 'មិនមានសេចក្តីសង្ខេបជាភាសាខ្មែរទេ។';
      } else {
        document.getElementById('details-overview').textContent = details.overview || 'No synopsis available.';
      }

      // Render Cast list
      const cast = (details.credits && details.credits.cast) || [];
      this.renderCast(cast.slice(0, 4));

      // Render TV episodes component if type is TV Show
      const episodesModule = document.getElementById('details-episodes-module');
      if (mediaType === 'tv') {
        episodesModule.style.display = 'block';
        this.renderSeasonSelector(details.seasons || []);
      } else {
        episodesModule.style.display = 'none';
      }

    } catch (error) {
      console.error('Error opening details:', error);
      document.getElementById('details-title').textContent = 'Error Loading Details';
    }
  }

  closeDetails() {
    document.getElementById('details-drawer').classList.remove('open');
    document.getElementById('details-drawer-overlay').classList.remove('open');
    this.activeMedia = null;
  }

  // Render Cast Member avatars
  renderCast(castList) {
    const castGrid = document.getElementById('details-cast-grid');
    castGrid.innerHTML = '';
    
    if (castList.length === 0) {
      castGrid.innerHTML = '<span style="color: var(--text-muted);">N/A</span>';
      return;
    }

    castList.forEach(member => {
      const avatarUrl = member.profile_path ? `${CONFIG.TMDB_IMAGE_BASE_URL}/w185${member.profile_path}` : 'https://placehold.co/185x185/1a1a1e/fafafa?text=Cast';
      const memberDiv = document.createElement('div');
      memberDiv.className = 'cast-member';
      memberDiv.innerHTML = `
        <img class="cast-img" src="${avatarUrl}" alt="${member.name}">
        <div class="cast-name">${member.name}</div>
        <div class="cast-character">${member.character || ''}</div>
      `;
      castGrid.appendChild(memberDiv);
    });
  }

  // Render TV Seasons Select menu
  renderSeasonSelector(seasons) {
    const select = document.getElementById('season-select');
    select.innerHTML = '';
    
    // Filter out specials season (Season 0) unless user wants it
    const validSeasons = seasons.filter(s => s.season_number > 0);
    if (validSeasons.length === 0 && seasons.length > 0) {
      validSeasons.push(seasons[0]); // fallback to special if it is the only one
    }

    validSeasons.forEach(season => {
      const option = document.createElement('option');
      option.value = season.season_number;
      option.textContent = this.selectedLanguage === 'km' 
        ? `រដូវកាលទី ${season.season_number} (${season.episode_count} ភាគ)` 
        : `Season ${season.season_number} (${season.episode_count} Episodes)`;
      select.appendChild(option);
    });

    // Trigger load episodes for the first season automatically
    if (validSeasons.length > 0) {
      this.loadEpisodes(validSeasons[0].season_number);
    }
  }

  // Fetch episodes details for selected season from TMDB API
  async loadEpisodes(seasonNumber) {
    this.selectedSeason = parseInt(seasonNumber);
    const grid = document.getElementById('episodes-grid');
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Loading episodes...</div>';

    try {
      const data = await this.fetchFromTMDB(`/tv/${this.activeMediaId}/season/${seasonNumber}`);
      const episodes = data.episodes || [];
      grid.innerHTML = '';

      episodes.forEach(ep => {
        const btn = document.createElement('button');
        btn.className = `episode-btn ${this.selectedEpisode === ep.episode_number ? 'active' : ''}`;
        btn.textContent = ep.episode_number;
        btn.title = ep.name || `Episode ${ep.episode_number}`;
        
        btn.addEventListener('click', () => {
          // Remove active classes
          grid.querySelectorAll('.episode-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          this.selectedEpisode = ep.episode_number;
          
          // Open player right away on episode selection
          this.playMedia(this.activeMediaId, 'tv', this.selectedSeason, ep.episode_number);
        });
        
        grid.appendChild(btn);
      });
    } catch(e) {
      console.error(e);
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 10px;">Failed to load episodes.</div>';
    }
  }

  // Open player overlay screen and mount the iframe url
  playMedia(id, mediaType, season = 1, episode = 1) {
    this.activeMediaId = id;
    this.activeMediaType = mediaType;
    this.selectedSeason = season;
    this.selectedEpisode = episode;

    const overlay = document.getElementById('player-overlay');
    overlay.classList.add('open');
    
    // Render Title
    const titleText = this.activeMedia ? (this.activeMedia.title || this.activeMedia.name) : 'Streaming';
    document.getElementById('player-title-text').textContent = titleText;

    const episodeInfo = document.getElementById('player-episode-text');
    if (mediaType === 'tv') {
      episodeInfo.style.display = 'block';
      episodeInfo.textContent = this.selectedLanguage === 'km'
        ? `រដូវកាលទី ${season} ភាគទី ${episode}`
        : `Season ${season} Episode ${episode}`;
    } else {
      episodeInfo.style.display = 'none';
    }

    // Populate Servers Select
    this.populatePlayerServers();
    
    // Load default server stream url
    this.loadIframeStream();
  }

  closePlayer() {
    const overlay = document.getElementById('player-overlay');
    overlay.classList.remove('open');
    
    // Clear iframe src to stop stream video/audio running in background
    const iframe = document.getElementById('player-iframe');
    iframe.src = '';
  }

  // Build the embed source link for selected provider
  loadIframeStream() {
    const provider = CONFIG.PROVIDERS[this.selectedServerIndex];
    if (!provider) return;

    let url = '';
    if (this.activeMediaType === 'movie') {
      // Most embed APIs support movie TMDB ID or IMDb ID. VidAPI supports IMDB ID for movie
      const idToUse = (this.activeMedia && this.activeMedia.imdb_id) || this.activeMediaId;
      url = provider.movieUrl.replace('{id}', idToUse);
    } else {
      url = provider.tvUrl
        .replace('{id}', this.activeMediaId)
        .replace('{season}', this.selectedSeason)
        .replace('{episode}', this.selectedEpisode);
    }

    console.log(`Streaming iframe mounting: ${url}`);
    
    const iframe = document.getElementById('player-iframe');
    iframe.src = url;
  }

  // Populate server selector inside player header toolbar
  populatePlayerServers() {
    const select = document.getElementById('player-server-select');
    select.innerHTML = '';

    CONFIG.PROVIDERS.forEach((prov, idx) => {
      const option = document.createElement('option');
      option.value = idx;
      option.textContent = prov.name;
      if (idx === this.selectedServerIndex) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  changePlayerServer(index) {
    this.selectedServerIndex = parseInt(index);
    this.loadIframeStream();
  }

  // Search movies/shows
  async search(query) {
    if (!query) return;
    
    this.currentView = 'search';
    this.showSection('search-results-section');
    document.getElementById('search-query-highlight').textContent = `"${query}"`;
    document.getElementById('search-results-grid').innerHTML = '<div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>';

    try {
      const data = await this.fetchFromTMDB('/search/multi', { query: query });
      // Filter out crew or people card searches
      const searchResults = (data.results || []).filter(item => item.media_type === 'movie' || item.media_type === 'tv');
      this.renderShelf('search-results-grid', searchResults, 'movie');
    } catch(e) {
      console.error(e);
      document.getElementById('search-results-grid').innerHTML = '<div style="color: red; padding: 20px 0;">Error fetching search results.</div>';
    }
  }

  // Bookmark functions
  toggleBookmarkCurrent() {
    if (!this.activeMedia) return;
    
    const index = this.bookmarks.findIndex(b => b.id === this.activeMedia.id && b.media_type === this.activeMediaType);
    
    if (index > -1) {
      // Remove
      this.bookmarks.splice(index, 1);
    } else {
      // Add
      this.bookmarks.push({
        id: this.activeMedia.id,
        title: this.activeMedia.title || this.activeMedia.name,
        poster_path: this.activeMedia.poster_path,
        media_type: this.activeMediaType,
        vote_average: this.activeMedia.vote_average,
        release_date: this.activeMedia.release_date || this.activeMedia.first_air_date
      });
    }

    localStorage.setItem('streamkh_bookmarks', JSON.stringify(this.bookmarks));
    this.updateBookmarkButtonState();

    // If currently looking at bookmark view, refresh layout
    if (this.currentView === 'bookmarks') {
      this.showBookmarks();
    }
  }

  updateBookmarkButtonState() {
    if (!this.activeMedia) return;
    
    const isBookmarked = this.bookmarks.some(b => b.id === this.activeMedia.id && b.media_type === this.activeMediaType);
    const btn = document.getElementById('details-bookmark-btn');
    const icon = document.getElementById('details-bookmark-icon');
    const text = document.getElementById('details-bookmark-txt');
    
    if (isBookmarked) {
      text.textContent = TRANSLATIONS[this.selectedLanguage].bookmark_remove;
      btn.style.borderColor = 'var(--accent-color)';
      btn.style.color = 'var(--accent-color)';
      icon.style.fill = 'var(--accent-color)';
      icon.style.stroke = 'var(--accent-color)';
    } else {
      text.textContent = TRANSLATIONS[this.selectedLanguage].bookmark_add;
      btn.style.borderColor = 'var(--border-color)';
      btn.style.color = 'var(--text-primary)';
      icon.style.fill = 'none';
      icon.style.stroke = 'currentColor';
    }
  }

  showBookmarks() {
    this.currentView = 'bookmarks';
    this.showSection('search-results-section');
    
    const titleText = this.selectedLanguage === 'km' ? 'បញ្ជីកក់ទុករបស់អ្នក' : 'Your Bookmarks';
    document.getElementById('search-results-section').querySelector('.search-results-title').innerHTML = `<span>${titleText}</span>`;
    
    this.renderShelf('search-results-grid', this.bookmarks, 'movie');
    
    // Highlight menu
    this.setActiveNavLink('nav-bookmarks');
  }

  // Filter Categories Movie / TV
  async filterMediaType(type) {
    this.currentView = type;
    this.showSection('search-results-section');
    
    const titleText = type === 'movie' 
      ? (this.selectedLanguage === 'km' ? 'ភាពយន្តទាំងអស់' : 'All Movies') 
      : (this.selectedLanguage === 'km' ? 'រឿងភាគទាំងអស់' : 'All TV Shows');
      
    document.getElementById('search-results-section').querySelector('.search-results-title').innerHTML = `<span>${titleText}</span>`;
    
    // Reset sort selector to default popularity
    document.getElementById('filter-sort').value = 'popularity.desc';
    
    // Load and populate dropdowns (genres & country/languages)
    await this.loadFilterDropdowns(type);
    
    // Run initial discover query
    await this.applyFilters();

    this.setActiveNavLink(type === 'movie' ? 'nav-movies' : 'nav-tv');
  }

  // Load genres and country list based on active media category
  async loadFilterDropdowns(mediaType) {
    const genreSelect = document.getElementById('filter-genre');
    genreSelect.innerHTML = `<option value="">${this.selectedLanguage === 'km' ? 'គ្រប់ប្រភេទ (All Genres)' : 'All Genres'}</option>`;
    
    // Genre translations map for Khmer language fallback (since TMDB returns empty arrays for km-KH genres)
    const genreTranslations = {
      'Action': 'វាយប្រហារ / សកម្មភាព',
      'Adventure': 'ផ្សងព្រេង',
      'Animation': 'គំនូរជីវចល',
      'Comedy': 'កំប្លែង',
      'Crime': 'ឧក្រិដ្ឋកម្ម',
      'Documentary': 'ឯកសារ',
      'Drama': 'មនោសញ្ចេតនា',
      'Family': 'គ្រួសារ',
      'Fantasy': 'មន្តអាគម / ស្រមើស្រមៃ',
      'History': 'ប្រវត្តិសាស្ត្រ',
      'Horror': 'ភ័យរន្ធត់',
      'Music': 'តន្ត្រី',
      'Mystery': 'អាថ៌កំបាំង',
      'Romance': 'ស្នេហា',
      'Science Fiction': 'វិទ្យាសាស្ត្រ',
      'TV Movie': 'ភាពយន្តទូរទស្សន៍',
      'Thriller': 'រន្ធត់ញាប់ញ័រ',
      'War': 'សង្គ្រាម',
      'Western': 'បស្ចិមប្រទេស',
      'Action & Adventure': 'សកម្មភាព និង ផ្សងព្រេង',
      'Kids': 'កុមារ',
      'News': 'ព័ត៌មាន',
      'Reality': 'កម្មវិធីពិត',
      'Sci-Fi & Fantasy': 'វិទ្យាសាស្ត្រ និង មន្តអាគម',
      'Soap': 'រឿងភាគ',
      'Talk': 'ជជែកកម្សាន្ត',
      'War & Politics': 'សង្គ្រាម និង នយោបាយ'
    };

    try {
      // Force fetching in English so we always get the full list of genres
      const data = await this.fetchFromTMDB(`/genre/${mediaType}/list`, { language: 'en-US' });
      const genres = data.genres || [];
      genres.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id;
        
        // Translate name if UI is set to Khmer
        if (this.selectedLanguage === 'km' && genreTranslations[g.name]) {
          opt.textContent = genreTranslations[g.name];
        } else {
          opt.textContent = g.name;
        }
        
        genreSelect.appendChild(opt);
      });
    } catch(e) {
      console.error('Error loading genres:', e);
    }
    
    const countrySelect = document.getElementById('filter-country');
    countrySelect.innerHTML = `
      <option value="">${this.selectedLanguage === 'km' ? 'គ្រប់ប្រទេស (All Countries)' : 'All Countries'}</option>
      <option value="km">${this.selectedLanguage === 'km' ? 'កម្ពុជា (Cambodia)' : 'Cambodia'}</option>
      <option value="en">${this.selectedLanguage === 'km' ? 'អាមេរិក/អង់គ្លេស (US/UK)' : 'US/UK'}</option>
      <option value="zh">${this.selectedLanguage === 'km' ? 'ចិន (China)' : 'China'}</option>
      <option value="ko">${this.selectedLanguage === 'km' ? 'កូរ៉េ (Korea)' : 'Korea'}</option>
      <option value="ja">${this.selectedLanguage === 'km' ? 'ជប៉ុន (Japan)' : 'Japan'}</option>
    `;
  }

  // Query TMDB /discover using active filters
  async applyFilters() {
    const grid = document.getElementById('search-results-grid');
    grid.innerHTML = '<div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>';
    
    const genre = document.getElementById('filter-genre').value;
    const country = document.getElementById('filter-country').value;
    let sort = document.getElementById('filter-sort').value;
    
    const params = {};
    
    if (genre) {
      params['with_genres'] = genre;
    }
    if (country) {
      params['with_original_language'] = country;
    }
    
    // Sort parameters differ for TV shows
    if (this.currentView === 'tv' && sort === 'primary_release_date.desc') {
      sort = 'first_air_date.desc';
    }
    params['sort_by'] = sort;
    
    try {
      const data = await this.fetchFromTMDB(`/discover/${this.currentView}`, params);
      this.renderShelf('search-results-grid', data.results || [], this.currentView);
    } catch(e) {
      console.error('Discover error:', e);
      grid.innerHTML = `<div style="color: red; padding: 20px 0; text-align: center;">Failed to load results.</div>`;
    }
  }

  // Navigation handlers
  showHomeView() {
    this.currentView = 'home';
    this.showSection('dashboard-view');
    document.getElementById('search-input').value = '';
    this.setActiveNavLink('nav-home');
    this.loadDashboardData();
  }

  showSection(sectionId) {
    const dashboard = document.getElementById('dashboard-view');
    const searchSection = document.getElementById('search-results-section');
    const filterBar = document.getElementById('filter-bar');
    
    if (sectionId === 'dashboard-view') {
      dashboard.style.display = 'block';
      searchSection.style.display = 'none';
      filterBar.style.display = 'none';
    } else {
      dashboard.style.display = 'none';
      searchSection.style.display = 'block';
      
      // Show filter bar only on movies or tv browse views
      if (this.currentView === 'movie' || this.currentView === 'tv') {
        filterBar.style.display = 'flex';
      } else {
        filterBar.style.display = 'none';
      }
    }
  }

  setActiveNavLink(id) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    const active = document.getElementById(id);
    if (active) active.classList.add('active');
  }

  // Skeletons Loader grids
  showSkeletons() {
    const loadingHtml = `<div class="skeleton-card"></div>`.repeat(6);
    document.getElementById('trending-movies-grid').innerHTML = loadingHtml;
    document.getElementById('trending-shows-grid').innerHTML = loadingHtml;
    document.getElementById('top-rated-grid').innerHTML = loadingHtml;
  }

  // Language management
  toggleLanguage(lang) {
    this.selectedLanguage = lang;
    localStorage.setItem('streamkh_ui_lang', lang);
    
    // Toggle HTML lang attribute
    document.documentElement.lang = lang === 'km' ? 'km' : 'en';
    
    // Toggle body font classes
    if (lang === 'km') {
      document.body.classList.add('lang-km');
    } else {
      document.body.classList.remove('lang-km');
    }

    this.updateLanguageUI();
    this.translateUI();
    
    // Reload active views
    if (this.currentView === 'home') {
      this.loadDashboardData();
    } else if (this.currentView === 'movie' || this.currentView === 'tv') {
      this.filterMediaType(this.currentView);
    } else if (this.currentView === 'bookmarks') {
      this.showBookmarks();
    } else if (this.currentView === 'search') {
      const q = document.getElementById('search-input').value;
      this.search(q);
    }
    
    // If active modal/drawer is open, refresh descriptions
    if (this.activeMedia) {
      this.openDetails(this.activeMediaId, this.activeMediaType);
    }
  }

  updateLanguageUI() {
    const kmBtn = document.getElementById('lang-km-btn');
    const enBtn = document.getElementById('lang-en-btn');
    
    if (this.selectedLanguage === 'km') {
      kmBtn.classList.add('active');
      enBtn.classList.remove('active');
    } else {
      enBtn.classList.add('active');
      kmBtn.classList.remove('active');
    }
  }

  translateUI() {
    const dictionary = TRANSLATIONS[this.selectedLanguage];
    
    // Translate text nodes
    document.querySelectorAll('[data-translate]').forEach(el => {
      const key = el.getAttribute('data-translate');
      if (dictionary[key]) {
        el.textContent = dictionary[key];
      }
    });

    // Translate input placeholders
    document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
      const key = el.getAttribute('data-translate-placeholder');
      if (dictionary[key]) {
        el.placeholder = dictionary[key];
      }
    });
  }

  // Settings Panel Management
  openSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.add('open');
    
    // Fill values
    document.getElementById('settings-api-key').value = this.apiKey;
    
    // Populate default servers selector in settings
    const select = document.getElementById('settings-default-server');
    select.innerHTML = '';
    CONFIG.PROVIDERS.forEach((p, index) => {
      const opt = document.createElement('option');
      opt.value = index;
      opt.textContent = p.name;
      if (index === this.selectedServerIndex) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  }

  closeSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.remove('open');
  }

  saveSettings() {
    const keyInput = document.getElementById('settings-api-key').value.trim();
    const serverInput = parseInt(document.getElementById('settings-default-server').value);
    
    if (!keyInput) {
      alert(this.selectedLanguage === 'km' 
        ? 'សូមបញ្ចូល TMDB API Key ជាមុនសិន!' 
        : 'Please enter a TMDB API Key!');
      return;
    }

    this.apiKey = keyInput;
    this.selectedServerIndex = serverInput;
    
    localStorage.setItem('streamkh_tmdb_key', keyInput);
    localStorage.setItem('streamkh_default_server', serverInput);
    
    this.closeSettings();
    this.loadDashboardData();
  }

  populateSettingsServers() {
    // Auxiliary wrapper function
  }
}

// Instantiate application
const app = new StreamKHApp();
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
window.app = app;
