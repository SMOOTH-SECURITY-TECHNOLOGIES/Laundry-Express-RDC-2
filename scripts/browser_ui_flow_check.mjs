import fs from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.BROWSER_FLOW_BASE_URL || 'http://127.0.0.1:3004';
const DEBUG_PORT = Number(process.env.BROWSER_DEBUG_PORT || '9222');
const DEBUG_HOST = process.env.BROWSER_DEBUG_HOST || '127.0.0.1';
const ARTIFACT_PATH = path.resolve('.browser-ui-flow-artifact.html');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status} for ${url}\n${body}`);
  }
  return response.json();
}

class PageClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.pending = new Map();
    this.nextId = 1;

    this.opened = new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });

    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data.toString());
      if (!message.id) {
        return;
      }
      const pending = this.pending.get(message.id);
      if (!pending) {
        return;
      }
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(message.error.message || 'CDP error'));
        return;
      }
      pending.resolve(message.result);
    });
  }

  async connect() {
    await this.opened;
    await this.send('Page.enable');
    await this.send('Runtime.enable');
    await this.send('Network.enable');
  }

  send(method, params = {}) {
    const id = this.nextId++;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(payload);
    });
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
  }

  async evaluate(expression, label = expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(`Evaluation failed for ${label}`);
    }
    return result.result?.value;
  }

  async waitFor(expression, timeoutMs, label) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const value = await this.evaluate(expression, label);
      if (value) {
        return value;
      }
      await delay(250);
    }
    throw new Error(`Timeout waiting for ${label}`);
  }

  async close() {
    this.ws.close();
  }
}

function literal(value) {
  return JSON.stringify(value);
}

function nextIsoDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

async function createPageClient() {
  const payload = await fetchJson(
    `http://${DEBUG_HOST}:${DEBUG_PORT}/json/new?${encodeURIComponent(`${BASE_URL}/`)}`,
    { method: 'PUT' },
  );
  const client = new PageClient(payload.webSocketDebuggerUrl);
  await client.connect();
  return client;
}

async function dumpArtifact(page) {
  try {
    const html = await page.evaluate('document.documentElement.outerHTML', 'outerHTML');
    await fs.writeFile(ARTIFACT_PATH, html, 'utf8');
  } catch {
    // Best effort only.
  }
}

async function setInput(page, selector, value) {
  await page.evaluate(`
    (() => {
      const element = document.querySelector(${literal(selector)});
      if (!element) {
        throw new Error('Missing selector: ' + ${literal(selector)});
      }
      const prototype = element.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
      if (!descriptor || typeof descriptor.set !== 'function') {
        throw new Error('Value setter not available for ' + ${literal(selector)});
      }
      element.focus();
      descriptor.set.call(element, '');
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()
  `, `setInput(${selector})`);
  await delay(50);
  await page.send('Input.insertText', { text: value });
  await delay(50);
  await page.evaluate(`
    (() => {
      const element = document.querySelector(${literal(selector)});
      if (element) {
        element.blur();
      }
      return true;
    })()
  `, `blur(${selector})`);
}

async function setNativeValue(page, selector, value) {
  await page.evaluate(`
    (() => {
      const element = document.querySelector(${literal(selector)});
      if (!element) {
        throw new Error('Missing selector: ' + ${literal(selector)});
      }
      const prototype = element.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
      if (!descriptor || typeof descriptor.set !== 'function') {
        throw new Error('Value setter not available for ' + ${literal(selector)});
      }
      element.focus();
      descriptor.set.call(element, ${literal(value)});
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.blur();
      return element.value;
    })()
  `, `setNativeValue(${selector})`);
}

async function clickSelector(page, selector) {
  const box = await page.evaluate(`
    (() => {
      const element = document.querySelector(${literal(selector)});
      if (!element) {
        throw new Error('Missing selector: ' + ${literal(selector)});
      }
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    })()
  `, `clickSelector(${selector})`);
  await page.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: box.x,
    y: box.y,
    button: 'left',
    clickCount: 1,
  });
  await page.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: box.x,
    y: box.y,
    button: 'left',
    clickCount: 1,
  });
}

async function submitForm(page, selector) {
  await page.evaluate(`
    (() => {
      const form = document.querySelector(${literal(selector)});
      if (!form) {
        throw new Error('Missing form selector: ' + ${literal(selector)});
      }
      const reactPropsKey = Object.keys(form).find((key) => key.startsWith('__reactProps$'));
      const reactProps = reactPropsKey ? form[reactPropsKey] : null;
      if (reactProps && typeof reactProps.onSubmit === 'function') {
        reactProps.onSubmit({
          preventDefault() {},
          stopPropagation() {},
          target: form,
          currentTarget: form,
        });
        return 'react-submit';
      }
      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit();
        return 'request-submit';
      }
      form.submit();
      return 'native-submit';
    })()
  `, `submitForm(${selector})`);
}

async function clickButtonByText(page, text) {
  const result = await page.evaluate(`
    (() => {
      const target = Array.from(document.querySelectorAll('button')).find((button) =>
        button.textContent && button.textContent.includes(${literal(text)})
      );
      if (!target) {
        throw new Error('Missing button text: ' + ${literal(text)});
      }
      const reactPropsKey = Object.keys(target).find((key) => key.startsWith('__reactProps$'));
      const reactProps = reactPropsKey ? target[reactPropsKey] : null;
      if (reactProps && typeof reactProps.onClick === 'function') {
        reactProps.onClick({
          preventDefault() {},
          stopPropagation() {},
          currentTarget: target,
          target,
        });
        return { mode: 'react' };
      }
      const rect = target.getBoundingClientRect();
      return {
        mode: 'mouse',
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    })()
  `, `clickButtonByText(${text})`);
  if (result.mode === 'react') {
    return;
  }
  await page.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: result.x,
    y: result.y,
    button: 'left',
    clickCount: 1,
  });
  await page.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: result.x,
    y: result.y,
    button: 'left',
    clickCount: 1,
  });
}

async function ensureValue(page, selector, fallbackValue) {
  const hasValue = await page.evaluate(`
    (() => {
      const element = document.querySelector(${literal(selector)});
      return !!(element && element.value && String(element.value).trim());
    })()
  `, `hasValue(${selector})`);
  if (!hasValue) {
    await setInput(page, selector, fallbackValue);
  }
}

async function logPageState(page, label) {
  const state = await page.evaluate(`
    (() => ({
      path: window.location.pathname,
      title: document.title,
      h1: Array.from(document.querySelectorAll('h1')).map((node) => node.textContent?.trim()).filter(Boolean),
      h2: Array.from(document.querySelectorAll('h2')).map((node) => node.textContent?.trim()).filter(Boolean).slice(0, 4),
      buttons: Array.from(document.querySelectorAll('button')).map((node) => (node.textContent || '').trim()).filter(Boolean).slice(0, 12),
    }))()
  `, `pageState(${label})`);
  console.log(`${label}: ${JSON.stringify(state)}`);
}

async function assertNoUiLeaks(page, label) {
  const leaks = await page.evaluate(`
    (() => {
      const textContent = document.body?.innerText || '';
      const translationMatches = textContent.match(/\\b(?:serviceTypeSelector|schedulePicker|orderPage|multiServiceOrder|paymentModal|clientDetailsForm|partnerDetailPage|orderSummary)\\.[A-Za-z0-9_]+\\b/g) || [];
      const debugMatches = textContent.match(/\\bDebug Information\\b|\\bLog Full State\\b|\\bDebug Info\\b/g) || [];
      return {
        translationMatches: Array.from(new Set(translationMatches)).slice(0, 10),
        debugMatches: Array.from(new Set(debugMatches)).slice(0, 10),
      };
    })()
  `, `assertNoUiLeaks(${label})`);

  if (leaks.translationMatches.length > 0 || leaks.debugMatches.length > 0) {
    throw new Error(`UI leak detected at ${label}: ${JSON.stringify(leaks)}`);
  }
}

async function logScheduleState(page, label) {
  const state = await page.evaluate(`
    (() => ({
      date: document.querySelector('#date')?.value || '',
      time: document.querySelector('#time')?.value || '',
      timeDisabled: !!document.querySelector('#time')?.disabled,
      warning: Array.from(document.querySelectorAll('[role="alert"] p')).map((node) => node.textContent?.trim()).filter(Boolean),
      status: Array.from(document.querySelectorAll('[role="status"] p')).map((node) => node.textContent?.trim()).filter(Boolean),
    }))()
  `, `scheduleState(${label})`);
  console.log(`${label}: ${JSON.stringify(state)}`);
}

async function ensureSchedulablePickup(page) {
  await logScheduleState(page, 'Schedule before adjustment');

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const scheduleState = await page.evaluate(`
      (() => ({
        date: document.querySelector('#date')?.value || '',
        timeDisabled: !!document.querySelector('#time')?.disabled,
        warningText: Array.from(document.querySelectorAll('[role="alert"] p')).map((node) => node.textContent || '').join(' '),
      }))()
    `, `schedulableAttempt(${attempt})`);

    const tooLateToday = /too late for a pickup today/i.test(scheduleState.warningText);
    if (!scheduleState.timeDisabled && !tooLateToday) {
      break;
    }

    if (!scheduleState.date) {
      throw new Error('Pickup date input has no value');
    }

    const nextDate = nextIsoDate(scheduleState.date);
    await setNativeValue(page, '#date', nextDate);
    await delay(500);
    await logScheduleState(page, `Schedule after date bump ${attempt + 1}`);
  }

  await page.waitFor(
    "(() => { const time = document.querySelector('#time'); return !!(time && !time.disabled); })()",
    10000,
    'pickup time enabled',
  );

  const timeValue = await page.evaluate("document.querySelector('#time')?.value || ''", 'pickup time value');
  if (!timeValue) {
    const firstOption = await page.evaluate(`
      (() => document.querySelector('#timeOptions option')?.value || '')()
    `, 'first pickup time option');
    if (firstOption) {
      await setNativeValue(page, '#time', firstOption);
      await delay(250);
    }
  }

  await page.waitFor(
    "Array.from(document.querySelectorAll('[role=\"alert\"] p')).every((node) => !/too late for a pickup today/i.test(node.textContent || ''))",
    10000,
    'pickup warning cleared',
  );
  await logScheduleState(page, 'Schedule ready');
  await assertNoUiLeaks(page, 'schedule ready');
}

async function clickServiceTypeCard(page, headingText) {
  const result = await page.evaluate(`
    (() => {
      const cards = Array.from(document.querySelectorAll('main button')).filter((button) =>
        button.querySelector('h3')
      );
      const target = cards.find((button) => {
        const heading = button.querySelector('h3');
        return heading && heading.textContent && heading.textContent.trim() === ${literal(headingText)};
      });
      if (!target) {
        throw new Error('Missing service type card: ' + ${literal(headingText)});
      }
      const reactPropsKey = Object.keys(target).find((key) => key.startsWith('__reactProps$'));
      const reactProps = reactPropsKey ? target[reactPropsKey] : null;
      if (reactProps && typeof reactProps.onClick === 'function') {
        reactProps.onClick({
          preventDefault() {},
          stopPropagation() {},
          currentTarget: target,
          target,
        });
        return { mode: 'react' };
      }
      const rect = target.getBoundingClientRect();
      return { mode: 'mouse', x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()
  `, `clickServiceTypeCard(${headingText})`);
  if (result.mode === 'react') {
    return;
  }
  await page.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: result.x,
    y: result.y,
    button: 'left',
    clickCount: 1,
  });
  await page.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: result.x,
    y: result.y,
    button: 'left',
    clickCount: 1,
  });
}

async function main() {
  const unique = Date.now().toString();
  const email = `ui.flow.${unique}@example.com`;
  const password = 'Test123!';
  const phone = `08${unique.slice(-8)}`;
  const name = 'UI Flow Test';
  const pickupAddress = '12 Avenue des Tests, Gombe';

  console.log('Browser UI flow check');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Debug port: ${DEBUG_PORT}`);

  let page;
  try {
    page = await createPageClient();

    console.log('1. Register page');
    await page.navigate(`${BASE_URL}/register`);
    await page.waitFor("!!document.querySelector('#name')", 15000, 'register form');
    await page.evaluate(`
      (() => {
        if (window.__uiFlowFetchPatched) {
          return true;
        }
        window.__uiFlowFetchPatched = true;
        window.__uiFlowRequests = [];
        const originalFetch = window.fetch.bind(window);
        window.fetch = async (...args) => {
          const [input, init] = args;
          const url = typeof input === 'string' ? input : input.url;
          const method = init?.method || 'GET';
          const body = typeof init?.body === 'string' ? init.body : null;
          try {
            const response = await originalFetch(...args);
            window.__uiFlowRequests.push({
              url,
              method,
              body,
              status: response.status,
              ok: response.ok,
            });
            return response;
          } catch (error) {
            window.__uiFlowRequests.push({
              url,
              method,
              body,
              error: String(error),
            });
            throw error;
          }
        };
        return true;
      })()
    `, 'patch fetch');
    await setInput(page, '#name', name);
    await setInput(page, '#email', email);
    await setInput(page, '#phone', phone);
    await setInput(page, '#pickupAddress', pickupAddress);
    await setInput(page, '#password', password);
    const registerValues = await page.evaluate(`
      (() => {
        const form = document.querySelector('form');
        return {
        name: document.querySelector('#name')?.value || '',
        email: document.querySelector('#email')?.value || '',
        phone: document.querySelector('#phone')?.value || '',
        pickupAddress: document.querySelector('#pickupAddress')?.value || '',
        passwordLength: (document.querySelector('#password')?.value || '').length,
        formValid: !!form?.checkValidity?.(),
      };
      })()
    `, 'register values');
    console.log('Register form values:', JSON.stringify(registerValues));
    await delay(500);
    await submitForm(page, 'form');
    await delay(3000);
    const registerRequests = await page.evaluate('window.__uiFlowRequests || []', 'register requests');
    console.log('Register requests:', JSON.stringify(registerRequests));
    await page.waitFor("!!localStorage.getItem('auth_token')", 20000, 'auth token after register');
    await page.waitFor("window.location.pathname === '/' || window.location.pathname === '/home'", 20000, 'home after register');
    console.log('PASS register');
    await logPageState(page, 'After register');
    await assertNoUiLeaks(page, 'after register');

    console.log('2. Login page');
    await page.evaluate(`
      (() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_refresh_token');
        history.pushState({}, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
        return true;
      })()
    `, 'reset auth and go login');
    await page.waitFor("!!document.querySelector('#email') && !!document.querySelector('#password')", 10000, 'login form');
    await setInput(page, '#email', email);
    await setInput(page, '#password', password);
    await delay(300);
    await submitForm(page, 'form');
    await page.waitFor("!!localStorage.getItem('auth_token')", 20000, 'auth token after login');
    await page.waitFor("window.location.pathname === '/' || window.location.pathname === '/home'", 20000, 'home after login');
    console.log('PASS login');
    await logPageState(page, 'After login');
    await assertNoUiLeaks(page, 'after login');

    console.log('3. Order flow');
    await page.navigate(`${BASE_URL}/order`);
    await page.waitFor(
      "window.location.pathname === '/order' && (Array.from(document.querySelectorAll('main h2, main h3')).some((node) => /laundry|what service do you need|select your items/i.test(node.textContent || '')) || !!document.querySelector('input[id^=\"weight-\"]'))",
      15000,
      'order page ready',
    );
    await logPageState(page, 'Order start');
    await assertNoUiLeaks(page, 'order start');
    const orderStartHeading = await page.evaluate(`
      (() => Array.from(document.querySelectorAll('main h2')).map((node) => node.textContent?.trim()).find(Boolean) || '')()
    `, 'order start heading');
    if (/what service do you need/i.test(orderStartHeading)) {
      await clickServiceTypeCard(page, 'Laundry');
      await delay(500);
      await logPageState(page, 'After service type');
      await assertNoUiLeaks(page, 'after service type');
    }

    const currentPathAfterService = await page.evaluate('window.location.pathname', 'path after service type');
    const currentHeadingAfterService = await page.evaluate(`
      (() => Array.from(document.querySelectorAll('main h2')).map((node) => node.textContent?.trim()).find(Boolean) || '')()
    `, 'heading after service type');
    if (currentPathAfterService === '/order' && /choose your laundry/i.test(currentHeadingAfterService)) {
      await page.waitFor(
        "Array.from(document.querySelectorAll('button')).some((node) => /lavage express gombe/i.test(node.textContent || ''))",
        15000,
        'laundry partner selector',
      );
      await clickButtonByText(page, 'Lavage Express Gombe');
      await delay(500);
      await logPageState(page, 'After partner card');
      await assertNoUiLeaks(page, 'after partner card');
    }

    const onPartnerDetailPage = await page.evaluate(
      "Array.from(document.querySelectorAll('button')).some((node) => /select this partner|select this partner & continue/i.test(node.textContent || ''))",
      'partner detail presence',
    );
    if (onPartnerDetailPage) {
      await clickButtonByText(page, 'Select this partner & Continue');
      await delay(1000);
      await logPageState(page, 'After partner continue');
      await assertNoUiLeaks(page, 'after partner continue');
    }

    await page.waitFor("!!document.querySelector('input[id^=\"weight-\"]')", 15000, 'weight input');
    await setInput(page, 'input[id^="weight-"]', '2');

    await page.waitFor("!!document.querySelector('#date') && !!document.querySelector('#time')", 10000, 'schedule inputs');
    await ensureSchedulablePickup(page);
    await ensureValue(page, '#name', name);
    await ensureValue(page, '#phone', phone);
    await ensureValue(page, 'input[name=\"numero\"]', '12');
    await ensureValue(page, 'input[name=\"avenue\"]', 'Avenue des Tests');
    await ensureValue(page, 'input[name=\"commune\"]', 'Gombe');

    await page.waitFor(
      "(() => { const button = Array.from(document.querySelectorAll('button')).find((node) => /confirm.*pay|confirmer.*payer/i.test(node.textContent || '')); return !!(button && !button.disabled); })()",
      20000,
      'confirm and pay button enabled',
    );
    await page.evaluate(`
      (() => {
        const button = Array.from(document.querySelectorAll('button')).find((node) =>
          /confirm.*pay|confirmer.*payer/i.test(node.textContent || '')
        );
        if (!button) {
          throw new Error('Confirm and pay button not found');
        }
        button.click();
        return true;
      })()
    `, 'open payment modal');

    await page.waitFor(
      "Array.from(document.querySelectorAll('button')).some((node) => /cash a la livraison/i.test(node.textContent || ''))",
      10000,
      'cash payment option',
    );
    await clickButtonByText(page, 'Cash a la livraison');
    await page.evaluate(`
      (() => {
        const button = Array.from(document.querySelectorAll('button')).find((node) =>
          /payer|pay now/i.test(node.textContent || '')
        );
        if (!button) {
          throw new Error('Pay now button not found');
        }
        button.click();
        return true;
      })()
    `, 'submit payment');

    await page.waitFor("window.location.pathname === '/tracking'", 25000, 'tracking page');
    await page.waitFor(
      "Array.from(document.querySelectorAll('h1,h2')).some((node) => /track|suivi/i.test(node.textContent || ''))",
      15000,
      'tracking heading',
    );
    console.log('PASS order -> payment intent -> tracking');

    const currentPath = await page.evaluate('window.location.pathname', 'current path');
    console.log('\nSummary');
    console.log('PASS register -> login -> order -> payment modal -> tracking');
    console.log(`Final path: ${currentPath}`);
  } catch (error) {
    if (page) {
      await dumpArtifact(page);
    }
    console.error('\nFAIL browser UI flow');
    console.error(error instanceof Error ? error.message : String(error));
    console.error(`Artifact: ${ARTIFACT_PATH}`);
    process.exitCode = 1;
  } finally {
    if (page) {
      await page.close();
    }
  }
}

await main();
