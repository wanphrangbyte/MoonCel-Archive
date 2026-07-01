// This is the list of all the anime characters a user can win in the game
const servants = [
    // We store the name class color and image path for Saber
    { name: "Saber", class: "saber", color: "#3388ff", img: "../assets/saber.png" },
    // We store the details for Archer
    { name: "Archer", class: "archer", color: "#ff4d6d", img: "../assets/archer.jpg" },
    // We store the details for Lancer
    { name: "Lancer", class: "lancer", color: "#ff3333", img: "../assets/lancer.jpg" },
    // We store the details for Rider
    { name: "Rider", class: "rider", color: "#b84dff", img: "../assets/rider.jpeg" },
    // We store the details for Caster
    { name: "Caster", class: "caster", color: "#33ddff", img: "../assets/caster.jpg" },
    // We store the details for Assassin
    { name: "Assassin", class: "assassin", color: "#a3a3a3", img: "../assets/assassin.jpg" },
    // We store the details for Berserker
    { name: "Berserker", class: "berserker", color: "#ff6633", img: "../assets/berserker.jpg" } 
];

// We start with no discount applied to the store
let globalDiscount = 0;
// We start with no character summoned yet
let summonedServant = null;
// We create an empty list to hold the items the user wants to buy
let cart = [];
// We create an empty list to store all the products we load from the database
let globalArchiveProducts = [];
// We track if the user is looking at the back of a shirt in the popup window
let isShowingBack = false;

// We grab the image element for the spinning card game
const gachaImg = document.getElementById('gacha-image');
// We grab the white flash effect element to make it look cool
const gachaFlash = document.getElementById('gacha-flash');
// We grab the box that holds the spinning card
const gachaCardContainer = document.getElementById('gacha-card-container');

// We wait for the webpage to fully load before we do anything else
document.addEventListener("DOMContentLoaded", async () => {
    // We check if the user is logged in by looking for their digital key
    const token = localStorage.getItem("token");

    // If they do not have a key we send them back to the login page
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // We grab the hidden game screen
    const realityMarble = document.getElementById("reality-marble");
    // We grab the main store page
    const shopSection = document.getElementById("shopSection");

    // We try to talk to our server to see if the user is allowed to play the game
    try {
        // We send a request to the server with their digital key
        const response = await fetch("http://localhost:5000/reality-marble-access", {
            method: "GET",
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // If the admin blocked them we kick them out immediately
        if (response.status === 403) { forceLogout("You have been blocked by the admin."); return; }
        // If their key is expired or fake we send them to login
        if (!response.ok) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        // We convert the server response into readable data
        const data = await response.json();
        // We look for the spot where the username goes in the top bar
        const usernameSpan = document.getElementById('nav-username');
        // If we found the spot and the server sent a name we put it there
        if (usernameSpan && data.username) usernameSpan.innerText = data.username;

        // If the server says they are allowed to play the game right now
        if (data.access === true) {
            // We make sure the game screen exists
            if(realityMarble) {
                // We make the game screen visible
                realityMarble.style.display = "flex";
                // We force the browser to draw it right now so it does not glitch
                void realityMarble.offsetWidth; 
                // We make it fully solid and visible
                realityMarble.style.opacity = "1";
            }
            // We start spinning the cards automatically
            startSummonRitual(data.discount);
        // If the server says they already played and still have an active discount
        } else {
            // We hide the game screen completely
            if(realityMarble) realityMarble.style.display = "none";
            // We set their current discount to whatever the server told us
            globalDiscount = data.discount || 0;
            
            // We check the browser memory to remember what color their character was
            const savedColor = localStorage.getItem('mooncelTheme');
            // We check the browser memory to remember their character name
            const savedServant = localStorage.getItem('mooncelServant');
            
            // If we remember their color we apply it to the website
            if (savedColor) {
                // We change the main theme color variable
                document.documentElement.style.setProperty('--theme-color', savedColor);
                // We take off the hash symbol from the color code
                const hex = savedColor.replace('#', '');
                // We figure out how much red is in the color
                const r = parseInt(hex.substring(0, 2), 16);
                // We figure out how much green is in the color
                const g = parseInt(hex.substring(2, 4), 16);
                // We figure out how much blue is in the color
                const b = parseInt(hex.substring(4, 6), 16);
                // We create a see through glowing version of their color for shadows
                document.documentElement.style.setProperty('--theme-glow', `rgba(${r}, ${g}, ${b}, 0.7)`);
            }
            
            // If we remember their character name we show it at the top
            if (savedServant) document.getElementById('active-blessing').innerText = `${savedServant} (${globalDiscount}% OFF)`;
            // If we forgot we just show a generic message
            else document.getElementById('active-blessing').innerText = `ACTIVE BLESSING (${globalDiscount}% OFF)`;
            
            // We tell the page to load all the shirts and posters from the database
            loadProductsFromDatabase(); 
            
            // We make sure the store section exists
            if(shopSection) {
                // We remove the classes that hide the store
                shopSection.classList.remove("hidden", "opacity-0");
                // We make it fully solid and visible
                shopSection.style.opacity = "1";
                // We tell the browser to display it normally
                shopSection.style.display = "block";
            }
            // The user skipped the gacha because they already have an active discount.
            // We still start the music right away so the store always has atmosphere.
            showMusicPlayer();
        }
    // If our server is turned off or broken we log the error
    } catch (error) { console.error("Failed to connect to Reality Marble:", error); }
});

// This happens when the user clicks the manual gacha button on the top bar
async function checkRealityMarbleAccess() {
    // We grab their digital key again
    const token = localStorage.getItem("token");
    // If they do not have one we just stop
    if (!token) return;

    // We ask the server if they are allowed to play again
    try {
        const response = await fetch("http://localhost:5000/reality-marble-access", {
            method: "GET",
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // If the admin blocked them we kick them out
        if (response.status === 403) { forceLogout("You have been blocked by the admin."); return; }

        // We convert the answer to readable data
        const data = await response.json();

        // If the server says yes you can play
        if (data.access === true) {
            // We hide the main store page
            document.getElementById("shopSection").classList.add("hidden");
            // We fade the store page out
            document.getElementById("shopSection").style.opacity = "0";
            
            // We grab the game screen
            const intro = document.getElementById("reality-marble");
            // We make it visible
            intro.style.display = "flex";
            // We force the browser to draw it instantly
            void intro.offsetWidth; 
            // We make it solid
            intro.style.opacity = '1';
            
            // We make sure the spinning card is normal size
            gachaCardContainer.style.transform = 'scale(1)';
            // We make the card solid and visible
            gachaCardContainer.style.opacity = '1';
            
            // We find the text that says initiating summon
            const summonText = document.getElementById('summon-text');
            // We make sure it is showing
            if(summonText) summonText.classList.remove('hidden');
            
            // We find the final result text box
            const resultDiv = document.getElementById('gacha-result');
            // We hide it for now because the game is just starting
            if(resultDiv) { resultDiv.classList.add('hidden'); resultDiv.style.opacity = '0'; }
            
            // We start spinning the cards
            startSummonRitual(data.discount);
        // If the server says no you still have a discount active
        } else {
            // We show a pretty warning popup telling them to buy something first
            showCustomAlert("Existing discount still exists or has not expired. Use it before summoning again.");
        }
    // If the server crashes we log the error
    } catch (error) { console.error("Error:", error); }
}

// This function controls the rapid flashing card animation
function startSummonRitual(serverDiscount) {
    // We start counting how many times the card flips
    let shuffleCount = 0;
    // We decide it will flip thirty times total
    const maxShuffles = 30;
    // We decide it will wait eighty milliseconds between flips
    const shuffleSpeed = 80;
    // We start a timer loop that repeats the flip over and over
    const shuffleInterval = setInterval(() => {
        // We pick a random anime character from our list
        const randomServant = servants[Math.floor(Math.random() * servants.length)];
        // We change the picture to that random character
        gachaImg.src = randomServant.img;
        // We make the white flash appear slightly
        gachaFlash.style.opacity = '0.5';
        // We make the flash disappear very fast
        setTimeout(() => gachaFlash.style.opacity = '0', 30);
        // We shake the card slightly to look cool
        gachaCardContainer.style.animation = 'cinematic-shake 0.1s infinite';
        // We add one to our flip counter
        shuffleCount++;
        // If we flipped thirty times
        if (shuffleCount >= maxShuffles) {
            // We stop the timer loop completely
            clearInterval(shuffleInterval);
            // We move on to show them the real winner
            finalizeSummon(serverDiscount); 
        }
    }, shuffleSpeed);
}

// This function locks in the final character they won
function finalizeSummon(serverDiscount) {
    // We stop the card from shaking
    gachaCardContainer.style.animation = 'none';
    // We pick the real final character they get to keep
    summonedServant = servants[Math.floor(Math.random() * servants.length)];
    // We show that character picture
    gachaImg.src = summonedServant.img;
    // We save their new discount number
    globalDiscount = serverDiscount;
    // We remember the color they won in the browser memory
    localStorage.setItem('mooncelTheme', summonedServant.color);
    // We remember the name they won in the browser memory
    localStorage.setItem('mooncelServant', summonedServant.name);
    // We make the card flash completely white
    gachaFlash.style.opacity = '1';
    // We change the flash to match the character color
    gachaFlash.style.backgroundColor = summonedServant.color;

    // We wait a tiny moment then do the final reveal
    setTimeout(() => {
        // We hide the flash
        gachaFlash.style.opacity = '0';
        // We make the card grow bigger
        gachaCardContainer.style.transform = 'scale(1.15)';
        // We add a huge glowing shadow matching their color
        gachaCardContainer.style.boxShadow = `0 0 60px ${summonedServant.color}`;
        // We paint the border of the card their color
        gachaCardContainer.style.borderColor = summonedServant.color;
        // We change the whole website theme color to match
        document.documentElement.style.setProperty('--theme-color', summonedServant.color);

        // We convert their color into numbers so we can make it see through
        const hex = summonedServant.color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        // We save the see through color
        document.documentElement.style.setProperty('--theme-glow', `rgba(${r}, ${g}, ${b}, 0.7)`);
        // We shoot forty little dots out of the card
        createParticles(summonedServant.color);

        // We hide the initiating summon text
        const summonText = document.getElementById('summon-text');
        if(summonText) summonText.classList.add('hidden');
        // We grab the result text box
        const resultDiv = document.getElementById('gacha-result');
        // We write the character name on the screen
        document.getElementById('servant-name').innerText = summonedServant.name;
        // We tell them how much money they save
        document.getElementById('servant-discount').innerText = `You obtained ${summonedServant.name} — ${globalDiscount}% Discount`;

        // We make the result text box visible slowly
        if(resultDiv) {
            resultDiv.classList.remove('hidden');
            setTimeout(() => resultDiv.style.opacity = '1', 100);
        }
        // We update the top bar to show their new active blessing
        document.getElementById('active-blessing').innerText = `${summonedServant.name} (${globalDiscount}% OFF)`;
        // If the store is already loaded we update all the prices instantly
        if (typeof updateProductPrices === "function") updateProductPrices();
    }, 300);
}

// This makes little flying colored dots shoot out when you win
function createParticles(color) {
    // We grab the game screen
    const container = document.getElementById('reality-marble');
    // If it is missing we stop
    if(!container) return;
    // We figure out exactly where the card is on the screen
    const rect = gachaCardContainer.getBoundingClientRect();
    // We find the middle of the card left to right
    const centerX = rect.left + rect.width / 2;
    // We find the middle of the card top to bottom
    const centerY = rect.top + rect.height / 2;

    // We run this forty times to make forty dots
    for (let i = 0; i < 40; i++) {
        // We create a tiny invisible box
        const particle = document.createElement('div');
        // We tell the browser it is a particle
        particle.classList.add('particle');
        // We pick a random size for the dot
        const size = Math.random() * 8 + 2;
        // We set the width and height
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        // We paint it the character color
        particle.style.backgroundColor = color;
        // We start it exactly in the middle of the card
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;

        // We pick a random direction for it to fly
        const angle = Math.random() * Math.PI * 2;
        // We pick a random distance for it to fly
        const distance = Math.random() * 400 + 100;
        // We calculate how far it moves sideways
        const tx = Math.cos(angle) * distance;
        // We calculate how far it moves up or down
        const ty = Math.sin(angle) * distance;

        // We tell the animation how far to move it
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        // We put the dot on the screen
        container.appendChild(particle);
        // We erase the dot after one second so the computer does not lag
        setTimeout(() => particle.remove(), 1000);
    }
}

// This happens when they click enter archive after winning
function enterMooncel() {
    // We tell the page to load all the clothes from the database
    if (typeof loadProductsFromDatabase === "function") loadProductsFromDatabase();
    // We grab the game screen
    const intro = document.getElementById('reality-marble');
    // We grab the main store page
    const mainSite = document.getElementById('shopSection');
    
    // We make the card zoom way into the screen super fast
    gachaCardContainer.style.transform = 'scale(5) translateZ(100px)';
    // We make the card invisible
    gachaCardContainer.style.opacity = '0';
    // We make sure it moves smoothly
    gachaCardContainer.style.transition = 'all 0.8s cubic-bezier(0.25, 1, 0.25, 1)';
    // We fade out the background
    if(intro) intro.style.opacity = '0';

    // We wait for the zoom animation to finish
    setTimeout(() => {
        // We hide the game screen completely
        if(intro) intro.style.display = 'none';
        // We make the store page visible
        if(mainSite) {
            // We unhide it
            mainSite.classList.remove('hidden');
            // We force a redraw so it does not glitch
            void mainSite.offsetWidth;
            // We make it fully solid
            mainSite.style.opacity = '1';
        }
        // The user is now officially inside the store, so we start the music player.
        // We call it here (after the 800ms transition) so it feels intentional —
        // the music kicks in at the exact moment the shop appears, like a game OST.
        showMusicPlayer();
    }, 800);
}


// This function is for when you click a size button on the main store page
function selectSize(btn, productId) {
    // We find all the size buttons for this exact product and turn them off
    document.querySelectorAll(`.size-btn-${productId}`).forEach(b => {
        b.classList.remove('selected', 'border-[var(--theme-color)]', 'text-[var(--theme-color)]');
        b.classList.add('border-gray-600', 'text-gray-300');
    });
    // We turn on the specific button the user just clicked
    btn.classList.remove('border-gray-600', 'text-gray-300');
    btn.classList.add('selected', 'border-[var(--theme-color)]', 'text-[var(--theme-color)]');
}

// This function is for when you click a size button inside the big popup window
function selectModalSize(btn, productId) {
    // We find all size buttons in the popup and turn them off
    document.querySelectorAll(`.modal-size-btn-${productId}`).forEach(b => {
        b.classList.remove('selected', 'border-[var(--theme-color)]', 'text-[var(--theme-color)]');
        b.classList.add('border-gray-600', 'text-gray-300');
    });
    // We turn on the one they clicked
    btn.classList.remove('border-gray-600', 'text-gray-300');
    btn.classList.add('selected', 'border-[var(--theme-color)]', 'text-[var(--theme-color)]');
    
    // We find the matching size button on the main page hiding behind the popup
    const mainPageBtn = document.querySelector(`.size-btn-${productId}[data-size="${btn.getAttribute('data-size')}"]`);
    // We click it automatically so both buttons always match
    if(mainPageBtn) selectSize(mainPageBtn, productId);
}


// This pulls all your products from the database to build the store
async function loadProductsFromDatabase() {
    try {
        // We ask the server for the product list
        const response = await fetch("http://localhost:5000/products");
        // If the admin blocked them we kick them out
        if (response.status === 403) { forceLogout("You have been blocked by the admin."); return; }
        // We convert the answer to readable data
        const products = await response.json();
        // We save the products globally so we can use them later
        globalArchiveProducts = products;

        // We find the boxes where the products should go
        const postersContainer = document.getElementById("dynamic-posters");
        const tshirtsContainer = document.getElementById("dynamic-tshirts");
        const costumesContainer = document.getElementById("dynamic-costumes");
        const relicsContainer = document.getElementById("dynamic-relics");

        // We empty out the boxes just in case they had old stuff in them
        if (postersContainer) postersContainer.innerHTML = "";
        if (tshirtsContainer) tshirtsContainer.innerHTML = "";
        if (costumesContainer) costumesContainer.innerHTML = "";
        if (relicsContainer) relicsContainer.innerHTML = "";

        // We look at every single product one by one
        products.forEach(product => {
            // We create a tiny tag to show how many are left in stock
            let stockWarningHtml = `<div class="absolute top-2 left-2 bg-black/80 text-gray-300 text-xs font-bold px-2 py-1 rounded border border-gray-600 z-10">STOCK: ${product.stock_quantity}</div>`;
            // We create the add to cart button
            let buttonState = `<button onclick="addToCart(this, ${product.id}, '${product.name}', ${product.price})" class="glow-btn w-full py-3 rounded-lg text-base tracking-wider mt-auto"><i class="fas fa-plus mr-2"></i> Add to Cart</button>`;

            // If the stock is empty we change things
            if (product.stock_quantity === 0) {
                // We make the stock tag red and scary
                stockWarningHtml = `<div class="absolute top-2 left-2 bg-red-900 text-white text-xs font-bold px-2 py-1 rounded border border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.8)] z-10">DEPLETED</div>`;
                // We grey out the button so they cannot buy it
                buttonState = `<button disabled class="w-full py-3 rounded-lg text-base tracking-wider mt-auto bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700">Out of Stock</button>`;
            }

            // We prepare an empty spot for size buttons
            let sizeDisplayHtml = '';
            // If the item is clothes we need size buttons
            if (product.category === 'apparel' || product.category === 'costume') {
                // We grab the sizes from the database or use basic ones if missing
                const sizes = product.available_sizes && product.available_sizes !== 'N/A'
                    ? product.available_sizes.split(',')
                    : ['S', 'M', 'L', 'XL'];
                    
                // We create a clickable button for each size
                const badges = sizes.map((s, index) => {
                    const size = s.trim();
                    // We automatically select the very first size in the list so one is always picked
                    const activeClass = index === 0 ? 'border-[var(--theme-color)] text-[var(--theme-color)] selected' : 'border-gray-600 text-gray-300';
                    // We build the actual button html
                    return `<button onclick="event.stopPropagation(); selectSize(this, ${product.id})" data-size="${size}" class="size-btn-${product.id} bg-black/80 text-[10px] font-bold px-3 py-1.5 rounded border shadow-md ${activeClass} transition-colors hover:border-[var(--theme-color)] hover:text-[var(--theme-color)]">${size}</button>`;
                }).join('');
                // We group all the size buttons together
                sizeDisplayHtml = `<div class="flex flex-wrap gap-2 mb-3 mt-1" onclick="event.stopPropagation()">${badges}</div>`;
            }

            // We figure out the picture link or use a grey box if the picture is missing
            const imageUrl = product.image_url ? `http://localhost:5000${product.image_url}` : 'https://placehold.co/600x800/111/444?text=Missing+Image';

            // We build the giant block of html for the entire product card
            const productHtml = `
                <div class="glass-panel p-5 group flex flex-col relative h-full">
                    ${stockWarningHtml}
                    <div class="relative overflow-hidden rounded-lg mb-4 cursor-pointer" onclick="openModal(${product.id})">
                        <img src="${imageUrl}" alt="${product.name}" class="w-full h-72 object-cover transform group-hover:scale-110 transition-transform duration-700">
                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <span class="text-white border border-[var(--theme-color)] bg-black/80 px-4 py-2 rounded uppercase text-xs font-bold tracking-widest backdrop-blur-sm shadow-[0_0_15px_var(--theme-glow)]">View Front / Back</span>
                        </div>
                    </div>
                    <h3 class="cinematic-text text-xl mb-1 text-white">${product.name}</h3>
                    
                    ${sizeDisplayHtml}
                    
                    <div class="flex justify-between items-center mb-4 mt-auto pt-2">
                        <span class="text-xl font-bold" style="color: var(--theme-color);">₹<span class="discounted-price" data-base="${product.price}">${product.price}</span></span>
                    </div>
                    ${buttonState}
                </div>
            `;

            // We sort the product into the correct category box on the page
            if (product.category === 'poster' && postersContainer) postersContainer.innerHTML += productHtml;
            else if (product.category === 'apparel' && tshirtsContainer) tshirtsContainer.innerHTML += productHtml;
            else if (product.category === 'costume' && costumesContainer) costumesContainer.innerHTML += productHtml;
            else if (product.category === 'relic' && relicsContainer) relicsContainer.innerHTML += productHtml;
        });

        // We run the math function to update all prices with their discount
        updateProductPrices();
    // If the database fails to load we log the error
    } catch (error) { console.error("Failed to load products:", error); }
}

// We find all elements on the page that are supposed to slide in when you scroll
const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
// We create a tool that watches the screen to see what is visible
const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        // If the element is on screen we turn on its animation class
        if (entry.isIntersecting) entry.target.classList.add('active');
        // If they scroll past it we turn it off so it can happen again later
        else entry.target.classList.remove('active');
    });
}, { threshold: 0.1 });
// We attach our watching tool to all the sliding elements
revealElements.forEach(el => scrollObserver.observe(el));

// We listen to the user scrolling to move the progress bar at the very top
window.addEventListener('scroll', () => {
    // We check how far down they have scrolled
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    // We check how long the entire page is
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    // We calculate the percentage of how far down they are
    const scrolled = (winScroll / height) * 100;
    // We find the tiny line at the top
    const scrollProgress = document.getElementById('scroll-progress');
    // We change the width of the line to match the percentage
    if(scrollProgress) scrollProgress.style.width = scrolled + "%";
});

// This handles the math for applying the anime character discount
function updateProductPrices() {
    // We find every single price tag on the page
    const priceElements = document.querySelectorAll('.discounted-price');
    // We look at each one
    priceElements.forEach(el => {
        // We grab the original price hidden in the html data
        const basePrice = parseFloat(el.getAttribute('data-base'));
        // We multiply it by the discount to get the new lower price
        const newPrice = basePrice * (1 - (globalDiscount / 100));
        // We write the new lower price onto the screen
        el.innerText = newPrice.toFixed(2);
    });
}

// This opens the big detail window when you click a product picture
function openModal(productId) {
    // We search our downloaded list for the exact product they clicked
    const product = globalArchiveProducts.find(p => p.id === productId);
    // If we cannot find it we just stop
    if (!product) return;

    // We fill in all the text details in the popup window
    document.getElementById('modal-category').innerText = product.category;
    document.getElementById('modal-title').innerText = product.name;
    document.getElementById('modal-price').innerText = (product.price * (1 - (globalDiscount / 100))).toFixed(2);
    document.getElementById('modal-desc').innerText = product.description;

    // We prepare the front picture
    const frontImg = product.image_url ? `http://localhost:5000${product.image_url}` : '';
    // We prepare the back picture if they have one
    const backImg = product.image_url_back ? `http://localhost:5000${product.image_url_back}` : null;

    // We load the front picture into the popup
    document.getElementById('modal-img-front').src = frontImg;
    // We load the back picture into the popup behind the front one
    document.getElementById('modal-img-back').src = backImg || frontImg;
    // We make sure the back picture is invisible at first
    document.getElementById('modal-img-back').style.opacity = '0';
    // We remember that they are looking at the front
    isShowingBack = false;

    // We find the button to flip the shirt around
    const flipBtn = document.getElementById('modal-flip-btn');
    // We find the measurement chart
    const sizeChart = document.getElementById('modal-size-chart');
    // We find the section with the big size buttons
    const modalSizeSelector = document.getElementById('modal-size-selector');
    // We find the container that holds the big size buttons
    const modalSizesContainer = document.getElementById('modal-sizes-container');

    // If it is clothing we do some special setup
    if (product.category === 'costume' || product.category === 'apparel') {
        // We show the measurement chart
        sizeChart.classList.remove('hidden');
        // We show the big size buttons
        modalSizeSelector.classList.remove('hidden');
        
        // We grab the sizes for this item
        const sizes = product.available_sizes && product.available_sizes !== 'N/A' ? product.available_sizes.split(',') : ['S', 'M', 'L', 'XL'];
        
        // We peek at the main page to see what size they had clicked on before opening the popup
        const activeMainSize = document.querySelector(`.size-btn-${product.id}.selected`);
        // We use that size or just pick the first one if they had not clicked anything
        const currentSelectedSize = activeMainSize ? activeMainSize.getAttribute('data-size') : sizes[0].trim();

        // We build the big size buttons for inside the popup
        modalSizesContainer.innerHTML = sizes.map(s => {
            const size = s.trim();
            // We highlight the one that matches what they picked on the main page
            const activeClass = size === currentSelectedSize ? 'border-[var(--theme-color)] text-[var(--theme-color)] selected' : 'border-gray-600 text-gray-300';
            // We return the html code for the button
            return `<button onclick="selectModalSize(this, ${product.id})" data-size="${size}" class="modal-size-btn-${product.id} bg-black/80 text-sm font-bold px-4 py-2 rounded border shadow-md ${activeClass} transition-colors hover:border-[var(--theme-color)] hover:text-[var(--theme-color)]">${size}</button>`;
        }).join('');

        // If it has a back picture we show the flip button
        if (product.image_url_back) flipBtn.classList.remove('hidden');
        // Otherwise we hide it
        else flipBtn.classList.add('hidden');
    // If it is just a poster or keychain
    } else {
        // We hide the measurements
        sizeChart.classList.add('hidden');
        // We hide the size buttons
        modalSizeSelector.classList.add('hidden');
        // We hide the flip button
        flipBtn.classList.add('hidden');
    }

    // We find where the add to cart button goes in the popup
    const btnContainer = document.getElementById('modal-btn-container');
    // If they have it in stock
    if (product.stock_quantity > 0) {
        // We create a big clickable buy button
        btnContainer.innerHTML = `<button onclick="addToCart(this, ${product.id}, '${product.name}', ${product.price}); closeModal();" class="glow-btn w-full py-4 text-lg rounded-xl uppercase tracking-widest font-bold bg-[#ff4d6d]"><i class="fas fa-plus mr-2"></i> Add to Cart</button>`;
    // If it is sold out
    } else {
        // We create a dead grey button
        btnContainer.innerHTML = `<button disabled class="w-full py-4 text-lg rounded-xl uppercase tracking-widest font-bold bg-gray-800 text-gray-500 cursor-not-allowed">Out of Stock</button>`;
    }

    // We grab the hidden popup window
    const modal = document.getElementById('product-modal');
    // We grab the content box inside it
    const content = document.getElementById('modal-content');
    // We unhide the window
    modal.classList.remove('hidden');
    // We do a tiny delay then fade it in smoothly
    setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('scale-95'); }, 10);
}

// This hides the big detail window
function closeModal() {
    // We grab the popup window
    const modal = document.getElementById('product-modal');
    // We grab the content inside
    const content = document.getElementById('modal-content');
    // We fade them out
    modal.classList.add('opacity-0'); content.classList.add('scale-95');
    // We wait for the fade to finish then completely hide them
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// This lets the user see the back of the shirt in the popup
function toggleBackView() {
    // We find the back image
    const backImg = document.getElementById('modal-img-back');
    // We flip our memory tracker to the opposite of what it was
    isShowingBack = !isShowingBack;
    // If we are showing the back we make it solid otherwise we make it invisible
    backImg.style.opacity = isShowingBack ? '1' : '0';
}

// This slides the shopping cart menu in and out from the right side
function toggleCart() {
    // We find the sidebar panel
    const panel = document.getElementById('cart-panel');
    // We tell it to open if closed or close if opened
    panel.classList.toggle('open');
}


// This puts the item in your shopping bag
function addToCart(btnElement, id, name, basePrice) {
    try {
        // We make sure the button they clicked actually exists
        if (!btnElement || typeof btnElement.innerHTML === 'undefined') return;

        // We prepare an empty spot for the size they picked
        let size = null;
        
        // We check if they clicked buy from inside the big popup window
        const isModal = btnElement.closest('#product-modal');
        if (isModal) {
            // We look for the size they had highlighted in the popup
            const activeModalSize = document.querySelector(`.modal-size-btn-${id}.selected`);
            // If they highlighted one we save it
            if (activeModalSize) size = activeModalSize.getAttribute('data-size');
        // If they clicked buy from the main store page
        } else {
            // We look for the size they had highlighted on the small card
            const activeSize = document.querySelector(`.size-btn-${id}.selected`);
            // If they highlighted one we save it
            if (activeSize) size = activeSize.getAttribute('data-size');
        }

        // We create a special tag so the cart knows a medium shirt is different from a large shirt
        const cartItemId = size ? `${id}-${size}` : `${id}`;

        // We check if this exact shirt in this exact size is already in the bag
        const existingItem = cart.find(item => item.cartItemId === cartItemId);
        if (existingItem) {
            // If it is we just add one to the quantity
            existingItem.quantity++;
        } else {
            // If it is new we put all its details into the bag
            cart.push({ id, cartItemId, name, basePrice, quantity: 1, size });
        }

        // We remember what the buy button used to say
        const originalText = btnElement.innerHTML;
        // We change it to say Added with a checkmark
        btnElement.innerHTML = `<i class="fas fa-check mr-2"></i> Added`;
        // We wait a second and change it back to normal
        setTimeout(() => {
            if (document.body.contains(btnElement)) btnElement.innerHTML = originalText;
        }, 1500);

        // We refresh the cart display so they can see their new item
        updateCartUI();

        // We grab the cart sidebar
        const cartPanel = document.getElementById('cart-panel');
        // If it is closed we slide it open for them to see
        if (cartPanel && !cartPanel.classList.contains('open')) toggleCart();
    // We catch errors quietly so the page does not break
    } catch (e) { console.warn("Handled cart event safely.", e); }
}

// This changes how many of an item you have in the cart
function changeQuantity(cartItemId, delta) {
    try {
        // We search the bag for the exact item they clicked plus or minus on
        const item = cart.find(i => i.cartItemId === cartItemId);
        if (item) {
            // We add or subtract the amount
            item.quantity += delta;
            // If it hits zero we throw it out of the bag completely
            if (item.quantity <= 0) cart = cart.filter(i => i.cartItemId !== cartItemId);
        }
        // We refresh the cart display to show the new math
        updateCartUI();
    // We catch errors quietly
    } catch (e) { }
}

// This draws all the items and math inside the shopping cart sidebar
function updateCartUI() {
    // We find the list area inside the cart
    const cartContainer = document.getElementById('cart-items');
    // We find the little red dot that counts total items
    const cartCountLabel = document.getElementById('cart-count');

    // If we cannot find them we stop
    if(!cartContainer || !cartCountLabel) return;

    // We wipe the list clean so we can redraw it perfectly
    cartContainer.innerHTML = '';
    // We start counting total items at zero
    let totalItems = 0;
    // We start counting total cost at zero
    let subtotal = 0;

    // If the bag is empty we show a sad message
    if (cart.length === 0) {
        cartContainer.innerHTML = '<p class="text-gray-400 text-center text-lg mt-10">Your inventory is empty.</p>';
    // If they have stuff we draw it
    } else {
        // We look at every item in the bag
        cart.forEach(item => {
            // We add its quantity to the total item counter
            totalItems += item.quantity;
            // We add its cost to the total bill
            subtotal += item.basePrice * item.quantity;
            // We figure out what it costs after their anime discount
            const discountedPrice = item.basePrice * (1 - (globalDiscount / 100));
            
            // If it has a size we build a little badge to show it
            const sizeTag = item.size ? `<span class="inline-block text-[10px] uppercase tracking-wider text-[var(--theme-color)] border border-[var(--theme-color)] px-2 py-0.5 rounded ml-2 shadow-[0_0_5px_var(--theme-glow)]">Size: ${item.size}</span>` : '';

            // We build the html for this item row and add it to the list
            cartContainer.innerHTML += `
                <div class="flex justify-between items-center bg-black/60 p-4 rounded-xl border border-gray-700 shadow-lg mb-2">
                    <div class="flex-1 pr-4">
                        <h4 class="text-base font-bold text-white mb-1 flex items-center flex-wrap">${item.name} ${sizeTag}</h4>
                        <div class="text-sm text-gray-300">₹${discountedPrice.toFixed(2)} ea <span class="line-through text-gray-500 ml-2">₹${item.basePrice.toFixed(2)}</span></div>
                    </div>
                    <div class="flex items-center space-x-4 bg-black/80 px-3 py-1 rounded-lg border border-gray-600">
                        <button onclick="changeQuantity('${item.cartItemId}', -1)" class="text-gray-400 hover:text-[var(--theme-color)] text-lg font-bold">-</button>
                        <span class="text-white text-base font-bold w-4 text-center">${item.quantity}</span>
                        <button onclick="changeQuantity('${item.cartItemId}', 1)" class="text-gray-400 hover:text-[var(--theme-color)] text-lg font-bold">+</button>
                    </div>
                </div>
            `;
        });
    }

    // We update the little red dot on the cart icon
    cartCountLabel.innerText = totalItems;
    // We calculate exactly how much money the discount saved them
    const discountAmount = subtotal * (globalDiscount / 100);
    // We calculate their final bill
    const finalTotal = subtotal - discountAmount;

    // We write the original cost on the screen
    document.getElementById('cart-subtotal').innerText = `₹${subtotal.toFixed(2)}`;
    // We write their discount percentage on the screen
    document.getElementById('cart-discount-percent').innerText = globalDiscount;
    // We write the money they saved on the screen
    document.getElementById('cart-discount-amount').innerText = `-₹${discountAmount.toFixed(2)}`;
    // We write the final total they have to pay on the screen
    document.getElementById('cart-total').innerText = `₹${finalTotal.toFixed(2)}`;
}

// This handles talking to the payment system when they want to buy
async function checkout() {
    // If the bag is empty we do nothing
    if (cart.length === 0) return;

    // We grab their digital key
    const token = localStorage.getItem("token");
    // If they logged out somehow we send them to login
    if (!token) { window.location.href = "login.html"; return; }

    try {
        // We pack up the items into a clean list for the server
        const itemsToCheckout = cart.map(item => ({ id: item.id, quantity: item.quantity, size: item.size }));
        // We send the list to the server to get an official order number
        const response = await fetch("http://localhost:5000/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ items: itemsToCheckout })
        });

        // If the admin blocked them during checkout we kick them out
        if (response.status === 403) { forceLogout("You have been blocked by the admin."); return; }
        // We read the server response
        const data = await response.json();

        // If the server successfully created an order
        if (response.ok) {
            // We set up the options for the Razorpay payment window
            const options = {
                key: "rzp_test_Ss6gCEwWTsaZ4I", 
                amount: data.order.amount,
                currency: data.order.currency,
                name: "Mooncel Archive",
                description: "Purchase Relics",
                order_id: data.order.id,
                theme: { color: "#ff4d6d" },
                // This function runs automatically if the payment is successful
                handler: async function (response) {
                    try {
                        // We send the payment receipt back to the server to double check it is real
                        const verifyRes = await fetch("http://localhost:5000/verify-payment", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                itemsPurchased: itemsToCheckout 
                            })
                        });

                        // We check for admin block again just to be safe
                        if (verifyRes.status === 403) { forceLogout("You have been blocked by the admin."); return; }
                        // We read the verification result
                        const verifyData = await verifyRes.json();

                        // If the server confirms the money is real
                        if (verifyRes.ok) {
                            // We create a giant success popup covering the whole screen
                            const overlay = document.createElement('div');
                            overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4';
                            // We build the html for the success receipt
                            overlay.innerHTML = `
                                <div class="glass-panel p-10 text-center max-w-md w-full border-2 border-[var(--theme-color)] shadow-[0_0_40px_var(--theme-glow)]">
                                    <i class="fas fa-magic text-6xl mb-6 text-[var(--theme-color)] glow-text"></i>
                                    <h3 class="cinematic-text text-3xl mb-3 text-white">Summon Complete</h3>
                                    <p class="text-gray-300 mb-6 text-sm break-all">Payment ID: ${response.razorpay_payment_id}</p>
                                    <div class="bg-black/50 p-4 rounded-lg mb-8 text-left border border-gray-700">
                                        <div class="flex justify-between text-sm text-gray-400 mb-2"><span>Subtotal:</span> <span>₹${data.subtotal}</span></div>
                                        <div class="flex justify-between text-sm text-[var(--theme-color)] mb-2"><span>Servant Discount:</span> <span>${data.discountApplied}</span></div>
                                        <div class="flex justify-between text-xl font-bold text-white mt-2 pt-2 border-t border-gray-700"><span>Total Paid:</span> <span>₹${data.finalTotal}</span></div>
                                    </div>
                                    <button id="close-checkout-btn" class="glow-btn w-full py-4 text-lg rounded-xl uppercase tracking-widest font-bold">Return to Archive</button>
                                </div>
                            `;
                            // We put the popup on the screen
                            document.body.appendChild(overlay);
                            
                            // We listen for them to click the close button on the receipt
                            document.getElementById('close-checkout-btn').addEventListener('click', function (e) {
                                e.preventDefault();
                                // We delete the popup
                                overlay.remove();
                                // We empty their shopping bag
                                clearCart();
                                // We close the cart sidebar
                                const cartPanel = document.getElementById('cart-panel');
                                if (cartPanel && cartPanel.classList.contains('open')) toggleCart();
                                
                                // We reset their discount back to zero because they used it
                                globalDiscount = 0; 
                                
                                // We wipe their character from memory
                                localStorage.removeItem('mooncelTheme');
                                localStorage.removeItem('mooncelServant');
                                // We reset the website color back to standard red
                                document.documentElement.style.setProperty('--theme-color', '#ff4d6d');
                                document.documentElement.style.setProperty('--theme-glow', 'rgba(255, 77, 109, 0.7)');
                                // We change the top bar to say no active blessing
                                const blessingText = document.getElementById('active-blessing');
                                if (blessingText) blessingText.innerText = "NO ACTIVE BLESSING";
                                
                                // We reload the store to get the newest stock numbers
                                loadProductsFromDatabase(); 
                            });
                        // If they hacked the payment we yell at them
                        } else alert("Payment verification failed: " + verifyData.message);
                    // If the server crashes during verify we tell them
                    } catch (err) { alert("Error verifying payment."); }
                }
            };
            // We launch the Razorpay payment window
            const rzp = new Razorpay(options);
            // If they cancel or their card declines we alert them
            rzp.on('payment.failed', function (response){ alert("Payment failed or cancelled: " + response.error.description); });
            // This actually opens the window
            rzp.open();
        // If the server refused to make an order we alert them
        } else alert("Checkout failed: " + data.message);
    // If the internet crashes we alert them
    } catch (error) { alert("An error occurred during checkout. Please try again."); }
}

// This empties the shopping bag completely
function clearCart() {
    // We set the bag back to an empty list
    cart = [];
    // We redraw the sidebar so it shows empty
    updateCartUI();
}

// This smoothly scrolls the window back to the very top
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

// This builds our cool red custom warning popup instead of the ugly default browser one
function showCustomAlert(message) {
    // We find the hidden popup structure
    const modal = document.getElementById('custom-alert-modal');
    // If we cannot find it we stop
    if (!modal) return;
    // We find the box inside
    const content = document.getElementById('custom-alert-content');
    // We put their message text into the box
    document.getElementById('custom-alert-message').innerText = message;
    
    // We remove the hidden class so it exists on screen
    modal.classList.remove('hidden');
    // We fade it in smoothly
    setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('scale-95'); }, 10);
}

// This hides the custom warning popup
function closeCustomAlert() {
    // We find the popup
    const modal = document.getElementById('custom-alert-modal');
    if (!modal) return;
    // We find the box inside
    const content = document.getElementById('custom-alert-content');
    
    // We start fading them out
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    
    // We wait for the fade to finish then completely hide it
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// This instantly kicks out anyone the admin has banned
function forceLogout(message = "You have been blocked by the admin.") {
    // We show them the reason they are kicked
    alert(message);
    // We destroy their digital key
    localStorage.removeItem("token");
    // We send them to the login page
    window.location.href = "login.html";
}


// =================================================================
//  MUSIC PLAYER
//  Handles autoplay on login, mute/unmute toggle, and the little
//  floating widget in the bottom-left corner of the page.
//
//  HOW TO ADD YOUR OWN MUSIC:
//  1. Drop your .mp3 (or .ogg) file into /assets/music/
//  2. Update the <source src="..."> paths in the #bg-music element
//     inside index.html
//  3. Optionally change the track label in #music-label as well
//  That's it — the player takes care of everything else automatically.
// =================================================================

// We grab the actual audio element that plays the sound
const bgMusic = document.getElementById('bg-music');

// We grab the floating widget the user can see and click
const musicWidget = document.getElementById('music-player-widget');

// We track whether the music is currently muted (starts as false because
// we want it playing, but the audio element itself starts muted so the
// browser allows autoplay — we flip it to unmuted in showMusicPlayer)
let musicIsMuted = false;

// This function is called after the user has successfully logged in and
// the store section becomes visible. We fade the widget in and start the music.
function showMusicPlayer() {
    // If the widget element does not exist for some reason, just bail out
    if (!musicWidget || !bgMusic) return;

    // Reveal the widget by making it opaque and clickable
    musicWidget.style.opacity = '1';
    musicWidget.style.pointerEvents = 'auto';

    // We unmute the audio element now that the user has already "interacted"
    // with the page (they logged in and pressed buttons), which satisfies the
    // browser autoplay policy — this is the trick that makes it actually work
    bgMusic.muted = false;

    // Now we try to play. We use .catch() in case the browser still blocks it
    // (e.g. the page was refreshed instantly with no prior interaction)
    bgMusic.play().catch(err => {
        // If autoplay was blocked, we show the widget in a muted/paused state
        // so the user can just click it once to start — no broken experience
        console.log('Autoplay was blocked by the browser, waiting for user click:', err);
        setMusicMutedState(true);
    });
}

// This is the function wired to onclick on the widget div in the HTML.
// It just flips the muted state each time the user clicks.
function toggleMusicPlayer() {
    // Flip to the opposite state of whatever we are in right now
    setMusicMutedState(!musicIsMuted);
}

// This actually applies the muted or playing state to everything:
// the audio element, the CSS class, the icon, and the sublabel text.
// Keeping it in one function means the UI is always perfectly in sync.
function setMusicMutedState(shouldMute) {
    // Remember the new state globally
    musicIsMuted = shouldMute;

    if (shouldMute) {
        // Pause the audio so it truly stops (muting alone keeps it running
        // in the background which wastes resources)
        bgMusic.pause();

        // Add the CSS class that freezes the bar animations
        musicWidget.classList.add('muted');

        // Swap the animated bars for the muted speaker icon
        document.getElementById('music-bars').style.display = 'none';
        document.getElementById('music-muted-icon').style.display = 'block';

        // Update the sublabel so the user knows what clicking will do
        document.getElementById('music-sublabel').textContent = 'Click to play';
    } else {
        // Resume playback from wherever it was paused
        bgMusic.muted = false;
        bgMusic.play().catch(err => console.warn('Play was still blocked:', err));

        // Remove the frozen animation class so the bars bounce again
        musicWidget.classList.remove('muted');

        // Swap the muted icon back to the animated bars
        document.getElementById('music-bars').style.display = 'flex';
        document.getElementById('music-muted-icon').style.display = 'none';

        // Update the sublabel back to "Playing"
        document.getElementById('music-sublabel').textContent = 'Playing';
    }
}

// We also watch for the theme color changing (when the user gets their servant)
// so the equalizer bars update their color to match — same as every other
// glowing element on the page. We do this with a MutationObserver on the
// root element's style attribute.
const themeColorObserver = new MutationObserver(() => {
    // Pull the current theme color from the CSS variable
    const currentTheme = getComputedStyle(document.documentElement)
        .getPropertyValue('--theme-color').trim();

    // If we got a valid color, apply it to all bar elements
    if (currentTheme) {
        document.querySelectorAll('.music-bar').forEach(bar => {
            bar.style.background = currentTheme;
        });
        // Also update the muted icon color to match
        const mutedIcon = document.getElementById('music-muted-icon');
        if (mutedIcon) mutedIcon.style.color = currentTheme;
    }
});

// We only start watching for theme changes after the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    themeColorObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['style'] // We only care about style changes, not class changes
    });
});