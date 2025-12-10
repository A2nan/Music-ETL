import React, { useState, useEffect } from "react";
import {
  Music,
  TrendingUp,
  Clock,
  Users,
  Globe,
  Calendar,
  Play,
  BarChart3,
  Loader2,
  AlertCircle,
} from "lucide-react";


const OpenSoundDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState("all");

  // Liste des genres populaires à explorer
  const genres = [
    { id: "all", name: "Tous les genres", query: "top" },
    { id: "pop", name: "Pop", query: "pop" },
    { id: "rock", name: "Rock", query: "rock" },
    { id: "rap", name: "Rap/Hip-Hop", query: "rap" },
    { id: "electronic", name: "Electronic", query: "electronic" },
    { id: "jazz", name: "Jazz", query: "jazz" },
    { id: "classical", name: "Classical", query: "classical" },
    { id: "rnb", name: "R&B", query: "rnb" },
  ];

  // Fonction ETL - Extract, Transform, Load
  const performETL = async (genreQuery) => {
    setLoading(true);
    setError(null);

    try {
      // EXTRACTION - Récupération des données depuis l'API Deezer
      const response = await fetch(
        `https://cors-anywhere.herokuapp.com/https://api.deezer.com/search?q=${genreQuery}&limit=50`,
        { headers: { Origin: "localhost" } }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des données");
      }

      const result = await response.json();

      // TRANSFORMATION - Nettoyage et enrichissement des données
      const transformedData = result.data.map((track) => {
        const durationMinutes = Math.floor(track.duration / 60);
        const durationSeconds = track.duration % 60;
        const releaseYear = track.album?.release_date
          ? new Date(track.album.release_date).getFullYear()
          : null;

        return {
          id: track.id,
          title: track.title,
          artist: track.artist.name,
          artistId: track.artist.id,
          album: track.album.title,
          duration: track.duration,
          durationFormatted: `${durationMinutes}:${durationSeconds
            .toString()
            .padStart(2, "0")}`,
          popularity: track.rank || 0,
          explicit: track.explicit_lyrics,
          preview: track.preview,
          cover: track.album.cover_medium,
          releaseDate: track.album.release_date,
          releaseYear: releaseYear,
          decade: releaseYear ? Math.floor(releaseYear / 10) * 10 : null,
        };
      });

      // LOAD - Chargement dans notre "Data Warehouse" (state)
      setData(transformedData);

      // Calcul des statistiques (couche analytique)
      calculateStats(transformedData);
    } catch (err) {
      setError(err.message);
      console.error("Erreur ETL:", err);
    } finally {
      setLoading(false);
    }
  };

  // Analyse des données - Couche de restitution
  const calculateStats = (tracks) => {
    if (!tracks.length) return;

    // Statistiques par artiste
    const artistStats = {};
    tracks.forEach((track) => {
      if (!artistStats[track.artist]) {
        artistStats[track.artist] = {
          count: 0,
          totalPopularity: 0,
          tracks: [],
        };
      }
      artistStats[track.artist].count++;
      artistStats[track.artist].totalPopularity += track.popularity;
      artistStats[track.artist].tracks.push(track);
    });

    const topArtists = Object.entries(artistStats)
      .map(([name, data]) => ({
        name,
        trackCount: data.count,
        avgPopularity: Math.round(data.totalPopularity / data.count),
      }))
      .sort((a, b) => b.avgPopularity - a.avgPopularity)
      .slice(0, 10);

    // Statistiques par décennie
    const decadeStats = {};
    tracks.forEach((track) => {
      if (track.decade) {
        decadeStats[track.decade] = (decadeStats[track.decade] || 0) + 1;
      }
    });

    // Durée moyenne
    const avgDuration =
      tracks.reduce((sum, t) => sum + t.duration, 0) / tracks.length;

    // Contenu explicite
    const explicitCount = tracks.filter((t) => t.explicit).length;
    const explicitPercent = Math.round((explicitCount / tracks.length) * 100);

    setStats({
      totalTracks: tracks.length,
      topArtists,
      decadeStats,
      avgDuration: Math.round(avgDuration),
      explicitPercent,
      explicitCount,
    });
  };

  useEffect(() => {
    performETL("top");
  }, []);

  const handleGenreChange = (genreId) => {
    setSelectedGenre(genreId);
    const genre = genres.find((g) => g.id === genreId);
    performETL(genre.query);
  };

  if (loading && !data.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4" />
          <p className="text-xl">Extraction des données en cours...</p>
          <p className="text-sm text-purple-300 mt-2">
            ETL Pipeline Deezer API
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Music className="w-10 h-10 text-purple-300" />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  OpenSound Analytics
                </h1>
                <p className="text-purple-300">
                  Système d'Information Décisionnel Musical
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                performETL(genres.find((g) => g.id === selectedGenre).query)
              }
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              Rafraîchir ETL
            </button>
          </div>

          {/* Sélecteur de genre */}
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => handleGenreChange(genre.id)}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedGenre === genre.id
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 text-purple-200 hover:bg-white/20"
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-300" />
            <p className="text-white">{error}</p>
          </div>
        )}

        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Music className="w-6 h-6 text-blue-300" />
                <p className="text-blue-200 text-sm">Total Tracks</p>
              </div>
              <p className="text-3xl font-bold text-white">
                {stats.totalTracks}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-green-300" />
                <p className="text-green-200 text-sm">Durée Moyenne</p>
              </div>
              <p className="text-3xl font-bold text-white">
                {Math.floor(stats.avgDuration / 60)}:
                {(stats.avgDuration % 60).toString().padStart(2, "0")}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-yellow-300" />
                <p className="text-yellow-200 text-sm">Contenu Explicite</p>
              </div>
              <p className="text-3xl font-bold text-white">
                {stats.explicitPercent}%
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-purple-300" />
                <p className="text-purple-200 text-sm">Top Artistes</p>
              </div>
              <p className="text-3xl font-bold text-white">
                {stats.topArtists.length}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Artistes */}
          {stats && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-purple-300" />
                <h2 className="text-xl font-bold text-white">
                  Top 10 Artistes par Popularité
                </h2>
              </div>
              <div className="space-y-3">
                {stats.topArtists.map((artist, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-white font-medium">{artist.name}</p>
                        <p className="text-purple-300 text-sm">
                          {artist.trackCount} track
                          {artist.trackCount > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-300 font-bold">
                        {artist.avgPopularity}
                      </p>
                      <p className="text-green-400 text-xs">Popularité</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Décennies */}
          {stats && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-blue-300" />
                <h2 className="text-xl font-bold text-white">
                  Distribution par Décennie
                </h2>
              </div>
              <div className="space-y-3">
                {Object.entries(stats.decadeStats)
                  .sort(([a], [b]) => b - a)
                  .map(([decade, count]) => {
                    const maxCount = Math.max(
                      ...Object.values(stats.decadeStats)
                    );
                    const percentage = (count / maxCount) * 100;
                    return (
                      <div key={decade}>
                        <div className="flex justify-between mb-1">
                          <span className="text-white font-medium">
                            {decade}s
                          </span>
                          <span className="text-blue-300">{count} tracks</span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Liste des tracks */}
        <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-green-300" />
            <h2 className="text-xl font-bold text-white">
              Catalogue Musical - Vue Détaillée
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-2 text-purple-300 font-semibold">
                    Titre
                  </th>
                  <th className="text-left py-3 px-2 text-purple-300 font-semibold">
                    Artiste
                  </th>
                  <th className="text-left py-3 px-2 text-purple-300 font-semibold">
                    Album
                  </th>
                  <th className="text-center py-3 px-2 text-purple-300 font-semibold">
                    Durée
                  </th>
                  <th className="text-center py-3 px-2 text-purple-300 font-semibold">
                    Année
                  </th>
                  <th className="text-center py-3 px-2 text-purple-300 font-semibold">
                    Popularité
                  </th>
                  <th className="text-center py-3 px-2 text-purple-300 font-semibold">
                    Explicite
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 20).map((track) => (
                  <tr
                    key={track.id}
                    className="border-b border-white/10 hover:bg-white/5 transition"
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={track.cover}
                          alt={track.title}
                          className="w-12 h-12 rounded"
                        />
                        <span className="text-white font-medium">
                          {track.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-purple-200">
                      {track.artist}
                    </td>
                    <td className="py-3 px-2 text-purple-300 text-sm">
                      {track.album}
                    </td>
                    <td className="py-3 px-2 text-center text-blue-300">
                      {track.durationFormatted}
                    </td>
                    <td className="py-3 px-2 text-center text-green-300">
                      {track.releaseYear || "N/A"}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="bg-purple-600/50 px-3 py-1 rounded-full text-white text-sm">
                        {track.popularity}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      {track.explicit ? (
                        <span className="text-red-400">🔞</span>
                      ) : (
                        <span className="text-green-400">✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights & Recommandations */}
        <div className="mt-6 bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-lg rounded-xl p-6 border border-purple-400/30">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Insights pour OpenSound Label
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-bold mb-2 text-purple-300">
                📊 Tendances Genres
              </h4>
              <p className="text-sm">
                Les genres{" "}
                {selectedGenre !== "all"
                  ? genres.find((g) => g.id === selectedGenre).name
                  : "mixtes"}{" "}
                dominent actuellement avec {data.length} tracks analysés.
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-bold mb-2 text-blue-300">
                ⏱️ Durée Optimale
              </h4>
              <p className="text-sm">
                La durée moyenne des hits est de{" "}
                {stats ? Math.floor(stats.avgDuration / 60) : 0} minutes, une
                référence pour vos productions.
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-bold mb-2 text-yellow-300">
                🔞 Contenu Explicite
              </h4>
              <p className="text-sm">
                {stats?.explicitPercent}% du catalogue contient du contenu
                explicite - à considérer pour le positionnement marketing.
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-bold mb-2 text-green-300">
                🎯 Recommandation
              </h4>
              <p className="text-sm">
                Focus sur les artistes {stats?.topArtists[0]?.name} qui dominent
                actuellement le marché.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenSoundDashboard;
