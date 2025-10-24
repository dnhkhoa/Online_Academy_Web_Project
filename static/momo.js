(() => {
  const btn = document.getElementById('btnMomoPay');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const amount = document.getElementById('amountInput')?.value || '0';
    if (!amount || Number(amount) <= 0) {
      alert('Số tiền không hợp lệ.');
      return;
    }

    const url = new URL(window.location.origin + '/payment/momo');
    url.searchParams.set('amount', String(Math.round(Number(amount))));
    window.location.href = url.toString();
  });
})();

