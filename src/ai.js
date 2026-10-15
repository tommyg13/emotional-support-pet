const { safeStorage, app, net } = require('electron');
const fs = require('fs');
const path = require('path');
const MODELS = { openai: 'gpt-4.1-mini', claude: 'claude-sonnet-4-6', google: 'gemini-2.5-flash' };
const file = () => path.join(app.getPath('userData'), 'ai-keys.json');
function keys() { try { return JSON.parse(fs.readFileSync(file(), 'utf8')); } catch { return {}; } }
function status(provider) { return { configured: !!keys()[provider], model: MODELS[provider] }; }
function saveKey(provider, key) {
  if (!MODELS[provider] || typeof key !== 'string') throw Error('Invalid AI settings.');
  const data = keys();
  if (key.trim()) {
    if (!safeStorage.isEncryptionAvailable() || (process.platform === 'linux' && safeStorage.getSelectedStorageBackend() === 'basic_text')) throw Error('Secure key storage is unavailable.');
    data[provider] = safeStorage.encryptString(key.trim()).toString('base64');
  } else delete data[provider];
  fs.mkdirSync(path.dirname(file()), { recursive: true });
  fs.writeFileSync(file(), JSON.stringify(data), { mode: 0o600 });
  return status(provider);
}
function readKey(provider) {
  if (!MODELS[provider]) throw Error('Choose a supported provider.');
  const encrypted = keys()[provider];
  if (!encrypted) throw Error('Save your API key first.');
  try { return safeStorage.decryptString(Buffer.from(encrypted, 'base64')); }
  catch { throw Error('Please save your API key again in Settings.'); }
}
async function providerError(response, key) {
  let detail = '';
  try { const data = await response.json(); detail = data.error?.message || data.message || ''; } catch {}
  detail = String(detail).split(key).join('[redacted]').replace(/AIza[\w-]+|sk-[\w-]+/g, '[redacted]').slice(0, 1200);
  const hint = response.status === 404 ? 'Refresh the model list in Settings and select an available model.' : response.status === 429 ? 'Check API quota and rate limits.' : '';
  return Error(`Provider error ${response.status}: ${detail || response.statusText}. ${hint}`);
}
async function listModels(provider) {
  const key = readKey(provider);
  const headers = provider === 'google' ? {'x-goog-api-key':key} : provider === 'claude' ? {'x-api-key':key, 'anthropic-version':'2023-06-01'} : {Authorization:`Bearer ${key}`};
  const base = provider === 'google' ? 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000' : provider === 'claude' ? 'https://api.anthropic.com/v1/models?limit=1000' : 'https://api.openai.com/v1/models';
  let url = base, result = [];
  for (let page = 0; page < 20; page++) {
    let response;
    try { response = await net.fetch(url, {headers, signal:AbortSignal.timeout(30000)}); }
    catch { throw Error('Could not load models. Check your connection and try again.'); }
    if (!response.ok) throw await providerError(response, key);
    const data = await response.json();
    for (const m of data.models || data.data || []) {
      const id = (m.name || m.id).replace(/^models\//, '');
      if (provider === 'google' && (!m.supportedGenerationMethods?.includes('generateContent') || /image|tts|audio|robotics/i.test(id))) continue;
      if (provider === 'openai' && (!/^(gpt-|o[1-9]|chatgpt-)/.test(id) || /image|audio|realtime|transcri|tts|search|codex|instruct/.test(id))) continue;
      result.push({id, name:m.displayName || m.display_name || id});
    }
    if (provider === 'google' && data.nextPageToken) url = base + '&pageToken=' + encodeURIComponent(data.nextPageToken);
    else if (provider === 'claude' && data.has_more && data.last_id) url = base + '&after_id=' + encodeURIComponent(data.last_id);
    else break;
  }
  result = [...new Map(result.map(m => [m.id,m])).values()].sort((a,b) => a.id.localeCompare(b.id));
  if (!result.length) throw Error('No compatible text chat models returned for this API key.');
  return result;
}
async function chat(provider, messages, selectedModel) {
  if (!MODELS[provider] || !Array.isArray(messages) || !messages.length || messages.length > 100 || messages.some(m => !['user','assistant'].includes(m.role) || typeof m.content !== 'string' || m.content.length > 30000)) throw Error('Invalid conversation or conversation too long. Start a new chat.');
  const key = readKey(provider);
  if (!selectedModel) throw Error('Choose a model in Settings first.');
  const model = String(selectedModel).replace(/^models\//, '');
  if (!/^[a-zA-Z0-9._:-]+$/.test(model)) throw Error('Invalid model. Refresh the model list in Settings.');
  let url, body, headers = { 'Content-Type': 'application/json' };
  if (provider === 'openai') {
    url = 'https://api.openai.com/v1/chat/completions'; headers.Authorization = `Bearer ${key}`;
    body = { model, messages, max_completion_tokens: 2048 };
  } else if (provider === 'claude') {
    url = 'https://api.anthropic.com/v1/messages'; headers['x-api-key'] = key; headers['anthropic-version'] = '2023-06-01';
    body = { model, messages, max_tokens: 2048 };
  } else {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`; headers['x-goog-api-key'] = key;
    body = { contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })), generationConfig: { maxOutputTokens: 4096 } };
  }
  let response;
  try { response = await net.fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(90000) }); }
  catch { throw Error('Could not reach the provider or the request timed out. Try again.'); }
  if (!response.ok) throw await providerError(response, key);
  const data = await response.json();
  let text, input, output, total;
  if (provider === 'openai') { text = data.choices?.[0]?.message?.content; input = data.usage?.prompt_tokens; output = data.usage?.completion_tokens; total = data.usage?.total_tokens; }
  if (provider === 'claude') { text = data.content?.filter(c => c.type === 'text').map(c => c.text).join('\n'); input = data.usage?.input_tokens; output = data.usage?.output_tokens; if (input != null && output != null) total = input + output; }
  if (provider === 'google') { text = data.candidates?.[0]?.content?.parts?.filter(p => !p.thought && p.text).map(p => p.text).join('\n'); input = data.usageMetadata?.promptTokenCount; output = data.usageMetadata?.candidatesTokenCount; total = data.usageMetadata?.totalTokenCount; }
  if (!text) throw Error('The provider returned no text. Try rephrasing your message.');
  return { text, model, usage: { input, output, total } };
}
module.exports = { status, saveKey, chat, listModels, MODELS };
