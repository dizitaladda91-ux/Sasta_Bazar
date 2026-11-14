import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertTopLevelStockAllowed, getIncomingVariants, replaceProductVariants
} from './productRules.js';

test('rejects top-level stock for products with multiple variants', () => {
  assert.throws(
    () => assertTopLevelStockAllowed(5, 2),
    (error) => error.status === 409 && /each variant/.test(error.message)
  );
});

test('allows top-level stock when a product has at most one variant', () => {
  assert.doesNotThrow(() => assertTopLevelStockAllowed(5, 1));
  assert.doesNotThrow(() => assertTopLevelStockAllowed(undefined, 4));
});

test('counts generated variants when validating top-level stock', () => {
  const variants = getIncomingVariants({ sizes: ['S', 'M'], colors: ['Black', 'Blue'] }, 10, null);
  assert.equal(variants.length, 4);
});

test('upserts matching variants without deleting IDs and deactivates omitted variants', async () => {
  const rows = [
    { id: '11', external_id: 'variant-11', stock: 7, is_available: true },
    { id: '12', external_id: 'variant-12', stock: 4, is_available: true }
  ];
  const statements = [];
  const client = {
    async query(sql, values) {
      statements.push(sql);
      if (sql.startsWith('SELECT id, external_id')) return { rows: rows.map(({ id, external_id }) => ({ id, external_id })) };
      if (sql.startsWith('UPDATE variants SET external_id')) {
        const [id, , title, size, color, stock, isAvailable] = values;
        Object.assign(rows.find((row) => row.id === id), { title, size, color, stock, is_available: isAvailable });
        return { rows: [] };
      }
      if (sql.startsWith('INSERT INTO variants')) {
        rows.push({ id: '13', external_id: values[1], stock: values[5], is_available: values[6] });
        return { rows: [{ id: '13' }] };
      }
      if (sql.startsWith('UPDATE variants SET is_available=FALSE')) {
        for (const row of rows) {
          if (!values[1].includes(row.id)) Object.assign(row, { stock: 0, is_available: false });
        }
        return { rows: [] };
      }
      throw new Error(`Unexpected SQL in test: ${sql}`);
    }
  };

  await replaceProductVariants(client, '5', [
    { id: 'variant-11', title: 'Updated', stock: 9, price: 12 },
    { id: 'variant-new', title: 'New', price: 10 }
  ], { price: 10 });

  assert.equal(rows.find((row) => row.id === '11').stock, 9);
  assert.equal(rows.find((row) => row.id === '13').external_id, 'variant-new');
  assert.deepEqual(
    { stock: rows.find((row) => row.id === '12').stock, available: rows.find((row) => row.id === '12').is_available },
    { stock: 0, available: false }
  );
  assert.equal(statements.some((sql) => sql.startsWith('DELETE FROM variants')), false);
});
