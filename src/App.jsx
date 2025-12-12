import { useState, useEffect } from "react";
import {
  Music,
  TrendingUp,
  Clock,
  Users,
  BarChart3,
  Loader2,
  AlertCircle,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

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
      const response = await fetch(
        `http://localhost:8000/api/etl/${genreQuery}`
      );
      if (!response.ok) throw new Error("Erreur lors de l'ETL");
      const result = await response.json();
      setData(result.data);
      calculateStats(result.data);
    } catch (err) {
      setError(err.message);
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

  const barData = stats?.topArtists || [];

  const pieData = stats
    ? [
        { name: "Explicite", value: stats.explicitCount },
        {
          name: "Non explicite",
          value: stats.totalTracks - stats.explicitCount,
        },
      ]
    : [];

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

          {/* ANALYSE VISUELLE – GRAPHIQUES */}
          {stats && (
            <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-green-300" />
                Analyse visuelle du catalogue
              </h2>

              {/* BAR CHART – Top artistes */}
              <div className="mb-10">
                <h3 className="text-white font-semibold mb-3">
                  Top artistes par popularité moyenne
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData}>
                    <XAxis
                      dataKey="name"
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgPopularity" fill="#a855f7" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* PIE CHART – Contenu explicite */}
              <div className="mb-10">
                <h3 className="text-white font-semibold mb-3">
                  Répartition du contenu explicite
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label
                    >
                      <Cell fill="#FFFF00" />
                      <Cell fill="#7f00ff" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
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
                          src={track.cover_url}
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
                Tendances Genres
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
                Durée Optimale
              </h4>
              <p className="text-sm">
                La durée moyenne des hits est de{" "}
                {stats ? Math.floor(stats.avgDuration / 60) : 0} minutes, une
                référence pour vos productions.
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-bold mb-2 text-yellow-300">
                Contenu Explicite
              </h4>
              <p className="text-sm">
                {stats?.explicitPercent}% du catalogue contient du contenu
                explicite - à considérer pour le positionnement marketing.
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-bold mb-2 text-green-300">
                Recommandation
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
