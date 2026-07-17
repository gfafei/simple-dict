import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  TextField,
  InputAdornment,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Drawer,
  Pagination,
  Button,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import HistoryIcon from '@mui/icons-material/History';
import { api, getUsername, setUsername, clearUsername } from './api/client.js';

function playAudio(word) {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
}

const EXCHANGE_LABELS = {
  p: 'Past tense',
  d: 'Past participle',
  i: 'Present participle',
  3: '3rd person singular',
  r: 'Comparative',
  t: 'Superlative',
  s: 'Plural',
};

function parseExchange(exchange) {
  if (!exchange) return [];
  return exchange
    .split('/')
    .map((pair) => {
      const [code, word] = pair.split(':');
      const label = EXCHANGE_LABELS[code];
      return label && word ? `${label}: ${word}` : null;
    })
    .filter(Boolean);
}

const FAVORITES_PAGE_SIZE = 10;

function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setChecking(true);
    setUsername(trimmed);
    try {
      await api.login();
      onLogin(trimmed);
    } catch {
      clearUsername();
      setError('Invalid username');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }}>
      <Typography variant="h5" gutterBottom>simple-dict</Typography>
      <Typography color="text.secondary" gutterBottom>Enter your username to continue.</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          fullWidth
          autoFocus
          label="Username"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          error={Boolean(error)}
          helperText={error}
        />
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={checking}>
          Continue
        </Button>
      </Box>
    </Container>
  );
}

function Dictionary({ username, onLogout }) {
  const [query, setQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favoritesSearch, setFavoritesSearch] = useState('');
  const [favoritesPage, setFavoritesPage] = useState(1);
  const [historyOpen, setHistoryOpen] = useState(false);
  const itemRefs = useRef([]);
  const queryClient = useQueryClient();

  const { data: results = [] } = useQuery({
    queryKey: ['search', query],
    queryFn: () => api.search(query),
    enabled: query.length > 0,
  });

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [results]);

  useEffect(() => {
    itemRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  const { data: detail } = useQuery({
    queryKey: ['word', selectedWord],
    queryFn: () => api.lookup(selectedWord),
    enabled: Boolean(selectedWord),
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', username],
    queryFn: api.getFavorites,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['history', username],
    queryFn: api.getHistory,
  });

  const isFavorite = favorites.some((f) => f.word === selectedWord);

  const filteredFavorites = favorites.filter((f) => {
    const term = favoritesSearch.trim().toLowerCase();
    if (!term) return true;
    return f.word.toLowerCase().includes(term) || f.translation?.toLowerCase().includes(term);
  });

  const favoritesPageCount = Math.max(1, Math.ceil(filteredFavorites.length / FAVORITES_PAGE_SIZE));
  const pagedFavorites = filteredFavorites.slice(
    (favoritesPage - 1) * FAVORITES_PAGE_SIZE,
    favoritesPage * FAVORITES_PAGE_SIZE
  );

  useEffect(() => {
    setFavoritesPage(1);
  }, [favoritesSearch, favoritesOpen]);

  const toggleFavorite = useMutation({
    mutationFn: () => (isFavorite ? api.removeFavorite(selectedWord) : api.addFavorite(selectedWord)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const removeFavorite = useMutation({
    mutationFn: (word) => api.removeFavorite(word),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const clearHistory = useMutation({
    mutationFn: () => api.clearHistory(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  });

  const selectWord = (word) => {
    setSelectedWord(word);
    setShowResults(false);
    api.addHistory(word).then(() => queryClient.invalidateQueries({ queryKey: ['history'] }));
  };

  const clearQuery = () => {
    setQuery('');
    setShowResults(false);
    setHighlightedIndex(-1);
    setSelectedWord(null);
  };

  const handleKeyDown = (e) => {
    if (!showResults || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      selectWord(results[highlightedIndex].word);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6">simple-dict</Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2">{username}</Typography>
            <IconButton color="inherit" onClick={() => setHistoryOpen(true)} aria-label="open history list">
              <HistoryIcon />
            </IconButton>
            <IconButton color="inherit" onClick={() => setFavoritesOpen(true)} aria-label="open favorites list">
              <FavoriteIcon />
            </IconButton>
            <IconButton color="inherit" onClick={onLogout} aria-label="switch user">
              <LogoutIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={favoritesOpen} onClose={() => setFavoritesOpen(false)}>
        <Box sx={{ width: 320, p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Favorites</Typography>
            <IconButton onClick={() => setFavoritesOpen(false)} aria-label="close favorites list">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <TextField
            fullWidth
            size="small"
            placeholder="Search favorites"
            value={favoritesSearch}
            onChange={(e) => setFavoritesSearch(e.target.value)}
            sx={{ mt: 2 }}
          />

          {filteredFavorites.length === 0 ? (
            <Typography color="text.secondary" sx={{ mt: 3 }}>
              {favorites.length === 0 ? 'No favorites yet.' : 'No matches.'}
            </Typography>
          ) : (
            <List sx={{ mt: 1, flexGrow: 1, overflowY: 'auto' }}>
              {pagedFavorites.map((f) => (
                <ListItemButton key={f.word} onClick={() => selectWord(f.word)}>
                  <ListItemText primary={f.word} secondary={f.translation} />
                  <IconButton
                    edge="end"
                    size="small"
                    aria-label={`remove ${f.word} from favorites`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite.mutate(f.word);
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </ListItemButton>
              ))}
            </List>
          )}

          {favoritesPageCount > 1 && (
            <Stack alignItems="center" sx={{ mt: 2 }}>
              <Pagination
                size="small"
                count={favoritesPageCount}
                page={favoritesPage}
                onChange={(e, page) => setFavoritesPage(page)}
              />
            </Stack>
          )}
        </Box>
      </Drawer>

      <Drawer anchor="right" open={historyOpen} onClose={() => setHistoryOpen(false)}>
        <Box sx={{ width: 320, p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">History</Typography>
            <IconButton onClick={() => setHistoryOpen(false)} aria-label="close history list">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          {history.length === 0 ? (
            <Typography color="text.secondary" sx={{ mt: 3 }}>No search history yet.</Typography>
          ) : (
            <List sx={{ mt: 1, flexGrow: 1, overflowY: 'auto' }}>
              {history.map((h) => (
                <ListItemButton key={h.word} onClick={() => selectWord(h.word)}>
                  <ListItemText primary={h.word} secondary={h.translation} />
                </ListItemButton>
              ))}
            </List>
          )}

          {history.length > 0 && (
            <Button
              color="error"
              size="small"
              sx={{ mt: 2 }}
              onClick={() => clearHistory.mutate()}
            >
              Clear history
            </Button>
          )}
        </Box>
      </Drawer>

      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <TextField
          fullWidth
          label="Search a word"
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            setShowResults(true);
            if (value === '') {
              setSelectedWord(null);
            }
          }}
          onKeyDown={handleKeyDown}
          InputProps={{
            endAdornment: query && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={clearQuery} aria-label="clear search">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {showResults && results.length > 0 && (
          <List sx={{ mt: 1, maxHeight: 320, overflowY: 'auto' }}>
            {results.map((r, i) => (
              <ListItemButton
                key={r.id}
                ref={(el) => (itemRefs.current[i] = el)}
                selected={i === highlightedIndex}
                onClick={() => selectWord(r.word)}
              >
                <ListItemText primary={r.word} secondary={r.translation} />
              </ListItemButton>
            ))}
          </List>
        )}

        {detail && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="h5">{detail.word}</Typography>
                  <IconButton onClick={() => playAudio(detail.word)} size="small">
                    <VolumeUpIcon fontSize="small" />
                  </IconButton>
                </Stack>
                <IconButton onClick={() => toggleFavorite.mutate()}>
                  {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                </IconButton>
              </Stack>

              {detail.phonetic && <Typography color="text.secondary">/{detail.phonetic}/</Typography>}

              {detail.definition && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">Definition</Typography>
                  <Typography whiteSpace="pre-line">{detail.definition}</Typography>
                </Box>
              )}

              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">Translation</Typography>
                <Typography whiteSpace="pre-line">{detail.translation}</Typography>
              </Box>

              {parseExchange(detail.exchange).length > 0 && (
                <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
                  {parseExchange(detail.exchange).map((form) => (
                    <Chip key={form} label={form} size="small" variant="outlined" />
                  ))}
                </Stack>
              )}

              {(detail.bnc || detail.frq) && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  {detail.bnc && `BNC rank: ${detail.bnc}`}
                  {detail.bnc && detail.frq && ' · '}
                  {detail.frq && `Frequency rank: ${detail.frq}`}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
      </Container>
    </>
  );
}

export default function App() {
  const [username, setUsernameState] = useState(getUsername());

  if (!username) {
    return <Login onLogin={setUsernameState} />;
  }

  return (
    <Dictionary
      username={username}
      onLogout={() => {
        clearUsername();
        setUsernameState(null);
      }}
    />
  );
}
