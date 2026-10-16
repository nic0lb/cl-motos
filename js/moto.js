const FALLBACK_MOTO_IMAGE = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80";
const WHATSAPP_NUMBER = "5585991105281";

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const motoId = urlParams.get('id');
    const container = document.getElementById('motoDetailContainer');

    if (!motoId) {
        container.innerHTML = renderEstadoVazio("Nenhuma motocicleta especificada.");
        return;
    }

    try {
        const { data: moto, error } = await supabaseClient
            .from('motos')
            .select('*')
            .eq('id', motoId)
            .maybeSingle();

        if (error || !moto) {
            container.innerHTML = renderEstadoVazio("Motocicleta não encontrada ou indisponível.");
            return;
        }

        // Atualiza dinamicamente o SEO básico da página
        document.title = `${moto.modelo} (${moto.ano}) | CL Motos`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.content = `${moto.modelo} ano ${moto.ano}, quilometragem ${moto.km} por ${moto.preco} na CL Motos em Horizonte-CE.`;

        const imagens = moto.imagens && moto.imagens.length > 0 ? moto.imagens : [FALLBACK_MOTO_IMAGE];
        const absoluteUrl = `https://clmotos.vercel.app/moto.html?id=${moto.id}`;
        const mensagemWhats = encodeURIComponent(`Olá! Tenho interesse na *${moto.modelo} (${moto.ano})* por ${moto.preco}:\n${absoluteUrl}`);
        const linkWhats = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensagemWhats}`;

        const precoNum = moto.preco_num || 15000;
        const entradaSugerida = Math.round(precoNum * 0.3);
        const saldoFinanciado = precoNum - entradaSugerida;
        const parcela48 = Math.round(saldoFinanciado / 48);
        const parcela36 = Math.round(saldoFinanciado / 36);

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 40px; align-items: start;">
                <!-- Galeria -->
                <div>
                    <div style="background: var(--card-bg); border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); margin-bottom: 15px;">
                        <img src="${imagens[0]}" alt="${moto.modelo}" id="mainDetailImg" style="width: 100%; height: 380px; object-fit: cover;" onerror="this.src='${FALLBACK_MOTO_IMAGE}'">
                    </div>
                    ${imagens.length > 1 ? `
                        <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px;">
                            ${imagens.map((img, idx) => `
                                <img src="${img}" alt="Miniatura ${idx+1}" onclick="document.getElementById('mainDetailImg').src='${img}'" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 2px solid ${idx === 0 ? 'var(--accent)' : 'transparent'};" onerror="this.src='${FALLBACK_MOTO_IMAGE}'">
                            `).join('')}
                        </div>
                    ` : ''}
                </div>

                <!-- Informações e Ações -->
                <div>
                    <span style="background: rgba(229, 9, 20, 0.15); color: var(--accent); padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">${moto.tag || 'Seminova'}</span>
                    <h1 style="font-size: 2rem; margin: 15px 0 10px 0; font-family: 'Montserrat', sans-serif;">${moto.modelo}</h1>
                    <div style="font-size: 1.8rem; font-weight: 700; color: var(--accent); margin-bottom: 20px;">${moto.preco}</div>

                    <div class="tech-specs-grid" style="margin-bottom: 25px;">
                        <div class="tech-spec-item"><strong>Ano:</strong> <span>${moto.ano}</span></div>
                        <div class="tech-spec-item"><strong>KM:</strong> <span>${moto.km}</span></div>
                        <div class="tech-spec-item"><strong>Cilindrada:</strong> <span>${moto.cilindrada || 'N/A'}</span></div>
                        <div class="tech-spec-item"><strong>Cor:</strong> <span>${moto.cor || 'N/A'}</span></div>
                        <div class="tech-spec-item"><strong>Combustível:</strong> <span>${moto.combustivel || 'Flex'}</span></div>
                        <div class="tech-spec-item"><strong>Partida:</strong> <span>${moto.partida || 'Elétrica'}</span></div>
                        <div class="tech-spec-item"><strong>Freios:</strong> <span>${moto.freio || 'CBS'}</span></div>
                    </div>

                    <div style="background: var(--card-bg); border: 1px solid var(--border-color); padding: 20px; border-radius: 12px; margin-bottom: 25px;">
                        <h4 style="margin-bottom: 12px; font-size: 1rem;"><i class="fa-solid fa-calculator" style="color: var(--accent);"></i> Simulação Estimada (Sem Juros / Base)</h4>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">Cálculo linear simples do saldo restante (Preço - Entrada). Taxas e taxas de financiamento definitivas sob consulta na loja.</p>
                        <div style="font-size: 0.95rem; line-height: 1.6;">
                            <div>Entrada sugerida (30%): <strong>R$ ${entradaSugerida.toLocaleString('pt-BR')}</strong></div>
                            <div>Opção 48x de aprox.: <strong style="color: var(--accent);">R$ ${parcela48.toLocaleString('pt-BR')}</strong></div>
                            <div>Opção 36x de aprox.: <strong style="color: var(--accent);">R$ ${parcela36.toLocaleString('pt-BR')}</strong></div>
                        </div>
                    </div>

                    <a href="${linkWhats}" target="_blank" rel="noopener" class="btn btn-primary w-100" style="background-color: var(--whatsapp); border: none; padding: 14px; font-size: 1rem; text-align: center; display: block; text-decoration: none; border-radius: 8px; color: #fff; font-weight: 600;">
                        <i class="fa-brands fa-whatsapp"></i> Negociar pelo WhatsApp
                    </a>
                    
                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 10px; text-align: center;">
                        Nota: Pré-visualizações ricas (OpenGraph com foto e preço no WhatsApp) exigem processamento em servidor dedicado (Edge Functions). Atualmente enviamos link direto absoluto.
                    </p>
                </div>
            </div>
        `;

    } catch (err) {
        console.error("Erro ao carregar moto:", err);
        container.innerHTML = renderEstadoVazio("Erro ao carregar dados. Tente novamente mais tarde.");
    }
});

function renderEstadoVazio(mensagem) {
    return `
        <div style="text-align: center; padding: 60px 20px;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; color: var(--accent); margin-bottom: 15px;"></i>
            <h2 style="margin-bottom: 10px;">Ops!</h2>
            <p style="color: var(--text-muted); margin-bottom: 20px;">${mensagem}</p>
            <a href="index.html" class="btn btn-primary" style="display: inline-block; text-decoration: none; padding: 10px 20px;">Ver Catálogo Completo</a>
        </div>
    `;
}