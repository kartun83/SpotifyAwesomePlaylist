const Utils = (function () {
    return {
        generateDigest, cleanUp, getWeekNumber, generateStatistics, median
    };

    function generateDigest(playlistFilename){
      var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, playlistFilename)
      .map(function(b) {return ("0" + (b < 0 && b + 256 || b).toString(16)).substr(-2)})
      .join("");
      Logger.log(digest);
      return digest;
    }

    // function median(numbers) {
    //     const sorted = Array.from(numbers).sort((a, b) => a - b);
    //     const middle = Math.floor(sorted.length / 2);

    //     if (sorted.length % 2 === 0) {
    //         return (sorted[middle - 1] + sorted[middle]) / 2;
    //     }

    //     return sorted[middle];
    // }

    function median(data) {
      const values = [...data];
      const v   = values.sort( (a, b) => a - b);
      const mid = Math.floor( v.length / 2);
      const median = (v.length % 2 !== 0) ? v[mid] : (v[mid - 1] + v[mid]) / 2; 
      return median;
    }

    function cleanUp(referenceFile, noLikesFile, playlistBackup, unexpBonus, hardMiss){
      Cache.remove(referenceFile);
      console.log("Deleting %s", referenceFile);
      Cache.remove(noLikesFile);
      console.log("Deleting %s", noLikesFile);
      Cache.remove(playlistBackup);
      console.log("Deleting %s", playlistBackup);
      Cache.remove(playlistBackup);
      console.log("Deleting %s", unexpBonus);
      Cache.remove(hardMiss);
      console.log("Deleting %s", unexpBonus);
    }

    function getWeekNumber(){
      currentDate = new Date();
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      var days = Math.floor((currentDate - startDate) /
          (24 * 60 * 60 * 1000));
          
      return weekNumber = Math.ceil(days / 7);
    }

    function generateStatistics(inTracks){
      // let response = Source.getTrackFeatures(inTracks[0].id);
      // console.log(response);

      response = Source.getTracksFeatures(inTracks);

      var min = {}; var max = {}; var median2 = {};
      if (response.length > 0)
      {
        // There should be way to make it more elegant
          //min = max = median = response[0];
          let danceability = response.map(a => a.danceability);
          let energy = response.map(a => a.energy);
          let speechiness = response.map(a => a.speechiness);
          let acousticness = response.map(a => a.acousticness);
          let liveness = response.map(a => a.liveness);
          let valence = response.map(a => a.valence);
          let tempo = response.map(a => a.tempo);

        //
          min.danceability = Math.min(...danceability); max.danceability = Math.max(...danceability); median2.danceability = Utils.median(danceability);
          min.energy = Math.min(...energy); max.energy = Math.max(...energy); median2.energy = Utils.median(energy);
          min.speechiness = Math.min(...speechiness); max.speechiness = Math.max(...speechiness); median2.speechiness = Utils.median(speechiness);
          min.acousticness = Math.min(...acousticness); max.acousticness = Math.max(...acousticness); median2.acousticness = Utils.median(acousticness);
          min.liveness = Math.min(...liveness); max.liveness = Math.max(...liveness); median2.liveness = Utils.median(liveness);
          min.valence = Math.min(...valence); max.valence = Math.max(...valence); median2.valence = Utils.median(valence);
          min.tempo = Math.min(...tempo); max.tempo = Math.max(...tempo); median2.tempo = Utils.median(tempo);
          // for (let i = 0; i < response.length; i++) {
          //     min.danceability = Math.min(response[0].danceability, min.danceability);
          // }
      }
      else
      {
        Admin.printError('Ошибка при получении информации по трекам', tracks);
        throw new Error("No data in response");
      }
      // console.log("Min:", min);
      // console.log("Max:", max);
      // console.log("Median:", median2);

      return {min, max, median2};
    }
})();