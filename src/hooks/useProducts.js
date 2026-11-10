import { useEffect, useState } from 'react';
import { api } from '../services/api';

export function useProducts(params = {}) {
  const key = JSON.stringify(params);
  const [state, setState] = useState({ products: [], loading: true, error: '' });

  useEffect(() => {
    let active = true;
    const requestParams = JSON.parse(key);
    const enabled = requestParams.enabled !== false;
    delete requestParams.enabled;
    if (!enabled) {
      setState({ products: [], loading: false, error: '' });
      return () => { active = false; };
    }
    setState((current) => ({ ...current, loading: true, error: '' }));
    api.getProducts(requestParams)
      .then((products) => active && setState({ products, loading: false, error: '' }))
      .catch((error) => active && setState({ products: [], loading: false, error: error.message }));
    return () => { active = false; };
  }, [key]);

  return state;
}
