function generateRadioPlaylist_(
  genre,
  min_year,
  max_year,
  min_popularity = 60,
  makePublic = true
) {

  let playlistName = 'Radio:' + genre + ' ' + min_year + '-' + max_year;
  let queryObj = ['genre:' + genre, 'year:' + min_year.toString() + '-' + max_year.toString()];
  let tracks = Source.mineTracks({
      type: 'track',
      keyword: queryObj,
      popularity: min_popularity,
      itemCount: 50,
      inrow: true,
      requestCount: 10,
  });

  // Кажется это не нужно, но стоит протестировать
  // let params = {
  //   album: {
  //       //popularity: { min: 30, max: 70 },
  //       //album_type: ['single', 'album'],
  //       //release_date: { sinceDays: 6, beforeDays: 0 },
  //       release_date: { startDate: new Date(min_year.toString()+'.01.01'), endDate: new Date(max_year.toString()+'.12.30') },
  //   }
  // }

  // Filter.rangeTracks(tracks, params);
  // Конец блока

  let existingPlaylist = Source.getPlaylistTracks(playlistName);
  if (existingPlaylist.length > 0)
  {
    // Взять 30% от прошлого плейлиста :)
    Selector.keepRandom(existingPlaylist, existingPlaylist.length  / 3 ); 
    tracks = Combiner.alternate('max', tracks, existingPlaylist ); 
  }

  Filter.dedupTracks(tracks);


  Playlist.saveWithReplace({
      // id: 'вашеId',
      name: playlistName ,
      tracks: tracks,
      public: makePublic,
      randomCover: 'once',
      description: 'Nothing special here' //'Stats: Likes from all time:' + LikeTracks.length + '. ' + 'No likes: ' + NoLikeTracks.length + '. Hitratio: '+ hitRatio + '%.',
  });
  return tracks.length;
}

function generateDNBRadioPlaylist(){
  // Жанры: https://chimildic.github.io/goofy/#/reference/desc?id=%d0%9a%d0%b0%d1%82%d0%b5%d0%b3%d0%be%d1%80%d0%b8%d0%b8-%d0%bf%d0%bb%d0%b5%d0%b9%d0%bb%d0%b8%d1%81%d1%82%d0%be%d0%b2

  //https://developer.spotify.com/console/get-available-genre-seeds/
  return generateRadioPlaylist_('drum-and-bass', 2010, 2023, 35);
}

function generateRadioFromUI(values){
  return generateRadioPlaylist_(values.select.genre, values.range.min_year, values.range.max_year, values.range.popularity);
}