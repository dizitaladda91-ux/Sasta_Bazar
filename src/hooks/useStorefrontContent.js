import { useEffect, useState } from 'react';
import { api } from '../services/api';

const contentCache = new Map();
const contentRequests = new Map();

function loadContent(key) {
  if (contentCache.has(key)) return Promise.resolve(contentCache.get(key));
  if (!contentRequests.has(key)) {
    const request = api.getContent(key)
      .then((content) => {
        contentCache.set(key, content);
        return content;
      })
      .finally(() => contentRequests.delete(key));
    contentRequests.set(key, request);
  }
  return contentRequests.get(key);
}

export function useStorefrontContent(key) {
  const [state, setState] = useState({ content: null, loading: true, error: '' });

  useEffect(() => {
    let active = true;
    setState({ content: null, loading: true, error: '' });
    loadContent(key)
      .then((content) => active && setState({ content, loading: false, error: '' }))
      .catch((error) => active && setState({ content: null, loading: false, error: error.message }));
    return () => { active = false; };
  }, [key]);

  return state;
}
