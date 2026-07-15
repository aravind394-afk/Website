const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('#mainNav');

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    mainNav.classList.toggle('open');
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const revealItems = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealItems.forEach((item) => observer.observe(item));

const modal = document.querySelector('#imageModal');
const modalImage = document.querySelector('#modalImage');
const modalTitle = document.querySelector('#modalTitle');
const openers = document.querySelectorAll('[data-full]');
const closers = document.querySelectorAll('[data-close-modal]');

function openModal(src, title) {
  if (!modal || !modalImage || !modalTitle) return;
  modalImage.src = src;
  modalImage.alt = title || 'Preview image';
  modalTitle.textContent = title || 'Preview';
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeModal() {
  if (!modal || !modalImage) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  setTimeout(() => { modalImage.src = ''; }, 180);
}

openers.forEach((button) => {
  button.addEventListener('click', () => openModal(button.dataset.full, button.dataset.title));
});
closers.forEach((button) => button.addEventListener('click', closeModal));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal();
});

const enquiryStorageKey = 'nsKuberaEnquiry';
const visitForm = document.querySelector('#visitForm');

function generateApplicationNumber() {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('');
  const timePart = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0')
  ].join('');
  const randomPart = Math.floor(100 + Math.random() * 900);
  return `NSK-${datePart}-${timePart}${randomPart}`;
}

function normalizeEnquiryDetails(source) {
  const getValue = (key) => String(source.get(key) || '').trim();
  return {
    name: getValue('name'),
    phone: getValue('phone'),
    homeType: getValue('homeType') || 'Not selected',
    purpose: getValue('purpose') || 'Not selected',
    visitDate: getValue('visitDate') || 'Not selected',
    time: getValue('time') || 'Not provided',
    message: getValue('message') || 'Not provided',
    applicationNumber: getValue('applicationNumber') || generateApplicationNumber()
  };
}

function enquiryToParams(enquiryDetails) {
  const params = new URLSearchParams();
  Object.entries(enquiryDetails).forEach(([key, value]) => {
    params.set(key, value);
  });
  return params;
}

if (visitForm) {
  visitForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!visitForm.checkValidity()) {
      visitForm.reportValidity();
      return;
    }

    const formData = new FormData(visitForm);
    const enquiryDetails = normalizeEnquiryDetails(formData);

    try {
      sessionStorage.setItem(enquiryStorageKey, JSON.stringify(enquiryDetails));
    } catch (error) {
      console.warn('Unable to store enquiry details for thank-you page.', error);
    }

    const params = enquiryToParams(enquiryDetails).toString();
    window.location.assign(`thank-you.html?${params}`);
  });
}

const thankYouName = document.querySelector('[data-thank-you-name]');
if (thankYouName) {
  let savedEnquiry = null;

  try {
    savedEnquiry = JSON.parse(sessionStorage.getItem(enquiryStorageKey) || 'null');
  } catch (error) {
    savedEnquiry = null;
  }

  const params = new URLSearchParams(window.location.search);
  const queryEnquiry = {
    name: params.get('name') || '',
    phone: params.get('phone') || '',
    homeType: params.get('homeType') || '',
    purpose: params.get('purpose') || '',
    visitDate: params.get('visitDate') || '',
    time: params.get('time') || '',
    message: params.get('message') || '',
    applicationNumber: params.get('applicationNumber') || ''
  };

  const safeEnquiry = savedEnquiry && typeof savedEnquiry === 'object'
    ? { ...queryEnquiry, ...savedEnquiry }
    : queryEnquiry;
  if (!safeEnquiry.applicationNumber) {
    safeEnquiry.applicationNumber = generateApplicationNumber();
  }
  thankYouName.textContent = safeEnquiry.name || 'there';

  document.querySelectorAll('[data-application-number]').forEach((item) => {
    item.textContent = safeEnquiry.applicationNumber;
  });

  document.querySelectorAll('[data-summary-field]').forEach((item) => {
    const key = item.getAttribute('data-summary-field');
    const value = safeEnquiry[key];
    item.textContent = value && String(value).trim() ? value : 'Not provided';
  });

  const whatsappButtons = document.querySelectorAll('[data-thank-you-whatsapp]');
  if (whatsappButtons.length) {
    const messageLines = [
      'Hi Nallasamy Developers, I just submitted an enquiry for NS Kubera. Please assist me with the next steps.',
      `Application Number: ${safeEnquiry.applicationNumber || 'Not provided'}`,
      `Name: ${safeEnquiry.name || 'Not provided'}`,
      `Phone: ${safeEnquiry.phone || 'Not provided'}`,
      `Preferred Apartment: ${safeEnquiry.homeType || 'Not provided'}`,
      `Buying Purpose: ${safeEnquiry.purpose || 'Not provided'}`,
      `Preferred Visit Date: ${safeEnquiry.visitDate || 'Not provided'}`,
      `Preferred Visit Time: ${safeEnquiry.time || 'Not provided'}`,
      `Questions: ${safeEnquiry.message || 'Not provided'}`
    ];
    const whatsappHref = `https://wa.me/919042492278?text=${encodeURIComponent(messageLines.join('\n'))}`;
    whatsappButtons.forEach((button) => {
      button.href = whatsappHref;
    });
  }
}
