document.addEventListener('DOMContentLoaded', function() {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const container = img.closest('.post-cover-container');
        
        if (container) {
          container.classList.remove('loading');
        }
        
        img.src = img.dataset.src;
        img.onload = () => {
          img.classList.add('loaded');
        };
        
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.1
  });
  
  images.forEach(img => {
    const container = img.closest('.post-cover-container');
    if (container) {
      container.classList.add('loading');
    }
    imageObserver.observe(img);
  });
});
