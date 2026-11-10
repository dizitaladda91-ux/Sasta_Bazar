import { useEffect, useState } from 'react';
import { api } from '../services/api';

export function useStorefrontContent(key) {
  const [state, setState] = useState({ content: null, loading: true, error: '' });

  useEffect(() => {
    let active = true;
    setState({ content: null, loading: true, error: '' });
    api.getContent(key)
      .then((content) => active && setState({ content, loading: false, error: '' }))
      .catch((error) => active && setState({ content: null, loading: false, error: error.message }));
    return () => { active = false; };
  }, [key]);

  return state;
}
