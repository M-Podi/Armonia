// Comparison functionality
const COMPARISON_KEY = 'product_comparison';
const COMPARISON_TIMESTAMP_KEY = 'comparison_timestamp';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Initialize comparison functionality
function initComparison() {
    // Check if comparison data exists and is not older than 1 day
    const timestamp = localStorage.getItem(COMPARISON_TIMESTAMP_KEY);
    const now = Date.now();
    
    if (timestamp && (now - parseInt(timestamp)) < ONE_DAY_MS) {
        const comparisonData = JSON.parse(localStorage.getItem(COMPARISON_KEY) || '[]');
        if (comparisonData.length > 0) {
            showComparisonContainer(comparisonData);
        }
    } else {
        // Clear old comparison data
        localStorage.removeItem(COMPARISON_KEY);
        localStorage.removeItem(COMPARISON_TIMESTAMP_KEY);
    }
}

// Add product to comparison
function addToComparison(productId, productName) {
    let comparisonData = JSON.parse(localStorage.getItem(COMPARISON_KEY) || '[]');
    
    // Check if product is already in comparison
    if (comparisonData.some(item => item.id === productId)) {
        return;
    }
    
    // Add product to comparison
    comparisonData.push({ id: productId, name: productName });
    localStorage.setItem(COMPARISON_KEY, JSON.stringify(comparisonData));
    localStorage.setItem(COMPARISON_TIMESTAMP_KEY, Date.now().toString());
    
    // Update UI
    showComparisonContainer(comparisonData);
    
    // Disable compare buttons if we have 2 products
    if (comparisonData.length === 2) {
        document.querySelectorAll('.compare-button').forEach(button => {
            button.disabled = true;
        });
    }
}

// Remove product from comparison
function removeFromComparison(productId) {
    let comparisonData = JSON.parse(localStorage.getItem(COMPARISON_KEY) || '[]');
    comparisonData = comparisonData.filter(item => item.id !== productId);
    localStorage.setItem(COMPARISON_KEY, JSON.stringify(comparisonData));
    
    // Update UI
    if (comparisonData.length === 0) {
        hideComparisonContainer();
    } else {
        showComparisonContainer(comparisonData);
    }
    
    // Re-enable compare buttons if we have less than 2 products
    if (comparisonData.length < 2) {
        document.querySelectorAll('.compare-button').forEach(button => {
            button.disabled = false;
        });
    }
}

// Show comparison container
function showComparisonContainer(comparisonData) {
    let container = document.getElementById('container-comparare');
    if (!container) {
        container = document.createElement('div');
        container.id = 'container-comparare';
        document.body.appendChild(container);
    }
    
    container.innerHTML = `
        <h3>Produse de comparat</h3>
        <ul class="product-list">
            ${comparisonData.map(item => `
                <li class="product-item">
                    <span>${item.name}</span>
                    <button class="remove-product" onclick="removeFromComparison('${item.id}')">×</button>
                </li>
            `).join('')}
        </ul>
        ${comparisonData.length === 2 ? `
            <button class="show-comparison" onclick="showComparison()">Afișează comparația</button>
        ` : ''}
    `;
    
    container.classList.add('visible');
}

// Hide comparison container
function hideComparisonContainer() {
    const container = document.getElementById('container-comparare');
    if (container) {
        container.classList.remove('visible');
    }
}

// Show comparison in new window
function showComparison() {
    const comparisonData = JSON.parse(localStorage.getItem(COMPARISON_KEY) || '[]');
    if (comparisonData.length !== 2) return;
    
    // Open new window
    const comparisonWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Fetch product details for both products
    Promise.all(comparisonData.map(item => 
        fetch(`/api/products/${item.id}`).then(response => response.json())
    )).then(products => {
        // Create comparison table
        const table = createComparisonTable(products);
        
        // Write HTML to new window
        comparisonWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Comparație produse</title>
                <link rel="stylesheet" href="/comparison.css">
            </head>
            <body>
                <h1>Comparație produse</h1>
                ${table}
            </body>
            </html>
        `);
        comparisonWindow.document.close();
    });
}

// Create comparison table
function createComparisonTable(products) {
    const characteristics = [
        { name: 'Nume', key: 'nume' },
        { name: 'Categorie', key: 'categorie' },
        { name: 'Tip', key: 'tip' },
        { name: 'Preț', key: 'pret', format: value => `${value.toLocaleString('ro-RO')} lei` },
        { name: 'An fabricație', key: 'an_fabricatie' },
        { name: 'Greutate', key: 'greutate', format: value => `${value} g` },
        { name: 'Electric', key: 'electric', format: value => value ? 'Da' : 'Nu' },
        { name: 'Materiale', key: 'materiale', format: value => value ? value.join(', ') : 'Nespecificat' },
        { name: 'Descriere', key: 'descriere' }
    ];
    
    return `
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>Caracteristică</th>
                    ${products.map(product => `<th>${product.nume}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${characteristics.map(char => `
                    <tr>
                        <td>${char.name}</td>
                        ${products.map(product => {
                            const value = product[char.key];
                            return `<td>${char.format ? char.format(value) : value || 'Nespecificat'}</td>`;
                        }).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initComparison); 