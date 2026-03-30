const canvas = document.getElementById('bg-canvas');
const cursorGlow = document.querySelector('.cursor-glow');
const projectsGrid = document.getElementById('projects-grid');
const projectSummary = document.getElementById('project-summary');
const githubProfileLink = document.getElementById('github-profile-link');
const socialLinks = document.getElementById('social-links');
const contactActions = document.getElementById('contact-actions');
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const visitTrackKey = 'ankit-portfolio-visit-tracked';

const defaultPortfolio = {
  socials: [
    {
      name: 'GitHub',
      icon: 'github',
      url: 'https://github.com/ankitdaila961-oss'
    },
    {
      name: 'Instagram',
      icon: 'instagram',
      url: 'https://www.instagram.com/'
    },
    {
      name: 'Twitter',
      icon: 'twitter',
      url: 'https://x.com/'
    }
  ],
  projects: [
    {
      name: 'ankit-portfolio',
      description: 'Animated personal portfolio with 3D visuals and an Express.js backend.',
      language: 'HTML / CSS / JS',
      url: 'https://github.com/ankitdaila961-oss/ankit-portfolio',
      homepage: '',
      updatedAt: '2026-03-30T00:00:00.000Z',
      stars: 0,
      topics: ['portfolio', 'express', 'frontend']
    }
  ]
};

function initThreeScene() {
  if (!window.THREE || !canvas) {
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  camera.position.z = 12;

  const ambient = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambient);

  const point = new THREE.PointLight(0x7c3aed, 2.2, 80);
  point.position.set(8, 6, 10);
  scene.add(point);

  const pointTwo = new THREE.PointLight(0x22d3ee, 1.8, 80);
  pointTwo.position.set(-8, -4, 8);
  scene.add(pointTwo);

  const torus = new THREE.Mesh(
    new THREE.TorusKnotGeometry(2.2, 0.55, 140, 16),
    new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      metalness: 0.55,
      roughness: 0.2,
      wireframe: true
    })
  );
  scene.add(torus);

  const orbMaterial = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.35,
    metalness: 0.4,
    roughness: 0.3,
    wireframe: true
  });

  const orbOne = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 0), orbMaterial);
  const orbTwo = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 0), orbMaterial.clone());
  orbOne.position.set(-4, 2.5, -2);
  orbTwo.position.set(4, -2, -1);
  scene.add(orbOne, orbTwo);

  const starsGeometry = new THREE.BufferGeometry();
  const starsCount = 1400;
  const positions = new Float32Array(starsCount * 3);

  for (let index = 0; index < starsCount * 3; index += 3) {
    positions[index] = (Math.random() - 0.5) * 70;
    positions[index + 1] = (Math.random() - 0.5) * 70;
    positions[index + 2] = (Math.random() - 0.5) * 70;
  }

  starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const stars = new THREE.Points(
    starsGeometry,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.85
    })
  );
  scene.add(stars);

  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (event.clientY / window.innerHeight - 0.5) * 2;

    if (cursorGlow) {
      cursorGlow.style.left = `${event.clientX}px`;
      cursorGlow.style.top = `${event.clientY}px`;
    }
  });

  const animate = () => {
    requestAnimationFrame(animate);

    torus.rotation.x += 0.004;
    torus.rotation.y += 0.006;

    orbOne.rotation.x += 0.01;
    orbOne.rotation.y += 0.012;
    orbTwo.rotation.x -= 0.008;
    orbTwo.rotation.z += 0.01;

    orbOne.position.y = 2.5 + Math.sin(Date.now() * 0.0015) * 0.35;
    orbTwo.position.y = -2 + Math.cos(Date.now() * 0.0012) * 0.4;

    camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.03;
    camera.position.y += (-mouseY * 1.5 - camera.position.y) * 0.03;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  };

  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function formatDate(dateValue) {
  if (!dateValue) {
    return 'Recently updated';
  }

  return new Date(dateValue).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function getIconClass(iconName) {
  const normalized = String(iconName || '').toLowerCase();

  if (normalized === 'github') {
    return 'fa-brands fa-github';
  }

  if (normalized === 'instagram') {
    return 'fa-brands fa-instagram';
  }

  return 'fa-brands fa-x-twitter';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function createSocialMarkup(items) {
  return items
    .map(
      (item) => `
        <a href="${item.url}" target="_blank" rel="noreferrer" aria-label="${item.name}">
          <i class="${getIconClass(item.icon)}"></i>
          <span>${item.name}</span>
        </a>
      `
    )
    .join('');
}

function renderSocials(items) {
  if (socialLinks) {
    socialLinks.innerHTML = createSocialMarkup(items);
  }

  if (contactActions) {
    contactActions.innerHTML = items
      .map((item, index) => {
        const variant = index === 0 ? 'btn btn-primary' : 'btn btn-secondary';
        return `<a class="${variant}" href="${item.url}" target="_blank" rel="noreferrer">${escapeHtml(item.name)}</a>`;
      })
      .join('');
  }

  const githubItem = items.find(
    (item) => String(item.icon || '').toLowerCase() === 'github' || String(item.name || '').toLowerCase() === 'github'
  );

  if (githubItem && githubProfileLink) {
    githubProfileLink.href = githubItem.url;
  }
}

function renderProjects(items) {
  if (!projectsGrid) {
    return;
  }

  if (!items.length) {
    if (projectSummary) {
      projectSummary.textContent = 'No public GitHub projects found yet.';
    }

    projectsGrid.innerHTML = '<p class="loading-text glass">Projects will appear here soon.</p>';
    return;
  }

  if (projectSummary) {
    const countLabel = `${items.length} GitHub project${items.length === 1 ? '' : 's'} loaded`;
    projectSummary.textContent = `${countLabel} — each card links directly to the repository or live demo.`;
  }

  projectsGrid.innerHTML = items
    .map((project) => {
      const topics = Array.isArray(project.topics) ? project.topics : [];
      const topicMarkup = topics.length
        ? `<div class="project-meta">${topics
            .map((topic) => `<span class="pill">#${escapeHtml(topic)}</span>`)
            .join('')}</div>`
        : '';

      return `
        <article class="project-card glass reveal visible" data-tilt>
          <span class="project-tag">${escapeHtml(project.language || 'Web Project')}</span>
          <h3>
            <a class="project-title-link" href="${project.url}" target="_blank" rel="noreferrer">
              ${escapeHtml(project.name)}
            </a>
          </h3>
          <p>${escapeHtml(project.description || 'Project hosted on GitHub.')}</p>
          <div class="project-meta">
            <span class="pill">⭐ ${project.stars ?? 0}</span>
            <span class="pill">Updated ${formatDate(project.updatedAt)}</span>
          </div>
          ${topicMarkup}
          <div class="project-actions">
            <a class="project-link" href="${project.url}" target="_blank" rel="noreferrer">
              <i class="fa-brands fa-github"></i>
              Open Repo
            </a>
            ${project.homepage ? `<a class="project-link" href="${project.homepage}" target="_blank" rel="noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Live Demo</a>` : ''}
          </div>
        </article>
      `;
    })
    .join('');

  bindTiltEffect();
}

async function loadPortfolio() {
  try {
    const response = await fetch('/api/portfolio');

    if (!response.ok) {
      throw new Error('Unable to load portfolio data.');
    }

    const data = await response.json();
    renderSocials(data.socials?.length ? data.socials : defaultPortfolio.socials);
    renderProjects(data.projects?.length ? data.projects : defaultPortfolio.projects);
  } catch (error) {
    renderSocials(defaultPortfolio.socials);
    renderProjects(defaultPortfolio.projects);
  }
}

async function notifyPortfolioVisit() {
  if (window.location.protocol === 'file:') {
    return;
  }

  try {
    if (sessionStorage.getItem(visitTrackKey) === 'true') {
      return;
    }

    const response = await fetch('/api/visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path: window.location.pathname,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        language: navigator.language,
        screen: `${window.screen.width}x${window.screen.height}`
      }),
      keepalive: true
    });

    if (response.ok) {
      sessionStorage.setItem(visitTrackKey, 'true');
    }
  } catch {
    // Ignore visit tracking errors for the user experience.
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();

  if (!contactForm || !formStatus) {
    return;
  }

  const formData = new FormData(contactForm);
  const payload = {
    name: formData.get('name')?.toString().trim(),
    email: formData.get('email')?.toString().trim(),
    phone: formData.get('phone')?.toString().trim(),
    message: formData.get('message')?.toString().trim()
  };

  formStatus.className = 'form-status';
  formStatus.textContent = 'Sending feedback...';

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({ message: 'Unable to send feedback.' }));

    if (!response.ok) {
      throw new Error(result.message || 'Unable to send feedback.');
    }

    formStatus.className = 'form-status success';
    formStatus.textContent = result.message || 'Thanks! Your feedback has been received successfully.';
    contactForm.reset();
  } catch (error) {
    formStatus.className = 'form-status error';

    if (window.location.protocol === 'file:') {
      formStatus.textContent = 'Open the site using the Node server to enable the contact form.';
      return;
    }

    formStatus.textContent = error.message;
  }
}

const revealItems = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.18 }
);

revealItems.forEach((item) => observer.observe(item));

function bindTiltEffect() {
  const tiltItems = document.querySelectorAll('[data-tilt]');

  tiltItems.forEach((item) => {
    if (item.dataset.tiltBound === 'true') {
      return;
    }

    item.dataset.tiltBound = 'true';

    item.addEventListener('mousemove', (event) => {
      const rect = item.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateX = (y / rect.height - 0.5) * -10;
      const rotateY = (x / rect.width - 0.5) * 10;

      item.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    item.addEventListener('mouseleave', () => {
      item.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  });
}

if (contactForm) {
  contactForm.addEventListener('submit', handleFormSubmit);
}

bindTiltEffect();
initThreeScene();
loadPortfolio();
notifyPortfolioVisit();
