#!/usr/bin/env node

/**
 * Front-facing E2E validation for the MVP flow.
 * This script validates the same contract the frontend now relies on:
 * register -> login -> me -> catalog partners -> pricing -> create order -> payment intent
 *
 * It intentionally does not claim to validate browser rendering.
 */

import fetch from 'node-fetch';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:18000/api/v1';
const ROOT_HEALTH_URL = API_BASE_URL.replace('/api/v1', '') + '/health';
const TEST_EMAIL = `ui-flow-${Date.now()}@example.com`;
const TEST_PHONE = `+24381${String(Date.now()).slice(-7)}`;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || `ui-flow-${Date.now()}-A!`;

let accessToken = null;
let refreshToken = null;
let currentUserId = null;
let currentAddressId = null;

function logStep(name) {
  console.log(`\n${name}`);
}

async function requestJson(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const bodyText = await response.text();
  let body = {};

  if (bodyText) {
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = { raw: bodyText };
    }
  }

  if (!response.ok) {
    const detail = typeof body === 'object' && body !== null && 'detail' in body ? body.detail : bodyText;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }

  return body;
}

async function runStep(name, fn) {
  try {
    const detail = await fn();
    console.log(`PASS ${name} ${detail ? `-> ${detail}` : ''}`);
    return true;
  } catch (error) {
    console.error(`FAIL ${name} -> ${error.message}`);
    return false;
  }
}

async function healthCheck() {
  const response = await fetch(ROOT_HEALTH_URL);
  const body = await response.json();
  if (!response.ok || body.status !== 'healthy') {
    throw new Error(`unexpected health response: ${JSON.stringify(body)}`);
  }
  return `${body.status}`;
}

async function registerUser() {
  const body = await requestJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_EMAIL,
      phone: TEST_PHONE,
      name: 'UI Flow Test User',
      password: TEST_PASSWORD,
    }),
  });

  currentUserId = body.id;
  return body.email;
}

async function loginUser() {
  const body = await requestJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  });

  accessToken = body.access_token;
  refreshToken = body.refresh_token;
  return body.token_type || 'bearer';
}

async function createAddress() {
  const body = await requestJson('/users/me/addresses', {
    method: 'POST',
    body: JSON.stringify({
      user_id: currentUserId,
      label: 'Maison',
      contact_name: 'UI Flow Test User',
      contact_phone: TEST_PHONE,
      address_line_1: '123 Avenue du Test',
      address_line_2: '42',
      city: 'Kinshasa',
      commune: 'Gombe',
      zone: 'Centre Ville',
      reference_point: 'Porte bleue',
      is_default: true,
    }),
  });

  currentAddressId = body.id;
  return body.id;
}

async function getCurrentUser() {
  const body = await requestJson('/auth/me');
  if (!body.user || !Array.isArray(body.addresses)) {
    throw new Error('unexpected /auth/me shape');
  }
  currentUserId = body.user.id;
  currentAddressId = body.addresses[0]?.id || currentAddressId;
  return `${body.user.email} / addresses=${body.addresses.length}`;
}

async function getCatalogPartnerAndService() {
  const partners = await requestJson('/catalog/partners');
  if (!Array.isArray(partners) || partners.length === 0) {
    throw new Error('no catalog partners available, run python scripts/bootstrap_mvp_catalog_bridge.py first');
  }

  const preferred = partners.find((partner) => partner.name === 'Prestige Pressing') || partners[0];
  const services = await requestJson(`/catalog/partners/${preferred.id}/services`);
  if (!Array.isArray(services) || services.length === 0) {
    throw new Error(`no services available for partner ${preferred.name}`);
  }

  return {
    partner: preferred,
    service: services[0],
  };
}

async function estimateOrder(catalog) {
  const body = await requestJson('/pricing/estimate', {
    method: 'POST',
    body: JSON.stringify({
      partner_id: catalog.partner.id,
      items: [
        {
          service_id: catalog.service.id,
          item_name: catalog.service.service_type_name || 'Chemise',
          quantity: 2,
          notes: 'Frontend-aligned estimate',
        },
      ],
      express: false,
      pickup_requested: true,
      delivery_requested: true,
      promo_code: null,
    }),
  });

  if (body.total === undefined) {
    throw new Error('missing total in pricing response');
  }

  return body;
}

async function createOrder(catalog) {
  const idempotencyKey = `ui-e2e-${Date.now()}`;
  const body = await requestJson('/orders', {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      partner_id: catalog.partner.id,
      pickup_address_id: currentAddressId,
      delivery_address_id: currentAddressId,
      items: [
        {
          service_id: catalog.service.id,
          item_name: catalog.service.service_type_name || 'Chemise',
          quantity: '2.00',
          unit_price: String(catalog.service.base_price),
          notes: 'Frontend-aligned order creation',
          detected_by_ai: false,
        },
      ],
      currency: 'USD',
      pickup_time_slot: '09:00-12:00',
      express: false,
      pickup_requested: true,
      delivery_requested: true,
    }),
  });

  return body;
}

async function createPaymentIntent(order) {
  const body = await requestJson('/payments/intents', {
    method: 'POST',
    body: JSON.stringify({
      order_id: order.id,
      payment_method: 'cash_on_delivery',
      amount_expected: Number(order.total_amount),
      currency: order.currency,
      provider_name: null,
      payment_metadata: {
        source: 'validate-e2e.js',
      },
    }),
  });

  return body;
}

async function logout() {
  if (!refreshToken) {
    throw new Error('refresh token missing');
  }

  const body = await requestJson('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  accessToken = null;
  refreshToken = null;
  return body.message || 'logged out';
}

async function main() {
  console.log('Front-facing MVP flow validation');
  console.log('=================================');

  const results = {};

  logStep('1. Health');
  results.health = await runStep('health', healthCheck);
  if (!results.health) {
    process.exit(1);
  }

  logStep('2. Bootstrap catalog bridge');
  results.catalogReady = await runStep('catalog_ready', async () => {
    const partners = await requestJson('/catalog/partners');
    if (!Array.isArray(partners) || partners.length === 0) {
      throw new Error('catalog is empty');
    }
    return `${partners.length} partners`;
  });

  logStep('3. Auth');
  results.register = await runStep('register', registerUser);
  results.login = await runStep('login', loginUser);
  results.address = await runStep('create_address', createAddress);
  results.me = await runStep('me', getCurrentUser);

  let catalog = null;
  logStep('4. Catalog');
  results.catalog = await runStep('catalog_partners_services', async () => {
    catalog = await getCatalogPartnerAndService();
    return `${catalog.partner.name} / ${catalog.service.service_type_name}`;
  });

  let pricing = null;
  logStep('5. Pricing');
  results.pricing = await runStep('pricing_estimate', async () => {
    pricing = await estimateOrder(catalog);
    return `${pricing.total} ${pricing.currency}`;
  });

  let order = null;
  logStep('6. Order');
  results.order = await runStep('create_order', async () => {
    order = await createOrder(catalog);
    return `${order.id} / ${order.status}`;
  });

  let paymentIntent = null;
  logStep('7. Payment');
  results.payment = await runStep('create_payment_intent', async () => {
    paymentIntent = await createPaymentIntent(order);
    return `${paymentIntent.id} / ${paymentIntent.status}`;
  });

  logStep('8. Logout');
  results.logout = await runStep('logout', logout);

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  console.log('\nSummary');
  console.log(`Passed ${passed}/${total}`);

  if (passed !== total) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`Unhandled failure: ${error.message}`);
  process.exit(1);
});
