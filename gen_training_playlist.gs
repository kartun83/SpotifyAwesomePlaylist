const kartun_gen_version = "1.0.2";
const email              = "alexey.tveritinov@gmail.com"

function genTrainingPlaylist(
  playlistName,
  referenceTracks          = [],
  limitFinalPlaylistLength = true,
  finalPlaylistLength      = 50,
  needBlender              = true,
  strictBlender            = true,   
  secondChance             = true,
  secondChancePerc         = 0.25, 
  makePublic               = true,  
  //minTempo                 = 145,
  //minDanceability          = 0.47,
  //minEnergy                = 0.6,
  maxSpeechness            = 0.3,   // Currenty not used
  minValence               = 0.25,  // Currenty not used
  // Do not change unless absolutly reqiured
  maxLikesCache            = 200,
  maxNoLikesCache          = 2000,
) {
  // Settings
  //let limitFinalPlaylistLength = true;
  //let finalPlaylistLength = 50;
  //let playlistName   = 'Training playlist_trance';
  //let makePublic     = true;
  // Минимальная "позитивность"
  //let minValence     = 0.25;
  // Минимальный темп
  //let minTempo        = 145;
  //let modality        = 1; // mode	0 или 1	Модальность трека. Мажор = 1, минор = 0.
  //let maxLikesCache   = 200;   // Размер кэша для лайков
  //let maxNoLikesCache = 2000;  // Размер кэша для треков из предыдущих генераций плейлистов на которые не поставлен лайк (исключить из новых плейлистов)
  //let referenceTracks = ['2BkPRWKJiCHk1pcJBTDpvt','1A5qWui6qJvEdlJ3ZYO8yS', '2leJ3zCCHjuoEHpQJCJxRh','2hCZ7GcojMsMIqeC9tI3vg', '3v74X2uklqTV2gKjlaxlZD', '73AJPdw4iX9pXrk5tjWnDX']; 
  // 1A5qWui6qJvEdlJ3ZYO8yS
  //let referenceTracks = ['2BkPRWKJiCHk1pcJBTDpvt','1A5qWui6qJvEdlJ3ZYO8yS', '2leJ3zCCHjuoEHpQJCJxRh', '73AJPdw4iX9pXrk5tjWnDX', '3v74X2uklqTV2gKjlaxlZD']; // 
  //let referenceTracks = ['6VHBZt8T7ZdlUt3MkOZqPy','0FSxuVEj1lse3hvLtrItYN', '4vF25KOYxToe7F7BK49Uoq', '3DoqcWI25FFABaTPknNBc0', '1Trbq8cM7UYg6tOSjdGxXW']; // 
 // let maxLiveness    = 0.45;
  // let minDanceability   = 0.47;
  //let minEnergy         = 0.6;
  //let maxSpeechness     = 0.3;
  //let needBlender       = true;
  //let secondChance      = true; // Second chance for unheared tracks
  //let secondChancePerc  = 0.25;   // Amount of unheared tracks from previuous run to blend into new playlist

  // Internal settings
  let referenceTracksFilename = 'ReferenceTracks';
  let noLikesFilename         = 'NoLikeTracks';
  let backupFilename          = 'Backup';
  let unexpectedBonusFilename = 'UnexpectedBonus';
  let hardMissFilename        = 'HardMiss';
  let amountForCraft          = 4;          // Spotify limit eq 5, not recommended for changing

  // Internal var
  let secondChancePlaylist = [];
  let firstRun             = false;
  let r2                   = '';
  let unexpectedBonus      = [];
  let hardMissTracks       = [];

  // Generate filenames for cache
  referenceTracksFilename = referenceTracksFilename.concat('_', Utils.generateDigest(playlistName), '.json');
  noLikesFilename = noLikesFilename.concat('_', Utils.generateDigest(playlistName), '.json');
  backupFilename = backupFilename.concat('_', Utils.generateDigest(playlistName), '.json');
  unexpectedBonusFilename = backupFilename.concat('_', Utils.generateDigest(playlistName), '.json');
  hardMissFilename = backupFilename.concat('_', Utils.generateDigest(playlistName), '.json');

  // Исходный трек
  // https://developer.spotify.com/console/get-audio-features-track/
  // let sourceTrack = Source.getAudioFeaturesTrack
  // "danceability": 0.777,
  // "energy": 0.877,
  // "key": 6,
  // "loudness": -3.954,
  // "mode": 0,
  // "speechiness": 0.147,
  // "acousticness": 0.304,
  // "instrumentalness": 0,
  // "liveness": 0.313,
  // "valence": 0.667,
  // "tempo": 175.017,
  //------------ The general
//   {
//   "danceability": 0.596,
//   "energy": 0.942,
//   "key": 2,
//   "loudness": -3.026,
//   "mode": 1,
//   "speechiness": 0.0594,
//   "acousticness": 0.000614,
//   "instrumentalness": 0.0000266,
//   "liveness": 0.0317,
//   "valence": 0.867,
//   "tempo": 174.994,
// }

  // work-out, breakbeat, techno, trance, post-dubstep
  //let tracks = Source.getPlaylistTracks('', 'id', '', 10, false);

  let existingPlaylist = Source.getPlaylistTracks(playlistName);
  // If there are something in existing playlist, take up to 5 liked tracks for reference
  if ( existingPlaylist.length > 0) {
    // 3.2 - compare backup playlist with actual one.
    let playlistBackup = Cache.read(backupFilename);
    
    if (playlistBackup.length > 0)
    {
      let playlistDelta = Filter.removeTracks(playlistBackup, existingPlaylist, false, 'every');  
        try
        {
           //unexpectedBonus = Library.checkFavoriteTracks(playlistDelta);
        // Save unexpected bonus separately. Would be used to calc stats or generation of other playlists, and for filtering, possibly
          //let unexpectedBonus_likes = unexpectedBonus.filter(t => t.isFavorite);
          //Cache.append(unexpectedBonus_likes);
          //unexpectedBonus = Cache.read(unexpectedBonusFilename); 
          let {unexpectedBonus_likes, hardMissTracks } = Filter.separateByCriteria(existingPlaylist, {byLikes: true, listened: true});
          Cache.append(unexpectedBonusFilename, unexpectedBonus_likes);
          console.log("Adding unexpected bonus: %d", unexpectedBonus_likes.length);
          // Треки без лайков, которые удалены из плейлиста. То есть совсем плохие. Их надо будет фильтровать и никогда больше сюда не подкладывать
          Cache.append(hardMissFilename, hardMissTracks);
          console.log("Adding hard miss tracks: %d", hardMissTracks.length);

          unexpectedBonus = Cache.read(unexpectedBonusFilename); 
          hardMissTracks  = Cache.read(hardMissFilename);
        }
        catch (err)
        {
          // косяки с удалением рудиментов после удаления плейлистов. Так вообще не должно быть.
        }
    }
    // --- End 3.2

    // Listening history
    let recentTracks = RecentTracks.get();

    
    // Split source into liked and not liked parts
    Library.checkFavoriteTracks(existingPlaylist);
    // Backup original playlist, as it would be changed
    let originalPlaylist = Selector.sliceCopy(existingPlaylist);
    
    referenceTracks = existingPlaylist.filter(t => t.isFavorite);
       
    // Save reference to storage
    Cache.append(referenceTracksFilename, referenceTracks, 'end', maxLikesCache);
    console.log("Adding %d tracks to reference list", referenceTracks.length);
    referenceTracks = Selector.sliceFirst(referenceTracks, 4); // There is limit to 5 items :)

    // Leave only those from playlist
    Filter.removeTracks(originalPlaylist, recentTracks, false, 'every');
    console.log("Unheared tracks from previous playlist %d", originalPlaylist.length);

    if (secondChance == true)
    {
      secondChancePlaylist =  Selector.sliceRandom(originalPlaylist, Math.round(originalPlaylist.length * secondChancePerc));
    }

    // Save nolikes to storage
    existingPlaylist_nolikes = existingPlaylist.filter(t => !t.isFavorite);
    // Cache only those were listened, but not liked. If it's not listened, it can't be liked :)
    Filter.removeTracks(existingPlaylist_nolikes, originalPlaylist, false, 'every');
    Cache.append(noLikesFilename, existingPlaylist_nolikes, 'end', maxNoLikesCache);
    console.log("Adding %d tracks to no likes list", existingPlaylist_nolikes.length);
    referenceTracks = Selector.sliceRandom(referenceTracks, amountForCraft);
  }
  else{
    // If playlist does not exist delete cache, as it's not valid
    Utils.cleanUp(referenceTracksFilename, noLikesFilename, backupFilename, unexpectedBonusFilename, hardMissFilename);
    firstRun = true;
  }

  // let tracks = Source.getRecomTracks({
  //     // seed_genres: 'drum-and-bass, dubstep, post-dubstep, edm',
  //     //min_valence: minValence,
  //     seed_tracks: referenceTracks,
  //     min_tempo: minTempo,
  //     min_dancibility: minDanceability,
  //     min_energy: minEnergy,
  //     max_speechness: maxSpeechness
  //     //max_liveness: maxLiveness,
  //     //mode: modality
  // });
      

    if (firstRun == true)
    {
      // TODO :: Finish
      // referenceTracks.forEach((elem, i) => {
      //   obj[`id`] = elem}
      // )

        var {min, max, median2} =  Utils.generateStatistics( referenceTracks );                             
    }
    else
    {
        var {min, max, median2} =  Utils.generateStatistics( referenceTracks ); 
    }

      tracks = Source.craftTracks(referenceTracks,
        {
          key: 'seed_tracks',
          query: {
              limit: 100, // по умолчанию и максимум 100
              min_energy: min.energy,
              min_tempo: min.tempo,
              min_dancibility: min.danceability,
              target_tempo: median2.tempo

              // target_popularity: 60,
          }
        }
      );      
    

      


  // Load no likes filter
    let NoLikeTracks = Cache.read(noLikesFilename);
    Filter.dedupTracks(NoLikeTracks);

  // Filter out recent tracks without likes from previous runs
    Filter.removeTracks(tracks, NoLikeTracks, false, 'every');

  // Second chance feature
  if (secondChance == true){
    tracks = Combiner.alternate('max', tracks, secondChancePlaylist ); 
  }    


    let LikeTracks = Cache.read(referenceTracksFilename);
    if (needBlender == true){
      // TODO :: Refactor to function
      // Load reference tracks cache
      
      Filter.dedupTracks(LikeTracks);
      referenceTracks = Selector.sliceRandom(LikeTracks, amountForCraft);
      let tracks2 = Source.craftTracks(referenceTracks,
        {
          key: 'seed_tracks',
          query: {
              limit: 100, // по умолчанию и максимум 100
              min_energy: min.energy,
              min_tempo: min.tempo,
              min_dancibility: min.danceability,
              target_tempo: median2.tempo
              // target_popularity: 60,
          }
        }
      );  
      Filter.removeTracks(tracks2, NoLikeTracks, false, 'every'); 
       // Check liked tracks in this playlist
      Library.checkFavoriteTracks(tracks2);
      // Remove liked tracks from generated list
      let currPlaylist_likes = tracks2.filter(t => t.isFavorite);
      Filter.removeTracks(tracks2, currPlaylist_likes, false, 'every');  
      if (strictBlender == true)
      {
        Filter.dedupArtists(tracks2);
      }
      // Combine both arrays
      tracks = Combiner.alternate('max', tracks, tracks2 );       
    }

  Filter.dedupTracks(tracks);


  // Remove tracks from HARD MISS list
  Filter.removeTracks(tracks, hardMissTracks, false, 'every');  
  if (limitFinalPlaylistLength) {
    Selector.keepRandom(tracks, finalPlaylistLength);
  }

  // 3 - создаем плейлист
  var hitRatio = unexpBonus = hardMissPrc = 0;
  if (LikeTracks.length > 0) {
    hitRatio    = (LikeTracks.length /  ( NoLikeTracks.length + LikeTracks.length + unexpectedBonus.length ) * 100).toFixed(2);
    unexpBonus  = (unexpectedBonus.length / NoLikeTracks.length * 100).toFixed(2);
    hardMissPrc = (hardMissTracks.length / NoLikeTracks.length * 100).toFixed(2);
  }  
  Playlist.saveWithReplace({
      // id: 'вашеId',
      name: playlistName,
      tracks: tracks,
      public: makePublic,
      randomCover: 'once',
      description: 'Stats: Likes from all time:' + LikeTracks.length + '. ' + 'No likes: ' + NoLikeTracks.length + '. Hitratio: '+ hitRatio + '%. Unxepected bonus: '+unexpBonus + '%'+
                   ' Hard miss: ' + hardMissPrc + '%.',
  });

  // 3.1 - backup playlist, would be required for further algorithm tweaking  
  Cache.write(backupFilename, tracks);

  console.log('Число запросов %d', CustomUrlFetchApp.getCountRequest());
}

function genTrancePlaylist(){
  genTrainingPlaylist(playlistName = 'Training playlist PSY-Trance',
                      referenceTracks = [ {id:'6VHBZt8T7ZdlUt3MkOZqPy'},
                                          {id:'0FSxuVEj1lse3hvLtrItYN'}, 
                                          {id:'4vF25KOYxToe7F7BK49Uoq'}, 
                                          {id:'3DoqcWI25FFABaTPknNBc0'}, 
                                          {id:'1Trbq8cM7UYg6tOSjdGxXW'}],
                      limitFinalPlaylistLength = true,
                      finalPlaylistLength      = 50,
                      needBlender              = true,
                      strictBlender            = true,
                      secondChance             = true,
                      secondChancePerc         = 0.25,
                      makePublic               = true,
                      // minTempo                 = 145,
                      // minDancability           = 0.47,
                      // minEnergy                = 0.6,
                      // maxSpeechness            = 0.3,
                      // minValence               = 0.25,
                      maxLikesCache            = 150,
                      maxNoLikesCache          = 350
                     );
}

function genDNBPlaylist(){
  genTrainingPlaylist('Training playlist Drum&Bass',
                      [{id:'2BkPRWKJiCHk1pcJBTDpvt'}, 
                       {id:'1A5qWui6qJvEdlJ3ZYO8yS'}, 
                       {id:'2leJ3zCCHjuoEHpQJCJxRh'}, 
                       {id:'73AJPdw4iX9pXrk5tjWnDX'}, 
                       {id:'3v74X2uklqTV2gKjlaxlZD'}],
                      limitFinalPlaylistLength = true,
                      finalPlaylistLength      = 50,
                      needBlender              = true,
                      strictBlender            = true,
                      secondChance             = true,
                      secondChancePerc         = 0.25,
                      makePublic               = true,
                      // minTempo                 = 165,
                      // minDancability           = 0.55,
                      // minEnergy                = 0.8,
                      // maxSpeechness            = 0.3,
                      // minValence               = 0.25,
                      maxLikesCache            = 150,
                      maxNoLikesCache          = 350
                     );
}

// function generateDigest_(playlistFilename){
//   var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, playlistFilename)
//   .map(function(b) {return ("0" + (b < 0 && b + 256 || b).toString(16)).substr(-2)})
//   .join("");
//   Logger.log(digest);
//   return digest;
// }

// function cleanUp_(referenceFile, noLikesFile){
//   Cache.remove(referenceFile);
//   console.log("Deleting %s", referenceFile);
//   Cache.remove(noLikesFile);
//   console.log("Deleting %s", noLikesFile);
// }

function testGenStats(){
  let {min, max, median2} =  Utils.generateStatistics( [{id:'2BkPRWKJiCHk1pcJBTDpvt'}, 
                             {id:'1A5qWui6qJvEdlJ3ZYO8yS'}] );                             
  console.log(median2);
}

function testSplitByCriteria(){
  let existingPlaylist = Source.getPlaylistTracks('Training playlist PSY-Trance');  
  let {likedTracks, notLikedTracks, listened, unListened } = Filter.separateByCriteria(existingPlaylist, {byLikes: true, listened: true});
  console.log('Total:' + existingPlaylist.length, '.Likes: '+ likedTracks.length, '. No likes:' + notLikedTracks.length 
   + '. Listened: '+ listened.length + '. Unlistened: ' + unListened.length);
  //);
}