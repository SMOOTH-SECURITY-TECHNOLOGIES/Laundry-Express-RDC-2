import type { OpenApiSummary } from '../../../lib/admin/integrations-types';

const CURL_EXAMPLE = `curl -X GET "https://api.laundryexpress.cd/api/v1/orders" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`;

export function DeveloperDocsPanel({ openapi }: { openapi: OpenApiSummary }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <h3 className="font-semibold mb-2">{openapi.title}</h3>
        <p className="text-sm text-gray-500">OpenAPI {openapi.version} · {openapi.endpointsCount} endpoints documentés</p>
        <button type="button" className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm">Export OpenAPI</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h4 className="font-semibold mb-2">Auth</h4>
          <p className="text-sm text-gray-600">Bearer token via header <code className="bg-gray-100 px-1 rounded">Authorization</code>. Scopes: orders.read, orders.write, payments.read, analytics.read.</p>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h4 className="font-semibold mb-2">Webhook Payloads</h4>
          <div className="flex flex-wrap gap-1">{openapi.webhookEvents.slice(0, 8).map((e) => (
            <span key={e} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{e}</span>
          ))}</div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <h4 className="font-semibold mb-2">Curl Example</h4>
        <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto">{CURL_EXAMPLE}</pre>
      </div>
    </div>
  );
}
