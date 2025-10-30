export function renderStars(avg) {
  const stars = [];
  let remain = avg;

  for (let i = 0; i < 5; i++) {
    if (remain >= 1) {
      stars.push('<i class="bi bi-star-fill"></i>');
    } else if (remain >= 0.5) {
      stars.push('<i class="bi bi-star-half"></i>');
    } else {
      stars.push('<i class="bi bi-star"></i>');
    }
    remain -= 1;
  }
  return stars.join('');
}
