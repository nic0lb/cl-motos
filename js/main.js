const WHATSAPP_DEFAULT_NUMBER = "5585991105281";
const FALLBACK_IMG = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80";

document.addEventListener('DOMContentLoaded', () => {
    carregarCatalogoPublico();
    configurarFiltros();
});

async function carregarCatalogoPublico(marcaFiltro = 'todos') {
    const grid = document.getElementById('motosGrid');
    if (!grid) return;

    grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--text-muted);">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem;"></i>
            <p style="margin-top: 15px;">Carregando estoque atualizado...</p>
        </div>
    `;

    try {
        let query = supabaseClient
            .from('motos')
            .select('*')
            .eq('status', 'disponivel')
            .order('created_at', { ascending: false });

        if (marcaFiltro !== 'todos') {
            query = query.eq('marca', marcaFiltro);
        }

        const { data: motos, error } = await query;

        if (error) throw error;

        if (!motos || motos.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--text-muted);">
                    <i class="fa-solid fa-motorcycle" style="font-size: 2.5rem; margin-bottom: 15px; opacity: 0.5;"></i>
                    <h3>Nenhuma motocicleta encontrada</h3>
                    <p>Tente selecionar outra marca ou volte mais tarde.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = "";

        motos.forEach(moto => {
            const imagens = moto.imagens && moto.imagens.length > 0 ? moto.imagens : [FALLBACK_IMG];
            const capa = imagens[0];
            const absoluteUrl = `https://clmotos.vercel.app/moto.html?id=${moto.id}`;
            const mensagemWhats = encodeURIComponent(`Olá! Tenho interesse na *${moto.modelo} (${moto.ano})* anunciada por ${moto.preco}:\n${absoluteUrl}`);
            const linkWhats = `https://wa.me/${WHATSAPP_DEFAULT_NUMBER}?text=${mensagemWhats}`;

            const card = document.createElement('div');
            card.className = 'moto-card';

            // Clicar no card abre a página detalhada da moto
            card.addEventListener('click', () => {
                window.location.href = `moto.html?id=${moto.id}`;
            });

            card.innerHTML = `
                <div class="moto-card-img-wrapper">
                    <img src="${capa}" alt="${moto.modelo}" class="moto-card-img" onerror="this.src='${FALLBACK_IMG}'">
                    <span class="moto-badge">${moto.tag || 'Seminova'}</span>
                </div>
                <div class="moto-card-body">
                    <span class="moto-marca">${moto.marca}</span>
                    <h3 class="moto-modelo">${moto.modelo}</h3>
                    <div class="moto-specs">
                        <span><i class="fa-solid fa-calendar"></i> ${moto.ano}</span>
                        <span><i class="fa-solid fa-gauge"></i> ${moto.km}</span>
                    </div>
                    <div class="moto-footer">
                        <div class="moto-preco">${moto.preco}</div>
                        <a href="${linkWhats}" target="_blank" rel="noopener" class="btn-whatsapp-card" title="Negociar no WhatsApp" onclick="event.stopPropagation();">
                            <i class="fa-brands fa-whatsapp"></i>
                        </a>
                    </div>
                </div>
            `;

            grid.appendChild(card);
        });

    } catch (err) {
        console.error("Erro ao carregar catálogo:", err);
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: #ff4d4f;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>Erro ao carregar o estoque. Verifique sua conexão.</p>
            </div>
        `;
    }
}

function configurarFiltros() {
    const botoesFiltro = document.querySelectorAll('.filter-btn');
    botoesFiltro.forEach(btn => {
        btn.addEventListener('click', (e) => {
            botoesFiltro.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const marca = e.target.getAttribute('data-filter');
            carregarCatalogoPublico(marca);
        });
    });
}