export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "https://reseller.ghotimarket.com",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Only allow POST requests
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://reseller.ghotimarket.com",
        },
      });
    }

    try {
      const data = await request.json();
      const { name, phone, email, uid } = data;
      // ✅ FIXED: Frontend এখন whatsApp (ছোট w) পাঠায়, তাই দুইটাই সাপোর্ট করলাম
      const whatsApp = data.whatsApp || data.WhatsApp;

      // Basic validation
      if (!name || !phone || !whatsApp || !email || !uid) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "https://reseller.ghotimarket.com",
          },
        });
      }

      // Escape HTML Special Characters to prevent Markdown/HTML parsing injection
      const escapeHtml = (str) => {
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };

      const safeName = escapeHtml(name);
      const safePhone = escapeHtml(phone);
      const safeWhatsApp = escapeHtml(whatsApp);
      const safeEmail = escapeHtml(email);
      const safeUid = escapeHtml(uid);
      
      const currentTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });

      const telegramMessage = `🎉 নতুন রিসেলার একাউন্ট তৈরি হয়েছে!
━━━━━━━━━━━━━━━━━━
নাম: ${safeName}
মোবাইল: ${safePhone}
WhatsApp: ${safeWhatsApp}
ইমেইল: ${safeEmail}
UID: ${safeUid}
Account Status: Inactive
Verification Status: Unverified
Registration Time: ${currentTime}
━━━━━━━━━━━━━━━━━━
Reseller Ghoti Market
https://reseller.ghotimarket.com`;

      const botToken = env.TELEGRAM_BOT_TOKEN;
      const chatId = env.TELEGRAM_CHAT_ID;

      if (!botToken || !chatId) {
        console.error("Telegram Secrets are not configured in Worker.");
        return new Response(JSON.stringify({ error: "Server Configuration Error" }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "https://reseller.ghotimarket.com",
          },
        });
      }

      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      
      const telegramResponse = await fetch(telegramUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMessage,
          parse_mode: "HTML",
        }),
      });

      const telegramResult = await telegramResponse.json();

      if (!telegramResult.ok) {
        console.error("Telegram API Error:", telegramResult);
        // Even if telegram fails, return 200 to client so user experience is not hindered
        return new Response(JSON.stringify({ success: true, warning: "Notification delivery failed" }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "https://reseller.ghotimarket.com",
          },
        });
      }

      return new Response(JSON.stringify({ success: true, message: "Notification sent successfully" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://reseller.ghotimarket.com",
        },
      });

    } catch (err) {
      console.error("Worker Execution Error:", err);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://reseller.ghotimarket.com",
        },
      });
    }
  },
};
