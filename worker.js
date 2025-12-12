export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
    }

    try {
      const body = await request.json();

      if (path === '/send-code') {
        return await handleSendCode(body, env, corsHeaders);
      }

      if (path === '/verify' || path === '/register') {
        return await handleVerify(body, env, corsHeaders);
      }

      return jsonResponse({ error: 'Not found' }, 404, corsHeaders);

    } catch (error) {
      return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
    }
  }
};

async function handleSendCode({ email, type }, env, corsHeaders) {
  if (!email) {
    return jsonResponse({ error: 'Email is required' }, 400, corsHeaders);
  }

  const code = generateCode();
  const key = `code:${email}`;
  
  await env.AUTH_CODES.put(key, JSON.stringify({
    code,
    type,
    createdAt: Date.now()
  }), { expirationTtl: 600 });

  const subject = type === 'login' 
    ? 'Your Login Code' 
    : 'Your Verification Code';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #667eea;">${subject}</h1>
      <p>Your verification code is:</p>
      <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; border-radius: 8px;">
        ${code}
      </div>
      <p style="color: #666; margin-top: 20px;">This code expires in 10 minutes.</p>
      <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
    </div>
  `;

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: email,
      subject: subject,
      html: html,
    }),
  });

  if (!resendResponse.ok) {
    const errorData = await resendResponse.json();
    return jsonResponse({ error: 'Failed to send email', details: errorData }, 500, corsHeaders);
  }

  return jsonResponse({ success: true, message: 'Code sent to your email' }, 200, corsHeaders);
}

async function handleVerify({ email, code }, env, corsHeaders) {
  if (!email || !code) {
    return jsonResponse({ error: 'Email and code are required' }, 400, corsHeaders);
  }

  const key = `code:${email}`;
  const storedData = await env.AUTH_CODES.get(key);
  
  if (!storedData) {
    return jsonResponse({ error: 'No code found. Please request a new one.' }, 400, corsHeaders);
  }

  const stored = JSON.parse(storedData);

  if (stored.code !== code) {
    return jsonResponse({ error: 'Invalid code' }, 400, corsHeaders);
  }

  await env.AUTH_CODES.delete(key);
  return jsonResponse({ success: true, message: 'Verified successfully' }, 200, corsHeaders);
}

function generateCode() {
  const chars = '0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function jsonResponse(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}
