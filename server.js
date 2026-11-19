const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:4200',        // Desarrollo local
  'https://burtsa.netlify.app',   // Netlify
  'https://www.txemaserrano.com',
  'http://www.txemaserrano.com',
  'https://txemaserrano.com',
  'http://txemaserrano.com'
];

app.use(cors({
  origin(origin, callback) {
    // Permitir peticiones sin origin (Postman, curl, health checks de Render)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.log(`CORS bloqueado: ${origin}`);
    // false en vez de Error: así no se convierte en un 500 sin cabeceras
    return callback(null, false);
  },
  credentials: true
}));

// Log sencillo de peticiones
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// ---------------------------------------------------------------------------
// Acceso a Yahoo Finance (con caché, límite de concurrencia y reintentos)
// ---------------------------------------------------------------------------
const YAHOO_HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];

const YAHOO_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept': 'application/json,text/plain,*/*',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
};

const CACHE_TTL_MS = 60 * 1000;          // datos "frescos": 1 minuto
const STALE_MAX_MS = 6 * 60 * 60 * 1000; // si Yahoo falla, servir último dato hasta 6 h
const MAX_CONCURRENT = 5;                // máx. peticiones simultáneas a Yahoo

const cache = new Map();    // SYMBOL -> { ts, result }
const inflight = new Map(); // SYMBOL -> Promise (evita duplicar peticiones iguales)

// Limitador de concurrencia sencillo
let active = 0;
const queue = [];
function limit(task) {
  return new Promise((resolve, reject) => {
    const run = () => {
      active++;
      task()
        .then(resolve, reject)
        .finally(() => {
          active--;
          if (queue.length) queue.shift()();
        });
    };
    if (active < MAX_CONCURRENT) run();
    else queue.push(run);
  });
}

async function fetchChart(symbol) {
  let lastError;

  for (const host of YAHOO_HOSTS) {
    try {
      const url = `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}`;
      const { data } = await axios.get(url, {
        params: { interval: '1d', range: '1d' },
        headers: YAHOO_HEADERS,
        timeout: 10000
      });

      const result = data && data.chart && data.chart.result && data.chart.result[0];
      if (!result) {
        const desc = data && data.chart && data.chart.error && data.chart.error.description;
        throw new Error(desc || 'Respuesta vacía de Yahoo');
      }
      return result;
    } catch (err) {
      lastError = err;
      const status = err.response && err.response.status;
      console.warn(`Yahoo (${host}) falló para ${symbol}: ${status || ''} ${err.message}`);
      if (status === 404) break; // el símbolo no existe, no tiene sentido reintentar
    }
  }
  throw lastError;
}

async function getChart(symbol) {
  const key = symbol.toUpperCase();
  const hit = cache.get(key);

  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) {
    return { result: hit.result, stale: false };
  }
  if (inflight.has(key)) return inflight.get(key);

  const promise = limit(() => fetchChart(key))
    .then((result) => {
      cache.set(key, { ts: Date.now(), result });
      return { result, stale: false };
    })
    .catch((err) => {
      // Si Yahoo falla pero tenemos un dato reciente, lo servimos marcado como "stale"
      if (hit && Date.now() - hit.ts < STALE_MAX_MS) {
        console.warn(`Sirviendo dato en caché (stale) para ${key}`);
        return { result: hit.result, stale: true };
      }
      throw err;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// Utilidades de transformación
// ---------------------------------------------------------------------------
function lastValid(arr) {
  if (!Array.isArray(arr)) return null;
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i] != null) return arr[i];
  return null;
}
function firstValid(arr) {
  if (!Array.isArray(arr)) return null;
  for (let i = 0; i < arr.length; i++) if (arr[i] != null) return arr[i];
  return null;
}
const pick = (...vals) => vals.find((v) => v != null);

function toQuote(result, stale) {
  const meta = result.meta || {};
  const q = (result.indicators && result.indicators.quote && result.indicators.quote[0]) || {};

  const price = meta.regularMarketPrice;
  const prev = pick(meta.chartPreviousClose, meta.previousClose);
  if (price == null || prev == null) throw new Error('Yahoo no devolvió precio o cierre anterior');

  return {
    c: price,
    d: price - prev,
    dp: ((price - prev) / prev) * 100,
    h: pick(meta.regularMarketDayHigh, lastValid(q.high), price),
    l: pick(meta.regularMarketDayLow, lastValid(q.low), price),
    o: pick(firstValid(q.open), price),
    pc: prev,
    t: meta.regularMarketTime,
    volume: pick(meta.regularMarketVolume, lastValid(q.volume), 0),
    stale: stale === true
  };
}

function toIndex(symbol, result, stale) {
  const meta = result.meta || {};
  const price = meta.regularMarketPrice;
  const prev = pick(meta.chartPreviousClose, meta.previousClose);
  if (price == null || prev == null) throw new Error('Yahoo no devolvió precio o cierre anterior');

  return {
    name: symbol,
    value: price,
    change: price - prev,
    changePercent: ((price - prev) / prev) * 100,
    timestamp: new Date(meta.regularMarketTime * 1000).toISOString(),
    stale: stale === true
  };
}

function sendUpstreamError(res, what, symbol, error) {
  const status = error.response && error.response.status;
  console.error(`Error obteniendo ${what} ${symbol}: ${status || ''} ${error.message}`);
  res.status(status === 404 ? 404 : 502).json({
    error: `No se pudo obtener ${what}`,
    symbol,
    message: error.message
  });
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

// Cotización de una acción
app.get('/api/quote/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    const { result, stale } = await getChart(symbol);
    res.json(toQuote(result, stale));
  } catch (error) {
    sendUpstreamError(res, 'la cotización', symbol, error);
  }
});

// Datos de un índice (p. ej. ^IBEX)
app.get('/api/index/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    const { result, stale } = await getChart(symbol);
    res.json(toIndex(symbol, result, stale));
  } catch (error) {
    sendUpstreamError(res, 'el índice', symbol, error);
  }
});

// Varias cotizaciones de una vez: /api/quotes?symbols=SAN.MC,BBVA.MC,...
// (para que el frontend pueda hacer 1 petición en vez de 35)
app.get('/api/quotes', async (req, res) => {
  const symbols = String(req.query.symbols || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 60);

  if (!symbols.length) {
    return res.status(400).json({ error: 'Falta el parámetro symbols' });
  }

  const settled = await Promise.allSettled(
    symbols.map(async (s) => {
      const { result, stale } = await getChart(s);
      return toQuote(result, stale);
    })
  );

  const out = {};
  settled.forEach((r, i) => {
    out[symbols[i]] = r.status === 'fulfilled' ? r.value : { error: r.reason.message };
  });
  res.json(out);
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cachedSymbols: cache.size
  });
});

// Ruta raíz
app.get('/', (_req, res) => {
  res.json({
    name: 'Burtsa Backend API',
    version: '1.1.0',
    endpoints: {
      quote: '/api/quote/:symbol',
      index: '/api/index/:symbol',
      quotes: '/api/quotes?symbols=SAN.MC,BBVA.MC',
      health: '/health'
    }
  });
});

// ===========================================================================
// HISTÓRICO para gráficas e indicadores técnicos.
// PEGAR en server.js JUSTO ANTES del bloque "// 404" (no sustituye nada).
// Reutiliza axios, YAHOO_HOSTS, YAHOO_HEADERS y limit() que ya existen en el
// server.js de la versión 1.1.0.
// ===========================================================================
const HISTORY_TTL_MS = 30 * 60 * 1000;       // el dato diario cambia poco: 30 min
const HISTORY_STALE_MAX_MS = 24 * 60 * 60 * 1000;
const historyCache = new Map();               // SYMBOL -> { ts, data }
const historyInflight = new Map();

async function fetchHistory(symbol) {
  let lastError;
  for (const host of YAHOO_HOSTS) {
    try {
      const { data } = await axios.get(
        `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}`,
        { params: { interval: '1d', range: '5y' }, headers: YAHOO_HEADERS, timeout: 20000 }
      );
      const result = data && data.chart && data.chart.result && data.chart.result[0];
      if (!result || !Array.isArray(result.timestamp)) {
        const desc = data && data.chart && data.chart.error && data.chart.error.description;
        throw new Error(desc || 'Yahoo no devolvió histórico');
      }
      const q = (result.indicators && result.indicators.quote && result.indicators.quote[0]) || {};
      const candles = [];
      result.timestamp.forEach((t, i) => {
        const c = q.close && q.close[i];
        if (c == null) return; // sesiones sin dato
        candles.push({
          t,
          o: q.open && q.open[i] != null ? q.open[i] : c,
          h: q.high && q.high[i] != null ? q.high[i] : c,
          l: q.low && q.low[i] != null ? q.low[i] : c,
          c,
          v: q.volume && q.volume[i] != null ? q.volume[i] : 0
        });
      });
      if (!candles.length) throw new Error('Histórico vacío');
      return { symbol, currency: (result.meta && result.meta.currency) || 'EUR', candles };
    } catch (err) {
      lastError = err;
      const status = err.response && err.response.status;
      console.warn(`Yahoo (${host}) histórico falló para ${symbol}: ${status || ''} ${err.message}`);
      if (status === 404) break;
    }
  }
  throw lastError;
}

async function getHistory(symbol) {
  const key = symbol.toUpperCase();
  const hit = historyCache.get(key);
  if (hit && Date.now() - hit.ts < HISTORY_TTL_MS) return { ...hit.data, stale: false };
  if (historyInflight.has(key)) return historyInflight.get(key);

  const p = limit(() => fetchHistory(key))
    .then((data) => {
      historyCache.set(key, { ts: Date.now(), data });
      return { ...data, stale: false };
    })
    .catch((err) => {
      if (hit && Date.now() - hit.ts < HISTORY_STALE_MAX_MS) return { ...hit.data, stale: true };
      throw err;
    })
    .finally(() => historyInflight.delete(key));
  historyInflight.set(key, p);
  return p;
}

// GET /api/history/:symbol  ->  { symbol, currency, candles:[{t,o,h,l,c,v}], stale }
app.get('/api/history/:symbol', async (req, res) => {
  const { symbol } = req.params;
  if (!/^[\^A-Za-z0-9.\-=]{1,20}$/.test(symbol)) {
    return res.status(400).json({ error: 'Símbolo no válido' });
  }
  try {
    res.json(await getHistory(symbol));
  } catch (error) {
    sendUpstreamError(res, 'el histórico', symbol, error);
  }
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Manejador de errores general (evita que Express devuelva HTML)
app.use((err, _req, res, _next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno', message: err.message });
});

// Que un fallo puntual no tumbe el proceso
process.on('unhandledRejection', (reason) => console.error('unhandledRejection:', reason));
process.on('uncaughtException', (err) => console.error('uncaughtException:', err));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nBackend corriendo en puerto ${PORT}`);
  console.log('Endpoints: /api/quote/:symbol  /api/index/:symbol  /api/quotes  /health\n');
});
