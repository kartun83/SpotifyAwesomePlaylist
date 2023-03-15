const Release = (function () {
    const URL_BASE = 'http://everynoise.com/new_releases_by_genre.cgi';
    return {
        getTracks: getTracks,
    };

    function getTracks(params) {
        return getAlbums(params).reduce((tracks, album) => {
            return Combiner.push(tracks, album.tracks.items);
        }, []);
    }

    function getAlbums(params) {
        params.date = params.date ? params.date.replace(/-/g, '') : '';
        params.region = params.region || 'RU';
        params.type = params.type || 'album,single';

        let template = `%s?genre=%s&region=%s&date=%s&hidedupes=on`;
        let url = Utilities.formatString(template, URL_BASE, params.genre, params.region, params.date);

        let albumIds = parseAlbumIds(url, params.genre);
        let albums = SpotifyRequest.getFullObjByIds('albums', albumIds, 20);
        return albums.filter((album) => params.type.includes(album.album_type));
    }

    function parseAlbumIds(url, genre) {
        let albumsIds = [];
        let cheerio = createCherio(url);
        let rootId = genre.replace(/[- ]/g, '');
        let root = cheerio(`#${rootId}`).next();
        cheerio('.albumbox', '', root).each((index, node) => {
            let uri = cheerio('a[href^="spotify:album:"]', '', node).attr('href');
            let id = uri.split(':')[2];
            albumsIds.push(id);
        });
        return albumsIds;
    }

    function createCherio(url) {
        let content = CustomUrlFetchApp.fetch(url).getContentText();
        return Cheerio.load(content);
    }
})();

function generateRadioPlaylist_(inGenre) {
  //let genre = 'drum and bass, nz dnb, brazilian dnb, dancefloor dnb';
  let tracks = Release.getTracks({
    genre: inGenre, // обязательно
    region: 'US',
    // date: '2021-01-29', // можно не указывать для последней доступной недели
    // type: 'album,single', // необязательно, если нужны оба типа
  });

  Filter.dedupTracks(tracks);
  
  Playlist.saveWithReplace({
    name: 'Release radar:' + inGenre.split(',')[0],
    tracks: tracks,
    description: 'New releases in ' + inGenre + '. Week:' + Utils.getWeekNumber() +', updated weekly. Here would be some stats ... one day.'
  });
}

function generateRadar_DNBRadioPlaylist() {
  let genre = 'drum and bass, nz dnb, brazilian dnb, dancefloor dnb, russian dnb, uk dnb, austrian dnb, belgian dnb, dutch dnb, german dnb';
  generateRadioPlaylist_(genre);
}

function generateRadar_PsyRadioPlaylist() {
  let genre = 'psychedelic trance, full on, trance brasileiro, techno rave, progressive psytrance, trance mexicano, uplifting trance';
  generateRadioPlaylist_(genre);
}
