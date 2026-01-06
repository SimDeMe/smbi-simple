document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  const listItems = document.querySelectorAll('.list li');
  const cards = document.querySelectorAll('.card');

  // Filter function
  const filterList = (query) => {
    const lowerQuery = query.toLowerCase();

    // 1. Filter individual list items
    listItems.forEach(li => {
      const text = li.textContent.toLowerCase();
      const match = text.includes(lowerQuery);
      li.style.display = match ? '' : 'none';
    });

    // 2. Hide empty cards
    cards.forEach(card => {
      const lis = card.querySelectorAll('.list li');
      // Only affect cards that actually contain list items
      if (lis.length > 0) {
        const anyVisible = Array.from(lis).some(li => li.style.display !== 'none');
        card.style.display = anyVisible ? '' : 'none';
      }
    });
  };

  // Event listener for input
  searchInput.addEventListener('input', (e) => {
    filterList(e.target.value);
  });

  // Event listener for tags
  document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', (e) => {
      const tagText = tag.textContent;
      searchInput.value = tagText;
      filterList(tagText);
      searchInput.focus();
    });
  });
});
