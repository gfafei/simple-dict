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
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ClearIcon from '@mui/icons-material/Clear';
import { api } from './api/client.js';

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

export default function App() {
  const [query, setQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
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
    queryKey: ['favorites'],
    queryFn: api.getFavorites,
  });

  const isFavorite = favorites.some((f) => f.word === selectedWord);

  const toggleFavorite = useMutation({
    mutationFn: () => (isFavorite ? api.removeFavorite(selectedWord) : api.addFavorite(selectedWord)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const selectWord = (word) => {
    setSelectedWord(word);
    setShowResults(false);
    api.addHistory(word);
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
        <Toolbar>
          <Typography variant="h6">simple-dict</Typography>
        </Toolbar>
      </AppBar>

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
