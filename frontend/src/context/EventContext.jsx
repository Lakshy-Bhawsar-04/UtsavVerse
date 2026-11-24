/**
 * src/context/EventContext.jsx
 * Shared catalog state for event categories, cities, featured events, and upcoming events.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const EventContext = createContext(null);

export const EventProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const loadHomeCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const [catRes, cityRes, featRes, upRes] = await Promise.all([
        api.get('/events/categories'),
        api.get('/events/cities'),
        api.get('/events/featured'),
        api.get('/events/upcoming'),
      ]);
      setCategories(catRes.data.categories || []);
      setCities(cityRes.data.cities || []);
      setFeaturedEvents(featRes.data.events || []);
      setUpcomingEvents(upRes.data.events || []);
    } catch (err) {
      console.error('Failed to load event catalog:', err.message);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomeCatalog();
  }, [loadHomeCatalog]);

  return (
    <EventContext.Provider
      value={{
        categories,
        cities,
        featuredEvents,
        upcomingEvents,
        catalogLoading,
        refreshCatalog: loadHomeCatalog,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvents must be used inside EventProvider');
  return ctx;
};
