// ==========================================
// CATÁLOGO PÚBLICO (INTEGRADO AO SUPABASE)
// ==========================================
const FALLBACK_MOTO_IMAGE = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80";
const WHATSAPP_NUMBER = "5585991105281";

const motosGrid = document.getElementById('motosGrid');
const filterBtns = document.querySelectorAll('.filter-btn');
const motoSearchInput = document.getElementById('motoSearch');

let currentFilter = "all";
let currentSearchQuery = "";
let activeCarousels = [];

// Busca as motos diretamente no Supabase
async function buscarEstoqueMotos() {
    try {
        const { data, error } = await supabaseClient
            .from('motos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Mapeia de snake_case (banco) para camelCase (frontend)
        return data.map(db => ({
            id: db.id,
            marca: db.marca,
            modelo: db.modelo,
            ano: db.ano,
            km: db.km,
            precoNum: db.preco_num,
            preco: db.preco,
            tag: db.tag,
            cilindrada: db.cilindrada,
            cor: db.cor,
            combustivel: db.combustivel,
            partida: db.partida,
            freio: db.freio,
            imagens: db.imagens,
            imagem: db.imagens && db.imagens.length > 0 ? db.imagens[0] : FALLBACK_MOTO_IMAGE
        }));
    } catch (e) {
        console.error("Erro ao carregar do Supabase:", e);
        return [];
    }
}

async function filtrarEPlugarMotos() {
    if (!motosGrid) return;
    
    activeCarousels.forEach(id => clearInterval(id));
    activeCarousels = [];

    motosGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Carregando estoque atualizado...</div>`;

    const estoque = await buscarEstoqueMotos();
    const termoBusca = currentSearchQuery.toLowerCase().trim();

    const motosFiltradas = estoque.filter(moto => {
        const matchCategoria = currentFilter === "all" || 
            moto.marca.toLowerCase() === currentFilter.toLowerCase() || 
            (currentFilter === "Outras" && moto.marca !== "Honda" && moto.marca !== "Yamaha");

        const matchBusca = moto.modelo.toLowerCase().includes(termoBusca) || 
                           moto.ano.toLowerCase().includes(termoBusca);

        return matchCategoria && matchBusca;
    });

    motosGrid.innerHTML = "";

    if (motosFiltradas.length === 0) {
        motosGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px 0; color: var(--text-muted);">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; color: var(--accent); margin-bottom: 10px;"></i>
                <p>Nenhuma motocicleta encontrada com esses critérios.</p>
            </div>
        `;
        return;
    }

    motosFiltradas.forEach(moto => {
        const card = document.createElement('div');
        card.className = 'moto-card';
        card.style.cursor = 'pointer';
        
        const imagens = moto.imagens && moto.imagens.length > 0 ? moto.imagens : [moto.imagem];
        const mensagemWhats = encodeURIComponent(`Olá! Vi a moto *${moto.modelo} (${moto.ano})* anunciada no site da CL Motos por ${moto.preco} e tenho interesse.`);
        const linkWhats = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensagemWhats}`;

        card.innerHTML = `
            <div class="moto-img-container">
                <span class="moto-badge-tag">${moto.tag || 'Seminova'}</span>
                <img src="${imagens[0]}" alt="${moto.modelo}" class="moto-carousel-img" loading="lazy" onerror="this.src='${FALLBACK_MOTO_IMAGE}'">
                ${imagens.length > 1 ? `
                    <div class="carousel-indicators">
                        ${imagens.map((_, idx) => `<span class="indicator ${idx === 0 ? 'active' : ''}"></span>`).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="moto-details">
                <h3 class="moto-title">${moto.modelo}</h3>
                <div class="moto-specs">
                    <span><i class="fa-solid fa-calendar"></i> ${moto.ano}</span>
                    <span><i class="fa-solid fa-gauge"></i> ${moto.km}</span>
                </div>
                <div class="moto-footer">
                    <span class="moto-price">${moto.preco}</span>
                    <a href="${linkWhats}" target="_blank" class="btn-interest" rel="noopener" onclick="event.stopPropagation()">
                        <i class="fa-brands fa-whatsapp"></i> Tenho Interesse
                    </a>
                </div>
            </div>
        `;

        if (imagens.length > 1) {
            let currentImgIdx = 0;
            const imgElement = card.querySelector('.moto-carousel-img');
            const indicators = card.querySelectorAll('.indicator');

            const timer = setInterval(() => {
                if (!document.body.contains(card)) {
                    clearInterval(timer);
                    return;
                }
                currentImgIdx = (currentImgIdx + 1) % imagens.length;
                if (imgElement) imgElement.src = imagens[currentImgIdx];
                indicators.forEach((ind, idx) => {
                    ind.classList.toggle('active', idx === currentImgIdx);
                });
            }, 3500);

            activeCarousels.push(timer);
        }

        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-interest')) return;
            abrirModalMoto(moto);
        });

        motosGrid.appendChild(card);
    });
}

// ==========================================
// MODAL DE DETALHES DA MOTO
// ==========================================
const motoModal = document.getElementById('motoModal');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');

function abrirModalMoto(moto) {
    if (!motoModal || !modalContent) return;

    const imagens = moto.imagens && moto.imagens.length > 0 ? moto.imagens : [moto.imagem];
    const precoBase = moto.precoNum || 15000;
    const entradaSugerida = Math.round(precoBase * 0.3);
    const valorFinanciado = precoBase - entradaSugerida;
    const parcela48x = Math.round((valorFinanciado * 1.4) / 48);

    modalContent.innerHTML = `
        <div class="modal-grid">
            <div class="modal-gallery-container">
                <img src="${imagens[0]}" alt="${moto.modelo}" class="modal-gallery-main-img" id="modalMainImg" onerror="this.src='${FALLBACK_MOTO_IMAGE}'">
                ${imagens.length > 1 ? `
                    <div class="modal-thumbnails">
                        ${imagens.map((img, idx) => `
                            <img src="${img}" alt="Miniatura ${idx+1}" class="modal-thumb ${idx === 0 ? 'active' : ''}" data-src="${img}" onerror="this.src='${FALLBACK_MOTO_IMAGE}'">
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            
            <div class="modal-info">
                <h3 class="modal-info-title" id="modalTitle">${moto.modelo}</h3>
                <div class="modal-info-price">${moto.preco}</div>

                <div class="tech-specs-grid">
                    <div class="tech-spec-item"><strong>Ano:</strong> <span>${moto.ano}</span></div>
                    <div class="tech-spec-item"><strong>Quilometragem:</strong> <span>${moto.km}</span></div>
                    <div class="tech-spec-item"><strong>Cilindrada:</strong> <span>${moto.cilindrada || 'N/A'}</span></div>
                    <div class="tech-spec-item"><strong>Cor:</strong> <span>${moto.cor || 'N/A'}</span></div>
                    <div class="tech-spec-item"><strong>Combustível:</strong> <span>${moto.combustivel || 'Flex'}</span></div>
                    <div class="tech-spec-item"><strong>Partida:</strong> <span>${moto.partida || 'Elétrica'}</span></div>
                    <div class="tech-spec-item"><strong>Freios:</strong> <span>${moto.freio || 'CBS'}</span></div>
                </div>

                <div class="simulator-box">
                    <h4><i class="fa-solid fa-calculator" style="color: var(--accent);"></i> Simulação Estimada</h4>
                    <div class="sim-group">
                        <label for="simEntrada">Entrada Sugerida (R$):</label>
                        <input type="number" id="simEntrada" value="${entradaSugerida}" step="500">
                    </div>
                    <div class="sim-group">
                        <label for="simParcelas">Parcelas:</label>
                        <select id="simParcelas">
                            <option value="48">48x de R$ ${parcela48x}</option>
                            <option value="36">36x de R$ ${Math.round((valorFinanciado * 1.3) / 36)}</option>
                            <option value="24">24x de R$ ${Math.round((valorFinanciado * 1.2) / 24)}</option>
                        </select>
                    </div>

                    <a href="#" id="btnEnvioSimulacao" target="_blank" class="btn btn-primary w-100" style="background-color: var(--whatsapp); border:none;" rel="noopener">
                        <i class="fa-brands fa-whatsapp"></i> Enviar Proposta por WhatsApp
                    </a>
                </div>
            </div>
        </div>
    `;

    if (imagens.length > 1) {
        const thumbs = modalContent.querySelectorAll('.modal-thumb');
        const mainImg = document.getElementById('modalMainImg');
        thumbs.forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                e.stopPropagation();
                thumbs.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
                if (mainImg) mainImg.src = thumb.getAttribute('data-src');
            });
        });
    }

    const btnEnvio = document.getElementById('btnEnvioSimulacao');
    const inputEntrada = document.getElementById('simEntrada');
    const selectParcelas = document.getElementById('simParcelas');

    function atualizarLinkSimulacao() {
        const ent = inputEntrada.value || 0;
        const parcText = selectParcelas.options[selectParcelas.selectedIndex].text;
        const msg = encodeURIComponent(`Olá CL Motos! Gostaria de simular a compra da *${moto.modelo} (${moto.ano})* com R$ ${ent} de entrada em ${parcText}. Podemos avaliar?`);
        if (btnEnvio) {
            btnEnvio.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
        }
    }

    if (inputEntrada && selectParcelas) {
        inputEntrada.addEventListener('input', atualizarLinkSimulacao);
        selectParcelas.addEventListener('change', atualizarLinkSimulacao);
    }
    atualizarLinkSimulacao();

    motoModal.classList.add('active');
    document.body.classList.add('modal-open');
}

function fecharModal() {
    if (motoModal) {
        motoModal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}

if (modalClose) modalClose.addEventListener('click', fecharModal);
if (motoModal) {
    motoModal.addEventListener('click', (e) => {
        if (e.target === motoModal) fecharModal();
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && motoModal && motoModal.classList.contains('active')) {
        fecharModal();
    }
});

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    filtrarEPlugarMotos();

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            filtrarEPlugarMotos();
        });
    });

    if (motoSearchInput) {
        motoSearchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value;
            filtrarEPlugarMotos();
        });
    }

    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    function fecharMenuMobile() {
        if (navMenu && hamburger) {
            navMenu.classList.remove('active');
            const icon = hamburger.querySelector('i');
            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-xmark');
            }
        }
    }

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            const icon = hamburger.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-xmark');
            }
        });

        navLinks.forEach(link => link.addEventListener('click', fecharMenuMobile));

        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !hamburger.contains(e.target) && navMenu.classList.contains('active')) {
                fecharMenuMobile();
            }
        });
    }

    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.style.backgroundColor = 'rgba(15, 17, 21, 0.98)';
                header.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';
            } else {
                header.style.backgroundColor = 'rgba(15, 17, 21, 0.95)';
                header.style.boxShadow = 'none';
            }
        });
    }
});