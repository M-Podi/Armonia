// Constants for offer management
const OFFER_INTERVAL = 2 * 60 * 1000; // 2 minutes for testing (change to 24 * 60 * 60 * 1000 for 1 day)
const OLD_OFFER_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes for testing (change as needed)
const POSSIBLE_DISCOUNTS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

// Function to generate a new offer
async function generateNewOffer() {
    try {
        // Get all categories from the database
        const response = await fetch('/api/categories');
        const categories = await response.json();
        
        // Get current offers
        const offersResponse = await fetch('/api/offers');
        const offersData = await offersResponse.json();
        const currentOffers = offersData.oferte || [];
        
        // Get the last category that had an offer
        const lastCategory = currentOffers.length > 0 ? currentOffers[0].categorie : null;
        
        // Filter out the last category to avoid consecutive offers
        const availableCategories = categories.filter(cat => cat !== lastCategory);
        
        if (availableCategories.length === 0) {
            console.error('No available categories for new offer');
            return;
        }
        
        // Randomly select a category and discount
        const randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        const randomDiscount = POSSIBLE_DISCOUNTS[Math.floor(Math.random() * POSSIBLE_DISCOUNTS.length)];
        
        // Create new offer
        const now = new Date();
        const newOffer = {
            categorie: randomCategory,
            "data-incepere": now.toISOString(),
            "data-finalizare": new Date(now.getTime() + OFFER_INTERVAL).toISOString(),
            reducere: randomDiscount
        };
        
        // Add new offer to the beginning of the array
        currentOffers.unshift(newOffer);
        
        // Update offers in the database
        await fetch('/api/offers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ oferte: currentOffers })
        });
        
        // Update the display
        updateOfferDisplay(newOffer);
        
    } catch (error) {
        console.error('Error generating new offer:', error);
    }
}

// Function to update the offer display
function updateOfferDisplay(offer) {
    const offerContainer = document.getElementById('current-offer');
    if (!offerContainer) return;
    
    const now = new Date();
    const endTime = new Date(offer["data-finalizare"]);
    
    if (now >= endTime) {
        offerContainer.style.display = 'none';
        generateNewOffer();
        return;
    }
    
    offerContainer.style.display = 'block';
    offerContainer.innerHTML = `
        <div class="offer-content">
            <h3>Ofertă specială!</h3>
            <p>Reducere de ${offer.reducere}% la toate produsele din categoria ${offer.categorie}</p>
            <div class="offer-timer" id="offer-timer"></div>
        </div>
    `;
    
    // Start the countdown
    startCountdown(endTime);
}

// Function to start the countdown timer
function startCountdown(endTime) {
    const timerElement = document.getElementById('offer-timer');
    if (!timerElement) return;
    
    const updateTimer = () => {
        const now = new Date();
        const timeLeft = endTime - now;
        
        if (timeLeft <= 0) {
            timerElement.textContent = 'Oferta a expirat!';
            timerElement.classList.add('expired');
            setTimeout(() => {
                generateNewOffer();
            }, 1000);
            return;
        }
        
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        timerElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Add special styling for last 10 seconds
        if (timeLeft <= 10000) {
            timerElement.classList.add('last-seconds');
            if (!timerElement.dataset.soundPlayed) {
                playExpirationSound();
                timerElement.dataset.soundPlayed = 'true';
            }
        } else {
            timerElement.classList.remove('last-seconds');
            timerElement.dataset.soundPlayed = '';
        }
        
        setTimeout(updateTimer, 1000);
    };
    
    updateTimer();
}

// Function to play expiration sound
function playExpirationSound() {
    const audio = new Audio('/resources/expiration-sound.mp3');
    audio.play().catch(error => console.error('Error playing sound:', error));
}

// Function to update product prices with discounts
function updateProductPrices(offer) {
    if (!offer) return;
    
    const products = document.querySelectorAll('.instrument-article');
    products.forEach(product => {
        const category = product.getAttribute('data-categorie');
        if (category === offer.categorie) {
            const priceElement = product.querySelector('.product-price');
            if (priceElement) {
                const originalPrice = parseFloat(priceElement.getAttribute('data-original-price'));
                const discountedPrice = originalPrice * (1 - offer.reducere / 100);
                
                priceElement.innerHTML = `
                    <span class="original-price">${originalPrice.toLocaleString('ro-RO')} lei</span>
                    <span class="discounted-price">${discountedPrice.toLocaleString('ro-RO')} lei</span>
                `;
            }
        }
    });
}

// Function to clean up old offers
async function cleanupOldOffers() {
    try {
        const response = await fetch('/api/offers');
        const offersData = await response.json();
        const currentOffers = offersData.oferte || [];
        
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - OLD_OFFER_CLEANUP_INTERVAL);
        
        // Filter out offers older than the cutoff time
        const updatedOffers = currentOffers.filter(offer => 
            new Date(offer["data-finalizare"]) > cutoffTime
        );
        
        // Update offers in the database
        await fetch('/api/offers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ oferte: updatedOffers })
        });
        
    } catch (error) {
        console.error('Error cleaning up old offers:', error);
    }
}

// Initialize the offers system
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get current offer
        const response = await fetch('/api/offers');
        const offersData = await response.json();
        const currentOffers = offersData.oferte || [];
        
        if (currentOffers.length > 0) {
            const currentOffer = currentOffers[0];
            updateOfferDisplay(currentOffer);
            updateProductPrices(currentOffer);
        } else {
            generateNewOffer();
        }
        
        // Set up periodic cleanup
        setInterval(cleanupOldOffers, OLD_OFFER_CLEANUP_INTERVAL);
        
    } catch (error) {
        console.error('Error initializing offers:', error);
    }
}); 