"use client";

import { useState } from "react";

export default function TestAPIPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint: string) => {
    setLoading(true);
    setResult(`Testing ${endpoint}...`);
    
    try {
      const response = await fetch(endpoint);
      const contentType = response.headers.get("content-type");
      
      if (!contentType || !contentType.includes("application/json")) {
        setResult(`❌ ${endpoint}\nNot JSON! Content-Type: ${contentType}`);
        return;
      }

      const text = await response.text();
      const data = JSON.parse(text);
      
      setResult(`✅ ${endpoint}\nStatus: ${response.status}\nData: ${JSON.stringify(data, null, 2).substring(0, 500)}...`);
    } catch (error: any) {
      setResult(`❌ ${endpoint}\nError: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Endpoint Tester</h1>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => testEndpoint("/api/appointments/")}
            disabled={loading}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Test Appointments
          </button>
          
          <button
            onClick={() => testEndpoint("/api/appointments/by_phone/?phone=123")}
            disabled={loading}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Test Phone Search
          </button>
          
          <button
            onClick={() => testEndpoint("/api/history/")}
            disabled={loading}
            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            Test History
          </button>
          
          <button
            onClick={() => testEndpoint("/api/doctors/")}
            disabled={loading}
            className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            Test Doctors
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Result:</h2>
          <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto max-h-96 text-sm">
            {result || "Click a button to test an endpoint..."}
          </pre>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Testing Instructions:</h3>
          <ul className="list-disc list-inside text-yellow-700 space-y-1">
            <li>Backend must be running on http://localhost:8000</li>
            <li>Click each button to test the API proxy routes</li>
            <li>Check for ✅ (success) or ❌ (error)</li>
            <li>Open browser console (F12) for detailed logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
