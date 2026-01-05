// public/shop.js (yangilangan qismi)

window.uiManager.loadShopItems = function() {
    const list = document.getElementById('shopItemsList');
    if (!list) return;

    list.innerHTML = `
        <h3 style="text-align:center; margin-bottom:20px;">Real pul bilan tanga sotib olish</h3>
    `;

    // Telegram Stars paketlarini ko'rsatish
    window.payment.renderShopPackages();

    // Agar xohlasangiz oddiy coin paketlarini ham qoldirish mumkin
    const extraItems = [
        { name: 'Kunlik Super Like +3', desc: 'Tezroq match toping', price: 50, type: 'coins' }
    ];

    extraItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <div class="shop-item-info">
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-description">${item.desc}</div>
            </div>
            <button class="shop-item-buy" onclick="uiManager.buyItem('superlike_extra')">
                ${item.price} tanga
            </button>
        `;
        list.appendChild(div);
    });
};