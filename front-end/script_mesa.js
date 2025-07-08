/// ==========================================================
/// ==========  MESA   - MESA DETALHADA ======================
/// ==========================================================
document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE = 'https://137.131.168.114:8443';  // seu host+porta
  const mensagemEl = document.getElementById('mensagem');
  const resultadoEl = document.getElementById('resultado');

  // Obter o ID da mesa do localStorage, priorizando mesaMestre
  const mesaId = localStorage.getItem('mesaMestre') || localStorage.getItem('mesaJogador');
  if (!mesaId) {
    mensagemEl.textContent = '❌ Nenhum ID de mesa encontrado no localStorage.';
    mensagemEl.style.color = '#e74c3c';
    return;
  }

  mensagemEl.textContent = 'Carregando informações…';
  mensagemEl.style.color = 'var(--text-secondary)';
  resultadoEl.innerHTML = '';

  try {
    console.log(`🛰️ Fazendo GET em ${API_BASE}/mesa/${mesaId}`);
    const response = await fetch(`${API_BASE}/mesa/${encodeURIComponent(mesaId)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors',
      // credentials: 'include' // descomente se precisar enviar cookies
    });

    console.log('Status HTTP:', response.status);
    const texto = await response.text();
    console.log('Resposta bruta:', texto);

    let data;
    try {
      data = JSON.parse(texto);
    } catch {
      throw new Error('Resposta não é JSON válido');
    }

    if (!response.ok) {
      const msg = data.error || response.statusText;
      throw new Error(msg);
    }

    // OK!
    mensagemEl.textContent = '✅ Sucesso! Personagens encontrados:';
    mensagemEl.style.color = 'var(--secondary-color)';

    if (Array.isArray(data?.personagens) && data.personagens.length > 0) {
      const ul = document.createElement('ul');
      data.personagens.forEach(p => {
        const li = document.createElement('li');
        li.textContent = `ID: ${p.id_personagem} — ${p.nome} (Classe: ${p.classe}, Nível: ${p.nivel})`;
        ul.appendChild(li);
      });
      resultadoEl.appendChild(ul);
    } else {
      resultadoEl.textContent = 'Nenhum personagem associado a esta mesa.';
      console.warn('⚠️ Nenhum personagem encontrado ou resposta malformada:', data);
    }

  } catch (err) {
    console.error(err);
    mensagemEl.textContent = `❌ Erro ao consultar mesa: ${err.message}`;
    mensagemEl.style.color = '#e74c3c';
  }
});