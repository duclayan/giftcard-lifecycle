import MapView from './components/MapView';


import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent
} from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';

import giftCardsData from './data/GiftCards.json';
import giftCardEventsData from './data/GiftCardEvents.json';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';

function App() {
  const [search, setSearch] = useState({
    giftcard: '',
    status: '',
    channel: '',
    ip: '',
  });
  const [giftCards, setGiftCards] = useState([]);
  const [giftCardEvents, setGiftCardEvents] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [filteredCards, setFilteredCards] = useState([]);
  // Azure Maps subscription key (should be in .env or config in real app)
  const azureMapsKey = process.env.REACT_APP_AZURE_MAPS_KEY || '';

  // Aggregate geoPoints for MapView: group cards by lat/lon
  const geoPoints = React.useMemo(() => {
    const map = new Map();
    giftCards.forEach(card => {
      // Parse GeoLocation as "lat,lon"
      let lat = null, lon = null;
      if (card.GeoLocation && card.GeoLocation.includes(',')) {
        const [latStr, lonStr] = card.GeoLocation.split(',');
        lat = parseFloat(latStr);
        lon = parseFloat(lonStr);
      }
      if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
        const key = `${lat},${lon}`;
        if (!map.has(key)) map.set(key, { lat, lon, cards: [] });
        map.get(key).cards.push(card);
      }
    });
    return Array.from(map.values());
  }, [giftCards]);


  // Sorting state
  const [sortBy, setSortBy] = useState('giftcard');
  const [sortOrder, setSortOrder] = useState('asc');

  // Sorting handler
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Sorted cards
  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === 'giftcard') {
      return sortOrder === 'asc'
        ? a.GiftCardNumber.localeCompare(b.GiftCardNumber)
        : b.GiftCardNumber.localeCompare(a.GiftCardNumber);
    }
    if (sortBy === 'ip') {
      return sortOrder === 'asc'
        ? a.IPAddress.localeCompare(b.IPAddress)
        : b.IPAddress.localeCompare(a.IPAddress);
    }
    if (sortBy === 'risk') {
      const aEvents = giftCardEvents.filter(ev => ev.GiftCardID === a.GiftCardID);
      const bEvents = giftCardEvents.filter(ev => ev.GiftCardID === b.GiftCardID);
      const aErrors = aEvents.filter(ev => ev.ErrorCode).length;
      const bErrors = bEvents.filter(ev => ev.ErrorCode).length;
      const aScore = aEvents.length > 0 ? aErrors / aEvents.length : 0;
      const bScore = bEvents.length > 0 ? bErrors / bEvents.length : 0;
      return sortOrder === 'asc' ? aScore - bScore : bScore - aScore;
    }
    return 0;
  });

  useEffect(() => {
    setGiftCards(giftCardsData);
    setGiftCardEvents(giftCardEventsData);
    setFilteredCards(giftCardsData);
  }, []);

  const handleChange = (e) => {
    setSearch({ ...search, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    let filtered = giftCards;
    if (search.giftcard) {
      filtered = filtered.filter(card => card.GiftCardNumber.includes(search.giftcard));
    }
    if (search.status) {
      filtered = filtered.filter(card => card.Status.toLowerCase().includes(search.status.toLowerCase()));
    }
    if (search.channel) {
      filtered = filtered.filter(card => card.PurchaseChannel.toLowerCase().includes(search.channel.toLowerCase()));
    }
    if (search.ip) {
      filtered = filtered.filter(card => card.IPAddress.includes(search.ip));
    }
    setFilteredCards(filtered);
  };

  const handleSelectCard = (card) => {
    setSelectedCard(card);
  };

  // Get events for selected card, sorted by most recent first
  const selectedEvents = selectedCard
    ? giftCardEvents
        .filter(ev => ev.GiftCardID === selectedCard.GiftCardID)
        .sort((a, b) => new Date(b.EventDate) - new Date(a.EventDate))
    : [];

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="giftcard" sx={{ mr: 2, fontSize: 32 }}>
            <span role="img" aria-label="giftcard"> : </span>
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            GiftCard LifeCycle Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        {/* MapView for all gift card locations */}
        <Box sx={{ mb: 4 }}>
          <MapView
            subscriptionKey={azureMapsKey}
            geoPoints={geoPoints}
            height={400}
            selectedCard={selectedCard}
          />
        </Box>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 2 }}>
          GiftCard LifeCycle Dashboard
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={12}>
            <Paper elevation={3} sx={{ p: 2, width: '100%', maxWidth: 1200, mx: 'auto' }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <TextField label="Gift Card Number" name="giftcard" value={search.giftcard} onChange={handleChange} size="small" sx={{ flex: 1 }} />
                <TextField label="Status" name="status" value={search.status} onChange={handleChange} size="small" sx={{ flex: 1 }} />
                <TextField label="Channel" name="channel" value={search.channel} onChange={handleChange} size="small" sx={{ flex: 1 }} />
                <TextField label="IP Address" name="ip" value={search.ip} onChange={handleChange} size="small" sx={{ flex: 1 }} />
                <Button variant="contained" onClick={handleSearch} sx={{ minWidth: 120 }}>Search</Button>
              </Box>
              {/* Sorting controls */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button variant={sortBy === 'giftcard' ? 'contained' : 'outlined'} onClick={() => handleSortChange('giftcard')}>
                  Sort by Gift Card Number {sortBy === 'giftcard' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </Button>
                <Button variant={sortBy === 'risk' ? 'contained' : 'outlined'} onClick={() => handleSortChange('risk')}>
                  Sort by Risk Score {sortBy === 'risk' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </Button>
                <Button variant={sortBy === 'ip' ? 'contained' : 'outlined'} onClick={() => handleSortChange('ip')}>
                  Sort by IP Address {sortBy === 'ip' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </Button>
              </Box>
              <TableContainer component={Paper} sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <Box component="span" sx={{ cursor: 'help' }}>
                          <Typography variant="body2">Gift Card Number</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box component="span" sx={{ cursor: 'help' }}>
                          <Typography variant="body2">Status</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box component="span" sx={{ cursor: 'help' }}>
                          <Typography variant="body2">Balance</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box component="span" sx={{ cursor: 'help' }}>
                          <Typography variant="body2">Channel</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box component="span" sx={{ cursor: 'help' }}>
                          <Typography variant="body2">Date Created</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box component="span" sx={{ cursor: 'help' }}>
                          <Typography variant="body2">IP Address</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box component="span" sx={{ cursor: 'help' }}>
                          <Typography variant="body2">GeoLocation</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box component="span" sx={{ cursor: 'help' }}>
                          <Typography variant="body2">Risk Score</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedCards.map(card => {
                      const events = giftCardEvents.filter(ev => ev.GiftCardID === card.GiftCardID);
                      const errorEvents = events.filter(ev => ev.ErrorCode);
                      const riskScore = events.length > 0 ? ((errorEvents.length / events.length) * 100).toFixed(0) : '0';
                      let riskColor = 'success.main';
                      const scoreNum = Number(riskScore);
                      if (scoreNum > 30) riskColor = 'error.main';
                      else if (scoreNum > 10) riskColor = 'warning.main';
                      // Tooltip text for risk score
                      let riskTip = 'Low risk: minimal suspicious activity.';
                      if (scoreNum > 30) riskTip = 'High risk: frequent errors/events. Investigate for fraud or abuse.';
                      else if (scoreNum > 10) riskTip = 'Medium risk: some suspicious activity detected.';
                      return (
                        <TableRow
                          key={card.GiftCardID}
                          hover
                          selected={selectedCard && selectedCard.GiftCardID === card.GiftCardID}
                          onClick={() => handleSelectCard(card)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>
                            <Box component="span" sx={{ cursor: 'help' }} title="Unique identifier for this gift card. Used for tracking and auditing.">{card.GiftCardNumber}</Box>
                          </TableCell>
                          <TableCell>
                            <Box component="span" sx={{ cursor: 'help' }} title="Current status of the gift card. Watch for unexpected changes or suspicious states.">{card.Status}</Box>
                          </TableCell>
                          <TableCell>
                            <Box component="span" sx={{ cursor: 'help' }} title="Current balance. Unusual changes may indicate fraud.">{card.Balance}</Box>
                          </TableCell>
                          <TableCell>
                            <Box component="span" sx={{ cursor: 'help' }} title="Channel where the card was purchased. Some channels may be more prone to abuse.">{card.PurchaseChannel}</Box>
                          </TableCell>
                          <TableCell>
                            <Box component="span" sx={{ cursor: 'help' }} title="Date the card was created. Useful for identifying stale or recently issued cards.">{card.DateCreated}</Box>
                          </TableCell>
                          <TableCell>
                            <Box component="span" sx={{ cursor: 'help' }} title="IP address associated with card activity. Multiple cards from the same IP may indicate bot or fraud.">{card.IPAddress}</Box>
                          </TableCell>
                          <TableCell>
                            <Box component="span" sx={{ cursor: 'help' }} title="Geolocation of card activity. Unusual locations may indicate risk.">{card.GeoLocation}</Box>
                          </TableCell>
                          <TableCell sx={{ color: riskColor, fontWeight: 'bold' }}>
                            <Box component="span" sx={{ cursor: 'help' }} title={riskTip}>{riskScore}%</Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
        {selectedCard && (
          <Card elevation={3} sx={{ mb: 2, width: '100%', maxWidth: 1200, mx: 'auto' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Gift Card Details</Typography>
              <Typography variant="body2"><b>Number:</b> {selectedCard.GiftCardNumber}</Typography>
              <Typography variant="body2"><b>Status:</b> {selectedEvents.length > 0 ? selectedEvents[0].EventType : selectedCard.Status}</Typography>
              <Typography variant="body2"><b>Balance:</b> ${selectedCard.Balance}</Typography>
              <Typography variant="body2"><b>Channel:</b> {selectedCard.PurchaseChannel}</Typography>
              <Typography variant="body2"><b>Date Created:</b> {selectedCard.DateCreated}</Typography>
              <Typography variant="body2"><b>IP Address:</b> {selectedCard.IPAddress}</Typography>
              <Typography variant="body2"><b>GeoLocation:</b> {selectedCard.GeoLocation}</Typography>
            </CardContent>
          </Card>
        )}
        {selectedCard && (
          <Paper elevation={3} sx={{ p: 2, width: '100%', maxWidth: 1200, mx: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Event Timeline</Typography>
            <Timeline position="right" sx={{ width: '100%' }}>
              {selectedEvents.length > 0 ? (
                selectedEvents.map((ev, idx) => {
                  let dotColor = 'primary';
                  if (ev.ErrorCode) dotColor = 'error';
                  else if (/Redemption|Issuance|BalanceInquiry|Cancellation|Expiration/i.test(ev.EventType)) dotColor = 'success';
                  return (
                    <TimelineItem key={ev.EventID}>
                      <TimelineSeparator>
                        <TimelineDot color={dotColor} />
                        {idx < selectedEvents.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="body2" color="text.secondary">{ev.EventDate}</Typography>
                        <Typography variant="subtitle2">{ev.EventType} {ev.Amount ? `($${ev.Amount})` : ''}</Typography>
                        {ev.ErrorCode && <Typography variant="body2" color="error">Error: {ev.ErrorCode}</Typography>}
                        <Typography variant="body2">IP: {ev.IPAddress} | Geo: {ev.GeoLocation}</Typography>
                      </TimelineContent>
                    </TimelineItem>
                  );
                })
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ m: 2 }}>
                  No events found for this gift card.
                </Typography>
              )}
            </Timeline>
          </Paper>
        )}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="subtitle1">
            Total Gift Cards: {giftCards.length} | Total Events: {giftCardEvents.length}
          </Typography>
        </Box>
      </Container>
    </>
  );
}



export default App;
