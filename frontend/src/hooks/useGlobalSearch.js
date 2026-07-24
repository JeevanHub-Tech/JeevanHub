import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../config";

const RESULT_ADAPTERS = {
  doctor: (item) => ({ key: item.id, label: item.name, to: "/doctors" }),
  medicine: (item) => ({
    key: item._id || item.id,
    label: item.name,
    to: item._id || item.id ? `/medicines/${item._id || item.id}` : "/medicines",
  }),
  "blogs-videos": (item) => ({ key: item.id || item._id, label: item.title, to: "/blogs-videos" }),
  "diet-yoga": (item) => ({ key: item._id || item.name, label: item.name, to: "/diet-yoga" }),
  disease: (item) => ({
    key: item._id || item.id,
    label: item.name,
    to: item._id || item.id ? `/medicines/${item._id || item.id}` : "/medicines",
  }),
};

export function adaptSearchResults(type, data) {
  const adapt = RESULT_ADAPTERS[type];
  if (!adapt || !Array.isArray(data)) return [];
  return data.map(adapt).filter((result) => result.label);
}

export function useGlobalSearch(type) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed || !type) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return undefined;
    }

    const requestId = ++requestIdRef.current;
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/search`, { params: { s: trimmed, type } });
        if (requestId !== requestIdRef.current) return;
        setResults(adaptSearchResults(type, response.data));
        setOpen(true);
      } catch (error) {
        console.error("Global search failed", error);
        if (requestId === requestIdRef.current) setResults([]);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, type]);

  const clear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return { query, setQuery, results, loading, open, setOpen, clear };
}
