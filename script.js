let cart = [];
let total = 0;

function addToCart(name, price) {
    let item = cart.find(i => i.name === name);
    if (item) {
        item.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    updateCart();
}

function updateCart() {
    let cartList = document.getElementById("cart-items");
    let totalPrice = document.getElementById("total-price");

    cartList.innerHTML = "";
    total = 0;

    cart.forEach((item, index) => {
        total += item.price * item.quantity;
        let li = document.createElement("li");
        li.innerHTML = `
            <strong>${item.name}</strong> - ₹${item.price} x 
            <input type="number" value="${item.quantity}" min="1" 
                   onchange="updateQuantity(${index}, this.value)">
            <button onclick="removeFromCart('${item.name}')">❌</button>
        `;
        cartList.appendChild(li);
    });

    totalPrice.innerText = `Total: ₹${total}`;
}

function updateQuantity(index, newQuantity) {
    cart[index].quantity = parseInt(newQuantity);
    updateCart();
}

function removeFromCart(name) {
    cart = cart.filter(item => item.name !== name);
    updateCart();
}

function showPaymentOptions() {
    const paymentModal = document.createElement('div');
    paymentModal.className = 'payment-modal';
    paymentModal.innerHTML = `
        <div class="payment-content">
            <h2>Select Payment Method</h2>
            <div class="payment-options">
                <button onclick="processPayment('UPI')" class="payment-btn upi">
                    <img src="./images/upi.png" alt="UPI" style="width: 30px; height: 30px;">
                    UPI Payment
                </button>
                <button onclick="processPayment('Card')" class="payment-btn card">
                    <img src="./images/card.png" alt="Card" style="width: 30px; height: 30px;">
                    Card Payment
                </button>
                <button onclick="processPayment('Cash')" class="payment-btn cash">
                    <img src="./images/cash.png" alt="Cash" style="width: 30px; height: 30px;">
                    Cash on Delivery
                </button>
            </div>
            <button onclick="closePaymentModal()" class="close-btn">✕</button>
        </div>
    `;
    document.body.appendChild(paymentModal);
}

function closePaymentModal() {
    const modal = document.querySelector('.payment-modal');
    if (modal) {
        modal.remove();
    }
}

async function processPayment(method) {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    let orderData = {
        items: cart.map(item => `${item.name} (x${item.quantity})`).join(", "),
        total: total,
        paymentMethod: method
    };

    try {
        let response = await fetch("http://localhost:5000/orders", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            alert(`Order placed successfully! Payment method: ${method}`);
            cart = [];
            updateCart();
            closePaymentModal();
        } else {
            alert("Failed to place order. Please try again.");
        }
    } catch (error) {
        console.error("Error during checkout:", error);
        alert("Failed to place order. Please try again.");
    }
}

function checkout() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    showPaymentOptions();
}

// Add styles for payment modal
const style = document.createElement('style');
style.textContent = `
    .payment-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    .payment-content {
        background: white;
        padding: 20px;
        border-radius: 8px;
        width: 400px;
        max-width: 90%;
        position: relative;
    }
    .payment-options {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 20px;
    }
    .payment-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 15px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.3s ease;
    }
    .payment-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .upi {
        background: #6c5ce7;
        color: white;
    }
    .card {
        background: #00b894;
        color: white;
    }
    .cash {
        background: #fdcb6e;
        color: black;
    }
    .close-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
    }
`;
document.head.appendChild(style);
