let PAGE_CONFIG = {};
// Check if user previously completed the handshake in this browser session
let isAuthorized = sessionStorage.getItem('rj_mcleod_auth') === 'true';
let currentPage = 'Overview';

/**
 * STREAMING_CHUNK: Fetching Intelligence Vault...
 * Note: Relative path 'config.json' is used for portability.
 */
async function init() {
    try {
        const response = await fetch('config.json');
        
        if (!response.ok) {
            throw new Error(`Intelligence Link Severed: ${response.status}`);
        }

        PAGE_CONFIG = await response.json();
        
        renderNavigation();
        
        // Ensure the Handshake gatekeeper is enforced if not authorized
        if (!isAuthorized) {
            renderAuthHandshake();
        } else {
            switchPage(currentPage);
        }
    } catch (error) {
        console.error("CRITICAL ERROR: Intelligence Handshake Failed", error);
        displayDeploymentError(error.message);
    }
}

function renderAuthHandshake() {
    const container = document.getElementById('grid-container');
    const masterUrl = "https://app.powerbi.com/reportEmbed?reportId=07520691-2dfd-4ecd-bcbb-2e7d735aba9b&autoAuth=true";
    
    // Clear navigation to focus on auth
    const navContainer = document.getElementById('main-nav');
    if (navContainer) navContainer.innerHTML = '<div class="px-6 py-4 text-xs text-zinc-500 italic uppercase">System Locked</div>';

    container.innerHTML = `
        <div class="col-span-full row-span-full absolute inset-0 flex items-center justify-center overflow-hidden animate-in fade-in duration-700">
            
            <div class="absolute inset-0 bg-[url('assets/background.png')] bg-cover bg-center bg-no-repeat opacity-90"></div>
            
            <div class="absolute inset-0 bg-black/20 shadow-[inset_0_0_120px_rgba(0,0,0,0.7)] pointer-events-none"></div>

            <div id="custom-login-view" class="relative z-10 flex flex-col p-10 bg-[#1a1a1a]/95 border border-[#2d2d2d] rounded shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-8 duration-500 backdrop-blur-sm">
                <div class="text-center mb-8">
                    <img src="assets/rjmcleod-ocu-company.avif" alt="RJ McLeod" class="h-12 w-auto object-contain mb-2 mx-auto">
                    <p class="text-zinc-500 text-[9px] uppercase tracking-[0.3em] font-bold">QSET Command Center</p>
                </div>

                <div class="mb-5">
                    <label class="block text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-2">Network ID / Email</label>
                    <input type="text" class="w-full bg-[#0a0a0a] border border-[#2d2d2d] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#ffcc00] transition-colors rounded-sm" placeholder="Enter credentials...">
                </div>

                <div class="mb-8">
                    <label class="block text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-2">Security Key</label>
                    <input type="password" class="w-full bg-[#0a0a0a] border border-[#2d2d2d] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#ffcc00] transition-colors rounded-sm" placeholder="••••••••••••">
                </div>

                <button onclick="transitionToMicrosoftAuth()" class="w-full bg-[#ffcc00] text-black px-6 py-4 font-black uppercase text-xs tracking-[0.2em] hover:bg-white hover:scale-[1.02] transition-all shadow-[0_0_15px_rgba(255,204,0,0.15)]">
                    Authenticate
                </button>
            </div>

            <div id="msal-handshake-view" class="hidden relative z-10 flex flex-col items-center justify-center bg-[#1a1a1a]/95 border border-[#2d2d2d] rounded-lg p-10 text-center shadow-2xl w-full max-w-3xl backdrop-blur-sm">
                <div class="w-12 h-12 border-b-2 border-[#ffcc00] rounded-full animate-spin mb-6"></div>
                <h3 class="text-[#ffcc00] text-xl font-black mb-2 uppercase italic tracking-tighter">Microsoft Secure Link</h3>
                <p class="text-zinc-400 text-[10px] mb-6 uppercase tracking-[0.2em]">Verifying credentials with Power BI Cloud Services...</p>
                
                <div class="w-full h-72 bg-black border border-zinc-800 rounded overflow-hidden mb-6 relative">
                     <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <span class="text-zinc-500 text-[8px] uppercase tracking-widest">Awaiting Microsoft Verification</span>
                     </div>
                     <iframe src="${masterUrl}" class="w-full h-full border-none relative z-10"></iframe>
                </div>
                
                <div class="flex flex-col items-center gap-3">
                    <p class="text-zinc-500 text-[9px] uppercase max-w-xs">Once verification completes in the window above, deploy the interface.</p>
                    <button onclick="finalizeHandshake()" class="bg-white text-black px-10 py-3 font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#ffcc00] transition-colors">
                        Deploy HUD
                    </button>
                </div>
            </div>

        </div>
    `;
}

// Ensure you keep your transition function here as well:
function transitionToMicrosoftAuth() {
    const loginView = document.getElementById('custom-login-view');
    const msalView = document.getElementById('msal-handshake-view');
    
    // Add a quick fade out to the login box
    loginView.classList.add('opacity-0', 'scale-95');
    
    setTimeout(() => {
        loginView.classList.add('hidden');
        msalView.classList.remove('hidden');
        msalView.classList.add('animate-in', 'zoom-in-95', 'fade-in', 'duration-500');
    }, 300); // Waits for the fade out before swapping
}
function finalizeHandshake() {
    isAuthorized = true;
    sessionStorage.setItem('rj_mcleod_auth', 'true');
    renderNavigation(); // Restore the actual nav
    switchPage(currentPage);
}

// NEW: Dynamically checks the config for the current page and injects/removes the banner
function updateBanner(config) {
    const gridContainer = document.getElementById('grid-container');
    let banner = document.getElementById('dynamic-alert-banner');

    if (!config || !config.banner) {
        if (banner) banner.remove();
        return;
    }

    const bannerData = config.banner;
    const text = bannerData.text || 'Alert';
    const btnText = bannerData.buttonText || 'View';
    const targetAction = bannerData.action || ''; 
    const bgColor = bannerData.color || '#ef20d0'; 

    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'dynamic-alert-banner';
        gridContainer.parentNode.insertBefore(banner, gridContainer);
    }

    banner.className = 'w-full px-6 py-1.5 flex items-center justify-between shrink-0 z-40 border-b shadow-[0_2px_10px_rgba(0,0,0,0.3)] animate-in slide-in-from-top-4 duration-300';
    banner.style.backgroundColor = bgColor;
    banner.style.borderColor = '#ffffff30';
    banner.style.color = 'white';
    
    // NEW LOGIC: If the action starts with 'http', open in a new tab. Otherwise, switch internal page.
    const clickBehavior = targetAction.startsWith('http') 
        ? `window.open('${targetAction}', '_blank')` 
        : `switchPage('${targetAction}')`;

    banner.innerHTML = `
        <div class="flex items-center gap-2.5">
            <svg class="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <span class="font-black uppercase tracking-[0.15em] text-[10px] text-shadow-sm leading-none">${text}</span>
        </div>
        <button onclick="${clickBehavior}" 
                class="bg-white px-4 py-1 rounded-sm font-black uppercase text-[9px] tracking-widest hover:bg-black transition-colors shadow-sm cursor-pointer leading-none"
                style="color: ${bgColor};"
                onmouseover="this.style.color='white'"
                onmouseout="this.style.color='${bgColor}'">
            ${btnText}
        </button>
    `;
}

function getPageConfig(pageName) {
    if (PAGE_CONFIG[pageName] && PAGE_CONFIG[pageName].type !== 'parent') {
        return PAGE_CONFIG[pageName];
    }
    
    // Search within parents
    for (const key in PAGE_CONFIG) {
        if (PAGE_CONFIG[key].type === 'parent' && PAGE_CONFIG[key].children[pageName]) {
            return PAGE_CONFIG[key].children[pageName];
        }
    }
    return null;
}

function switchPage(pageName) {
    if (!isAuthorized) return renderAuthHandshake();
    
    currentPage = pageName;
    document.querySelectorAll('.nav-item, .nav-sub-item').forEach(el => el.classList.remove('active'));
    
    // Using a more robust regex replacement to handle symbols like & and /
    const navId = `nav-${pageName.replace(/[^a-zA-Z0-9]/g, '')}`;
    if (document.getElementById(navId)) document.getElementById(navId).classList.add('active');

    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.innerText = `${pageName.toUpperCase()}`;

    // Branching logic based on page type using the nested lookup
    const config = getPageConfig(pageName);
    if (!config) {
        console.warn(`Configuration not found for: ${pageName}`);
        return;
    }

    // Trigger the dynamic banner system
    updateBanner(config);
    
    if (config.type === 'library') {
        renderReportsLibrary(config.library);
    } else {
        renderDynamicGrid(pageName, config);
    }
}

function renderReportsLibrary(reports) {
    const container = document.getElementById('grid-container');
    // Switch to a scrollable layout for the library
    container.className = "flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto bg-black scrollbar-thin";
    
    container.innerHTML = reports.map(rpt => `
        <div class="group relative bg-zinc-900/30 border border-zinc-800 p-6 rounded hover:border-[#ffcc00] transition-all cursor-pointer flex flex-col h-64" 
             onclick="launchFullReport('${rpt.url}', '${rpt.title}')">
            <div class="flex justify-between items-start mb-4">
                <span class="text-[10px] text-[#ffcc00] font-mono font-bold">${rpt.id}</span>
                <span class="text-[8px] px-2 py-0.5 bg-zinc-800 text-zinc-400 uppercase font-black tracking-widest rounded">${rpt.category}</span>
            </div>
            <h3 class="text-white font-black uppercase italic tracking-tighter text-xl group-hover:text-[#ffcc00] transition-colors leading-tight mb-2">${rpt.title}</h3>
            <p class="text-[11px] text-zinc-500 leading-relaxed flex-1">${rpt.desc || 'System report access terminal.'}</p>
            <div class="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4">
                <span class="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Secure Link</span>
                <span class="text-[10px] font-black uppercase text-[#ffcc00] opacity-0 group-hover:opacity-100 transition-all">Initialize →</span>
            </div>
        </div>
    `).join('');
}

function launchFullReport(url, title) {
    const container = document.getElementById('grid-container');
    
    /**
     * Processing URL for Deployment...
     * We determine if this is a Power BI report, an Excel file, or a local asset.
     */
    let finalUrl = url;
    const isPowerBI = url.includes('powerbi.com');
    const isExcel = url.includes('sharepoint.com') || url.includes('onedrive.live.com');
    const isLocal = url.endsWith('.html') || !url.startsWith('http');

    if (isPowerBI) {
        // Append Power BI specific navigation and filter params
        finalUrl += "&navContentPaneEnabled=true&filterPaneEnabled=false";
    } else if (isExcel) {
        // Clean Excel URLs of hardcoded dimensions to allow full-screen expansion
        finalUrl = url.replace(/&wdInW=\d+/g, '').replace(/&wdInH=\d+/g, '');
        // Force interactivity if not present
        if (!finalUrl.includes('wdAllowInteractivity')) finalUrl += "&wdAllowInteractivity=True";
    }
    // Note: Local assets (like Site Map) are passed through without modification to avoid breaking links

    container.className = "flex-1 flex flex-col bg-black overflow-hidden p-0 animate-in fade-in zoom-in-95 duration-500";
    container.innerHTML = `
        <div class="h-10 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
            <div class="flex items-center gap-4">
                <button onclick="switchPage(currentPage)" class="text-[10px] text-zinc-400 hover:text-[#ffcc00] uppercase font-black tracking-widest flex items-center gap-2 transition-colors">
                    ← Exit Terminal
                </button>
                <div class="h-4 w-[1px] bg-zinc-700"></div>
                <span class="text-[10px] text-[#ffcc00] font-mono uppercase animate-pulse">
                    ${isLocal ? 'TACTICAL OVERLAY' : 'LIVE ACCESS'} // ${title}
                </span>
            </div>
            <span class="text-[9px] text-zinc-600 font-mono">${isLocal ? 'LOCAL_ASSET_MOUNTED' : 'SECURE_TUNNEL_ACTIVE'}</span>
        </div>
        <div class="flex-1 bg-black">
            <iframe src="${finalUrl}" class="w-full h-full border-none shadow-2xl"></iframe>
        </div>
    `;
}

function renderDynamicGrid(pageName, passedConfig = null) {
    const container = document.getElementById('grid-container');
    const config = passedConfig || getPageConfig(pageName);
    if (!container || !config) return;

    // Apply the grid layout specified in the JSON
    container.className = `flex-1 p-6 grid gap-4 overflow-hidden bg-black ${config.gridClass}`;
    container.innerHTML = '';

    config.visuals.forEach((vis) => {
        const card = document.createElement('div');
        card.className = `card-slot flex flex-col col-span-${vis.colSpan || 1} row-span-${vis.rowSpan || 1}`;
        
        if (vis.type === 'composite') {
            renderCompositeCard(card, vis);
        } else if (vis.url && vis.url !== "") {
            renderStandardCard(card, vis);
        } else {
            renderPlaceholder(card, vis.title);
        }
        container.appendChild(card);
    });
}

function renderStandardCard(container, vis) {
    const cleanParams = "&filterPaneEnabled=false&navContentPaneEnabled=false&chromeless=true";
    const finalUrl = vis.url.includes('filterPaneEnabled') ? vis.url : vis.url + cleanParams;
    
    // Catch 'excel-wide-fit' and standard sizes
    const cropClass = vis.size === 'small' ? 'pbi-small' : 
                      vis.size === 'medium' ? 'pbi-medium' : 
                      vis.size === 'double width' ? 'pbi-double-width' : 
                      vis.size === 'excel-wide-fit' ? 'excel-wide-fit' : 
                      'pbi-large';

    // NEW LOGIC: Hollow Card for Tables (With Floating Legend & Modal)
    if (vis.size === 'table') {
        container.classList.add('table-card-slot');

        // 1. Build the floating glassy legend (if provided)
        const tableLegendHTML = vis.legend ? `
            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 px-5 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full shadow-lg pointer-events-none">
                ${vis.legend.map(item => `
                    <div class="flex items-center gap-1.5 shrink-0">
                        <div class="w-2.5 h-2.5 rounded-full ${item.class}"></div>
                        <span class="text-[9px] text-white font-black uppercase tracking-widest text-shadow-sm">${item.label}</span>
                    </div>
                `).join('')}
            </div>
        ` : '';

        // 2. Build the top-right icon and 80% Modal Overlay (if modalUrl is provided)
        const modalHTML = vis.modalUrl ? `
            <button onclick="this.nextElementSibling.classList.remove('hidden')" class="absolute top-4 right-4 z-20 bg-black/60 hover:bg-[#ffcc00] text-zinc-400 hover:text-black p-2 rounded backdrop-blur-sm transition-all border border-zinc-700/50 hover:border-[#ffcc00] shadow-lg cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
            </button>
            
            <div class="hidden absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all animate-in fade-in duration-200">
                <div class="relative w-[80%] h-[80%] bg-[#18181b] border border-[#2d2d2d] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                    <div class="h-10 bg-[#111] border-b border-[#2d2d2d] flex justify-between items-center px-4 shrink-0">
                        <span class="text-[10px] font-black uppercase text-[#ffcc00] tracking-widest">Deep Dive Analysis</span>
                        <button onclick="this.closest('.absolute.inset-0').classList.add('hidden')" class="text-zinc-500 hover:text-red-500 transition-colors p-1 cursor-pointer">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    <iframe src="${vis.modalUrl.includes('filterPaneEnabled') ? vis.modalUrl : vis.modalUrl + cleanParams}" class="w-full flex-1 border-none bg-black/20" scrolling="no"></iframe>
                </div>
            </div>
        ` : '';

        // 3. Inject everything into the table card
        container.innerHTML = `
            ${modalHTML}
            <div class="pbi-viewport w-full h-full relative z-10">
                ${vis.url ? `<iframe title="${vis.title}" class="${cropClass}" src="${finalUrl}" scrolling="no"></iframe>` : `<div class="visual-placeholder">Awaiting...</div>`}
            </div>
            ${tableLegendHTML}
        `;
        return; // Exit the function early!
    }

    // --- STANDARD CARD LOGIC (For normal charts) ---
    const legendHTML = vis.legend ? `
        <div class="h-6 mt-1 flex items-center gap-2 px-3 bg-zinc-900/50 border border-zinc-800/50 rounded shadow-inner overflow-x-auto no-scrollbar">
            ${vis.legend.map(item => `
                <div class="flex items-center gap-1 shrink-0">
                    <div class="w-2 h-2 rounded-full ${item.class}"></div>
                    <span class="text-[8px] text-zinc-400 font-black uppercase tracking-tighter">${item.label}</span>
                </div>
            `).join('')}
        </div>
    ` : '';

    container.innerHTML = `
        <div class="card-header">${vis.title}</div>
        
        <div class="flex-1 flex flex-col p-4 overflow-hidden">
            <div class="pbi-viewport flex-1 rounded overflow-hidden relative">
                ${vis.url ? `<iframe title="${vis.title}" class="${cropClass}" src="${finalUrl}" scrolling="no"></iframe>` : `<div class="visual-placeholder">Awaiting...</div>`}
            </div>
            ${legendHTML}
        </div>
    `;
}

function renderCompositeCard(container, vis) {
    container.innerHTML = `
        <div class="card-header flex justify-between items-center w-full">
            <span>${vis.title}</span>
            <span class="construction-yellow text-[8px]">COMPOSITE</span>
        </div>
        <div class="flex-1 w-full p-4 flex flex-col gap-4 overflow-hidden">
            <div class="grid grid-cols-2 gap-4 h-28">
                ${vis.children.slice(0, 2).map(child => generateChildHTML(child)).join('')}
            </div>
            ${vis.children[2] ? generateChildHTML(vis.children[2], false, true) : ''}
        </div>
    `;
}

function generateChildHTML(child, isFullHeight = false, isFlexGrow = false) {
    if (child.type === 'kpi') {
        return `
            <div class="flex flex-col">
                <div class="sub-label-header">${child.title.toUpperCase()}</div>
                <div class="flex-1 callout-box p-3 flex flex-col justify-center">
                    <span class="text-[9px] text-zinc-500 uppercase font-bold">${child.label}</span>
                    <span class="text-2xl font-black text-red-500 tracking-tighter">${child.value}</span>
                </div>
            </div>
        `;
    }
    
    const cleanParams = "&filterPaneEnabled=false&navContentPaneEnabled=false&chromeless=true";
    const finalUrl = child.url === "" ? "" : (child.url.includes('filterPaneEnabled') ? child.url : child.url + cleanParams);
    
    const cropClass = child.size === 'small' ? 'pbi-small' : 
                     (child.size === 'medium' ? 'pbi-medium' : 
                     (child.size === 'double width' ? 'pbi-double-width' : 'pbi-large')); 

    return `
        <div class="flex flex-col ${isFullHeight ? 'h-full' : ''} ${isFlexGrow ? 'flex-1' : ''}">
            <div class="sub-label-header">${child.title.toUpperCase()}</div>
            <div class="pbi-viewport border border-zinc-800 rounded overflow-hidden flex-1">
                ${finalUrl ? `<iframe class="${cropClass}" src="${finalUrl}" scrolling="no"></iframe>` : `<div class="visual-placeholder">Awaiting...</div>`}
            </div>
        </div>
    `;
}

function renderPlaceholder(container, title) {
    container.innerHTML = `
        <div class="card-header">${title}</div>
        <div class="visual-placeholder uppercase">Intelligence Pending...</div>
    `;
}

function renderNavigation() {
    const navContainer = document.getElementById('main-nav');
    if (!navContainer) return;
    navContainer.innerHTML = '';
    
    // A simple map to assign an icon based on the menu name
    const getIcon = (name) => {
        const icons = {
            'overview': `<svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>`,
            'actions': `<svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>`,
            'default': `<svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>`
        };
        const key = name.toLowerCase().split(' ')[0];
        return icons[key] || icons['default'];
    };

    Object.keys(PAGE_CONFIG).forEach(key => {
        const config = PAGE_CONFIG[key];
        const cleanKey = key.replace(/[^a-zA-Z0-9]/g, '');
        
        if (config.type === 'parent') {
            const parentId = `parent-${cleanKey}`;
            
            // Render the clickable parent accordion header
            const parentDiv = document.createElement('div');
            // Check if any of its children are currently active
            const isChildActive = config.children && config.children[currentPage] != null;
            
            parentDiv.className = `nav-item-base nav-parent group ${isChildActive ? 'text-white' : ''}`;
            parentDiv.onclick = () => toggleNavParent(parentId);
            parentDiv.innerHTML = `
                <div class="flex items-center">
                    ${getIcon(key)}
                    <span>${key}</span>
                </div>
                <svg class="chevron w-3 h-3 transition-transform duration-200 ${isChildActive ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            `;
            
            // Render the container for children
            const childrenContainer = document.createElement('div');
            childrenContainer.id = parentId;
            childrenContainer.className = `nav-children flex flex-col ${isChildActive ? '' : 'hidden'}`;
            
            // Loop through and render children
            Object.keys(config.children).forEach(childKey => {
                const childItem = document.createElement('div');
                childItem.id = `nav-${childKey.replace(/[^a-zA-Z0-9]/g, '')}`;
                
                const isActive = currentPage === childKey;
                childItem.className = `nav-item-base nav-sub-item ${isActive ? 'nav-active' : ''}`;
                
                childItem.innerText = childKey;
                childItem.onclick = (e) => {
                    e.stopPropagation(); 
                    if(isAuthorized) switchPage(childKey);
                };
                childrenContainer.appendChild(childItem);
            });
            
            navContainer.appendChild(parentDiv);
            navContainer.appendChild(childrenContainer);
            
        } else {
            // Render standalone item (like Overview)
            const navItem = document.createElement('div');
            navItem.id = `nav-${cleanKey}`;
            
            const isActive = currentPage === key;
            navItem.className = `nav-item-base ${isActive ? 'nav-active' : ''}`;
            
            navItem.innerHTML = `
                ${getIcon(key)}
                <span>${key}</span>
            `;
            navItem.onclick = () => isAuthorized && switchPage(key);
            navContainer.appendChild(navItem);
        }
    });
}

function toggleNavParent(parentId) {
    const childrenContainer = document.getElementById(parentId);
    const parentDiv = childrenContainer.previousElementSibling;
    const chevron = parentDiv.querySelector('.chevron');
    
    if (childrenContainer.classList.contains('hidden')) {
        childrenContainer.classList.remove('hidden');
        childrenContainer.classList.add('flex');
        chevron.classList.add('rotate-180');
        parentDiv.classList.add('text-[#ffcc00]');
    } else {
        childrenContainer.classList.add('hidden');
        childrenContainer.classList.remove('flex');
        chevron.classList.remove('rotate-180');
        parentDiv.classList.remove('text-[#ffcc00]');
    }
}

function displayDeploymentError(message) {
    const container = document.getElementById('grid-container');
    if (container) {
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center p-12 text-zinc-500 border border-dashed border-zinc-800">
                <p class="text-red-500 font-bold uppercase mb-2">CORS / Local Access Violation</p>
                <p class="text-[10px] max-w-sm text-center">The browser blocked the fetch of config.json. Use VS Code 'Live Server' to deploy correctly.</p>
            </div>
        `;
    }
}

window.onload = init;