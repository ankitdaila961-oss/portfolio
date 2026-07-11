require('dotenv').config();

const express = require('express');
const fs = require('fs/promises');
const https = require('https');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const rootDir = __dirname;
const dataDir = path.join(rootDir, 'data');
const configPath = path.join(dataDir, 'site-config.json');
const messagesPath = path.join(dataDir, 'messages.json');
const visitsPath = path.join(dataDir, 'visits.json');

const defaultConfig = {
  name: 'Ankit Daila',
  role: 'Web Developer',
  githubUsername: 'ankitdaila961-oss',
  intro:
    'Web developer focused on stylish interfaces, interactive motion, and practical backend development using Node.js, Express.js, and MySQL.',
  feedbackEmail: '',
  socials: {
    github: 'https://github.com/ankitdaila961-oss',
    instagram: 'https://www.instagram.com/',
    twitter: 'https://x.com/'
  },
  skills: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'Express.js', 'MySQL'],
  fallbackProjects: [
    {
      name: 'ankit-portfolio',
      description: 'Animated personal portfolio with 3D effects and an Express.js backend.',
      language: 'HTML / CSS / JS',
      url: 'https://github.com/ankitdaila961-oss/ankit-portfolio',
      homepage: '',
      updatedAt: new Date().toISOString(),
      stars: 0,
      topics: ['portfolio', 'express', 'frontend']
    }
  ]
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(rootDir));

async function readJson(filePath, fallbackValue) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallbackValue;
  }
}

// On Vercel the filesystem is read-only (except /tmp), so writes will fail.
// We now swallow write errors instead of letting them bubble up and break
// the /api/contact and /api/visit routes. Locally (where the filesystem is
// writable) this still saves to the data/ folder as before.
async function writeJson(filePath, value) {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
  } catch (error) {
    console.error(`Skipping local save for ${filePath} (read-only filesystem):`, error.message);
  }
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          'User-Agent': 'ankit-portfolio-app',
          Accept: 'application/vnd.github+json'
        }
      },
      (response) => {
        let body = '';

        response.on('data', (chunk) => {
          body += chunk;
        });

        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            try {
              resolve(JSON.parse(body || '[]'));
            } catch (error) {
              reject(error);
            }
            return;
          }

          reject(new Error(`GitHub request failed with status ${response.statusCode}`));
        });
      }
    );

    request.on('error', reject);
  });
}

function postFormUrlEncoded(url, formFields, authHeader) {
  return new Promise((resolve, reject) => {
    const payload = new URLSearchParams(formFields).toString();
    const target = new URL(url);

    const request = https.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        path: `${target.pathname}${target.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(payload),
          Authorization: authHeader
        }
      },
      (response) => {
        let body = '';

        response.on('data', (chunk) => {
          body += chunk;
        });

        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve({ statusCode: response.statusCode, body });
            return;
          }

          reject(new Error(`Request failed with status ${response.statusCode}: ${body}`));
        });
      }
    );

    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function normalizePhone(value) {
  const rawValue = String(value || '').trim().replace(/^whatsapp:/i, '');
  const normalized = rawValue.replace(/(?!^)\+/g, '').replace(/[^\d+]/g, '');

  if (!normalized) {
    return '';
  }

  return normalized.startsWith('+') ? normalized : `+${normalized}`;
}

function isValidPhone(value) {
  const digitsOnly = normalizePhone(value).replace(/\D/g, '');
  return digitsOnly.length >= 8 && digitsOnly.length <= 15;
}

function formatWhatsAppRecipient(value) {
  const normalized = normalizePhone(value);
  return normalized ? `whatsapp:${normalized}` : '';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function createMailTransport() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass
    }
  });
}

async function sendFeedbackEmail(entry, config) {
  const transporter = createMailTransport();
  const configuredInbox = String(process.env.FEEDBACK_TO_EMAIL || config.feedbackEmail || '').trim();
  const inboxAddress = isValidEmail(configuredInbox) ? configuredInbox : process.env.GMAIL_USER;

  if (!transporter || !inboxAddress) {
    return { delivered: false, configured: false };
  }

  await transporter.sendMail({
    from: `"Portfolio Feedback" <${process.env.GMAIL_USER}>`,
    to: inboxAddress,
    replyTo: entry.email,
    subject: `New portfolio feedback from ${entry.name}`,
    text: [
      'You received a new portfolio message.',
      `Name: ${entry.name}`,
      `Email: ${entry.email}`,
      `Phone: ${entry.phone || 'Not provided'}`,
      `Time: ${entry.createdAt}`,
      '',
      'Message:',
      entry.message
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 12px;">New Portfolio Feedback</h2>
        <p><strong>Name:</strong> ${escapeHtml(entry.name)}</p>
        <p><strong>Email:</strong> <a href="mailto:${escapeHtml(entry.email)}">${escapeHtml(entry.email)}</a></p>
        <p><strong>Phone:</strong> ${escapeHtml(entry.phone || 'Not provided')}</p>
        <p><strong>Time:</strong> ${escapeHtml(entry.createdAt)}</p>
        <p><strong>Message:</strong></p>
        <div style="padding: 12px; border-radius: 8px; background: #f3f4f6; white-space: pre-wrap;">${escapeHtml(entry.message)}</div>
      </div>
    `
  });

  return { delivered: true, configured: true };
}

async function sendWhatsAppNotification(lines) {
  const accountSid = String(process.env.TWILIO_ACCOUNT_SID || '').trim();
  const authToken = String(process.env.TWILIO_AUTH_TOKEN || '').trim();
  const fromNumber = formatWhatsAppRecipient(process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886');
  const toNumber = formatWhatsAppRecipient(process.env.WHATSAPP_TO);

  if (!accountSid || !authToken || !fromNumber || !toNumber) {
    return { delivered: false, configured: false };
  }

  const messageBody = Array.isArray(lines)
    ? lines.filter(Boolean).join('\n').slice(0, 1500)
    : String(lines || '').slice(0, 1500);

  await postFormUrlEncoded(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
    {
      From: fromNumber,
      To: toNumber,
      Body: messageBody
    },
    `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`
  );

  return { delivered: true, configured: true };
}

function getClientIp(request) {
  const forwarded = String(request.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || request.socket?.remoteAddress || request.ip || 'Unknown';
}

function buildVisitEntry(request) {
  return {
    path: String(request.body?.path || '/').slice(0, 120),
    referrer: String(request.body?.referrer || 'Direct').slice(0, 240),
    userAgent: String(request.body?.userAgent || request.headers['user-agent'] || 'Unknown').slice(0, 240),
    language: String(request.body?.language || '').slice(0, 40),
    screen: String(request.body?.screen || '').slice(0, 40),
    ip: getClientIp(request),
    createdAt: new Date().toISOString()
  };
}

async function fetchGithubProjects(username) {
  if (!username) {
    return [];
  }

  const repos = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const batch = await getJson(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100&page=${page}`
    );

    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    repos.push(...batch);
    hasMore = batch.length === 100;
    page += 1;
  }

  return repos
    .filter((repo) => !repo.fork)
    .sort((left, right) => new Date(right.updated_at) - new Date(left.updated_at))
    .map((repo) => ({
      name: repo.name,
      description: repo.description || 'Project hosted on GitHub by Ankit Daila.',
      language: repo.language || 'Web',
      url: repo.html_url,
      homepage: repo.homepage || '',
      updatedAt: repo.updated_at,
      stars: repo.stargazers_count || 0,
      topics: Array.isArray(repo.topics) ? repo.topics.slice(0, 3) : []
    }));
}

async function getPortfolioPayload() {
  const config = await readJson(configPath, defaultConfig);
  let projects = config.fallbackProjects || defaultConfig.fallbackProjects;

  try {
    const githubProjects = await fetchGithubProjects(config.githubUsername);
    if (githubProjects.length) {
      projects = githubProjects;
    }
  } catch (error) {
    console.error('Unable to fetch GitHub repositories:', error.message);
  }

  return {
    profile: {
      name: config.name,
      role: config.role,
      intro: config.intro
    },
    socials: [
      { name: 'GitHub', icon: 'github', url: config.socials.github },
      { name: 'Instagram', icon: 'instagram', url: config.socials.instagram },
      { name: 'Twitter', icon: 'twitter', url: config.socials.twitter }
    ],
    skills: config.skills || defaultConfig.skills,
    projects
  };
}

app.get('/api/portfolio', async (_request, response) => {
  const payload = await getPortfolioPayload();
  response.json(payload);
});

app.post('/api/visit', async (request, response) => {
  try {
    const visitEntry = buildVisitEntry(request);

    // writeJson now silently skips saving if the filesystem is read-only
    // (e.g. on Vercel), so this will no longer throw and break the route.
    const visits = await readJson(visitsPath, []);
    visits.push(visitEntry);
    await writeJson(visitsPath, visits.slice(-200));

    let whatsappDelivered = false;

    try {
      const whatsAppResult = await sendWhatsAppNotification([
        '👀 New portfolio visit',
        `Time: ${visitEntry.createdAt}`,
        `Page: ${visitEntry.path}`,
        `IP: ${visitEntry.ip}`,
        `Browser: ${visitEntry.userAgent}`,
        `Referrer: ${visitEntry.referrer || 'Direct'}`,
        `Screen: ${visitEntry.screen || 'Unknown'}`,
        '',
        'Note: a visitor phone number is only available if they share it in the feedback form.'
      ]);

      whatsappDelivered = whatsAppResult.delivered;
    } catch (error) {
      console.error('Unable to send visit WhatsApp notification:', error.message);
    }

    response.status(201).json({ recorded: true, whatsappDelivered });
  } catch (error) {
    console.error('Unable to record visit:', error.message);
    response.status(500).json({ message: 'Unable to record visit right now.' });
  }
});

app.post('/api/contact', async (request, response) => {
  try {
    const name = String(request.body?.name || '').trim();
    const email = String(request.body?.email || '').trim();
    const phone = String(request.body?.phone || '').trim();
    const message = String(request.body?.message || '').trim();

    if (!name || !email || !message) {
      response.status(400).json({ message: 'Name, email, and message are required.' });
      return;
    }

    if (!isValidEmail(email)) {
      response.status(400).json({ message: 'Please enter a valid email address.' });
      return;
    }

    if (phone && !isValidPhone(phone)) {
      response.status(400).json({ message: 'Please enter a valid phone number with country code.' });
      return;
    }

    const entry = {
      name: name.slice(0, 80),
      email: email.slice(0, 120),
      phone: phone ? normalizePhone(phone).slice(0, 20) : '',
      message: message.slice(0, 4000),
      createdAt: new Date().toISOString()
    };

    // writeJson now silently skips saving if the filesystem is read-only
    // (e.g. on Vercel), so this will no longer throw and break the route.
    const entries = await readJson(messagesPath, []);
    entries.push(entry);
    await writeJson(messagesPath, entries);

    let emailDelivered = false;
    let whatsappDelivered = false;

    try {
      const config = await readJson(configPath, defaultConfig);
      const mailResult = await sendFeedbackEmail(entry, config);
      emailDelivered = mailResult.delivered;
    } catch (error) {
      console.error('Unable to send feedback email:', error.message);
    }

    try {
      const whatsAppResult = await sendWhatsAppNotification([
        '📩 New portfolio feedback',
        `Name: ${entry.name}`,
        `Email: ${entry.email}`,
        `Phone: ${entry.phone || 'Not provided'}`,
        `Time: ${entry.createdAt}`,
        '',
        `Message: ${entry.message}`
      ]);

      whatsappDelivered = whatsAppResult.delivered;
    } catch (error) {
      console.error('Unable to send feedback WhatsApp notification:', error.message);
    }

    response.status(201).json({
      message: emailDelivered || whatsappDelivered
        ? 'Thanks! Your feedback has been sent successfully.'
        : 'Thanks! Your feedback has been received successfully.',
      emailDelivered,
      whatsappDelivered
    });
  } catch (error) {
    console.error('Unable to process contact request:', error.message);
    response.status(500).json({ message: 'Unable to send feedback right now. Please try again later.' });
  }
});

app.get('*', (request, response) => {
  if (request.path.startsWith('/api/')) {
    response.status(404).json({ message: 'API route not found.' });
    return;
  }

  response.sendFile(path.join(rootDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Portfolio server is running at http://localhost:${PORT}`);

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    console.log('Gmail feedback forwarding is enabled.');
  } else {
    console.log('Add GMAIL_USER and GMAIL_APP_PASSWORD in a .env file to forward feedback to Gmail.');
  }

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.WHATSAPP_TO) {
    console.log('WhatsApp notifications are enabled.');
  } else {
    console.log('Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, and WHATSAPP_TO in .env to enable WhatsApp alerts.');
  }
});