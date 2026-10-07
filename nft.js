'use strict';

function recipeNftPanel() {
  if (!window.CrustApi?.isAuthed()) {
    notify('Connect your wallet to mint and sync recipe NFTs.');
    return;
  }
  const rows = R.map((r, i) => {
    if (r.side) return '';
    const stats = W.recipeReviewStats(s, i);
    const el = W.recipeNftEligibility(s, i);
    const owned = (s.nfts || []).find((n) => n.recipeIndex === i && !n.retired);
    return `<div class="recipe-card"><img src="assets/pizza.png" alt=""><div class="card-description"><strong>${r.name}</strong><small>${stats.count}/${W.NFT_REVIEW_MIN} rated servings · avg ${stats.avg || '—'}★${owned ? '<br>Minted ✓' : el.ok ? '<br>Ready to mint!' : '<br>' + el.reason}</small></div><button class="action-btn" data-mint-recipe="${i}" ${!el.ok || owned ? 'disabled' : ''}>${owned ? 'Minted' : el.ok ? 'Mint NFT' : 'Locked'}</button></div>`;
  }).join('');
  const list = (s.nfts || [])
    .map(
      (n) =>
        `<div class="recipe-card"><span class="food-icon">🍕</span><div class="card-description"><strong>${n.name}</strong><small>${n.avg}★ · value ${n.value}${n.onChain?.mint ? '<br>Mint: ' + n.onChain.mint.slice(0, 8) + '…' : '<br>Off-chain card'}</small></div></div>`
    )
    .join('');
  openPanel(
    `<div class="panel-kicker">RECIPE NFTS</div><h2>Your signature pies</h2><p class="panel-intro">Serve a recipe ${W.NFT_REVIEW_MIN} times with customer ratings to mint. Value = ingredient cost + (avg rating × 10). Below 2★ average cannot mint. On devnet, SPL tokens are sent to your wallet when the server minter is configured.</p><h3 class="panel-sub">Mint</h3>${rows || '<p class="empty-card">Cook pizzas to collect reviews.</p>'}<h3 class="panel-sub">Collection</h3>${list || '<p class="empty-card">No mints yet.</p>'}`,
    'nft'
  );
}

$('panelBody').addEventListener('click', async (ev) => {
  const b = ev.target.closest('[data-mint-recipe]');
  if (!b) return;
  const recipeIndex = Number(b.dataset.mintRecipe);
  if (!window.CrustApi.isAuthed()) {
    notify('Connect wallet first.');
    return;
  }
  const el = W.recipeNftEligibility(s, recipeIndex);
  if (!el.ok) {
    notify(el.reason || 'Cannot mint yet.');
    return;
  }
  b.disabled = true;
  try {
    await window.CrustApi.pushSave(s);
    const res = await window.CrustApi.mintRecipeNft(recipeIndex);
    const c = res.card;
    s.nfts = s.nfts || [];
    s.nfts.push({
      id: c.cardId,
      recipeIndex: c.recipeIndex,
      name: c.name,
      avg: c.avg,
      value: c.value,
      reviews: c.reviews,
      retired: c.retired,
      mintedAt: new Date(c.mintedAt).getTime(),
      onChain: c.onChain,
    });
    if (c.onChain?.mint) notify('Minted on Solana! ' + c.onChain.mint.slice(0, 12) + '…');
    else if (res.onChain?.skipped) notify('Saved to your wallet account. ' + (res.onChain.reason || ''));
    else notify('Recipe NFT added to your collection.');
    save();
    hud();
    recipeNftPanel();
  } catch (err) {
    notify(err.message || 'Mint failed.');
    b.disabled = false;
  }
});

function initNftUi() {
  const btn = $('recipeNfts');
  if (btn) btn.onclick = () => recipeNftPanel();
}

document.addEventListener('DOMContentLoaded', initNftUi);
