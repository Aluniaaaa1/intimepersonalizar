import crypto from 'node:crypto';

const OWNER = (process.env.GITHUB_REPO || 'Aluniaaaa1/catalogo-in-time.').split('/')[0];
const REPO = (process.env.GITHUB_REPO || 'Aluniaaaa1/catalogo-in-time.').split('/')[1];
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;
const COOKIE = 'intime_admin';

function sign(payload) {
  return crypto.createHmac('sha256', process.env.SESSION_SECRET || '').update(payload).digest('base64url');
}
function newSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}
function isAuthenticated(event) {
  const raw = event.headers?.cookie || event.headers?.Cookie || '';
  const token = raw.split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now(); } catch { return false; }
}
function reply(statusCode, data, headers = {}) {
  return { statusCode, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }, body: JSON.stringify(data) };
}
function sessionCookie(value, age = 28800) {
  return `${COOKIE}=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${age}`;
}
async function gh(path, options = {}) {
  if (!process.env.GITHUB_TOKEN) throw new Error('Falta GITHUB_TOKEN en las variables de Netlify.');
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(options.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `GitHub respondió ${res.status}`);
  return data;
}
async function currentHead() {
  const ref = await gh(`/git/ref/heads/${encodeURIComponent(BRANCH)}`);
  return ref.object.sha;
}
async function readProducts() {
  const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/products.js`;
  const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
  if (!res.ok) throw new Error('No se pudo leer products.js desde GitHub.');
  const source = await res.text();
  const match = source.match(/window\.IN_TIME_PRODUCTS\s*=\s*(\[[\s\S]*\])\s*;?\s*$/);
  if (!match) throw new Error('No se reconoce el formato de products.js.');
  return JSON.parse(match[1]);
}
async function commitFiles(files, message) {
  const parent = await currentHead();
  const parentCommit = await gh(`/git/commits/${parent}`);
  const treeItems = [];
  for (const file of files) {
    const blob = await gh('/git/blobs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: file.content, encoding: file.encoding || 'utf-8' }) });
    treeItems.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const tree = await gh('/git/trees', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree: treeItems }) });
  const commit = await gh('/git/commits', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message, tree: tree.sha, parents: [parent] }) });
  await gh(`/git/refs/heads/${encodeURIComponent(BRANCH)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sha: commit.sha, force: false }) });
  return commit.sha;
}
function productsSource(products) { return `window.IN_TIME_PRODUCTS = ${JSON.stringify(products)};\n`; }

export default async (event) => {
  const method = event.httpMethod;
  let body = {};
  try { body = event.body ? JSON.parse(event.body) : {}; } catch { return reply(400, { error: 'Solicitud JSON no válida.' }); }
  if (method === 'POST' && event.path.endsWith('/login')) {
    if (String(body.username || '') !== 'admin' || !process.env.ADMIN_PASSWORD || String(body.password || '') !== process.env.ADMIN_PASSWORD) return reply(401, { error: 'Usuario o contraseña incorrectos.' });
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) return reply(500, { error: 'Configura SESSION_SECRET con al menos 32 caracteres.' });
    return reply(200, { ok: true }, { 'set-cookie': sessionCookie(newSession()) });
  }
  if (method === 'POST' && event.path.endsWith('/logout')) return reply(200, { ok: true }, { 'set-cookie': sessionCookie('', 0) });
  if (!isAuthenticated(event)) return reply(401, { error: 'Sesión caducada. Vuelve a iniciar sesión.' });
  try {
    if (method === 'GET') return reply(200, { products: await readProducts() });
    if (method === 'POST' && event.path.endsWith('/image')) {
      const { filename, data, contentType } = body;
      if (!filename || !data || !/^image\/(jpeg|png|webp|gif)$/.test(contentType || '')) return reply(400, { error: 'Formato de imagen no válido.' });
      const safe = String(filename).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(-80);
      const path = `assets/uploads/${Date.now()}-${safe}`;
      const base64 = String(data).replace(/^data:[^,]+,/, '');
      await commitFiles([{ path, content: base64, encoding: 'base64' }], `Añadir foto ${safe}`);
      return reply(200, { path });
    }
    if (method === 'PUT' || method === 'DELETE') {
      const products = await readProducts();
      let next = products;
      if (method === 'PUT') {
        const p = body.product;
        if (!p?.id || !p?.name?.trim() || !p?.cat?.trim()) return reply(400, { error: 'Completa el nombre y la categoría.' });
        const index = next.findIndex(x => x.id === p.id);
        if (index >= 0) next[index] = p; else next.push(p);
      } else next = next.filter(p => p.id !== String(body.id));
      const message = method === 'DELETE' ? `Eliminar producto ${body.id}` : `Guardar producto ${body.product.name}`;
      const sha = await commitFiles([{ path: 'products.js', content: productsSource(next), encoding: 'utf-8' }], message);
      return reply(200, { ok: true, count: next.length, commit: sha });
    }
    return reply(405, { error: 'Método no permitido.' });
  } catch (error) { return reply(500, { error: error.message || 'Error interno.' }); }
};
