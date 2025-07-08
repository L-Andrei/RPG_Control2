/// ==========================================================
/// ==========  participante ==== ============================
/// ==========================================================


// === Participante: adicionar na API ===
function initAdicionarParticipante() {
  const form = document.getElementById('participanteForm');
  const emailInput = document.getElementById('emailInput');
  const idMesaInput = document.getElementById('idMesaInput');
  const msgDiv = document.getElementById('message');
  console.log("giovani");
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    msgDiv.textContent = '';             // limpa mensagem anterior
    msgDiv.style.color = '';             // reseta cor

    const usuario_email = emailInput.value.trim();
    const id_mesa        = idMesaInput.value;

    // validação simples
    if (!usuario_email || !id_mesa) {
      msgDiv.textContent = 'Preencha todos os campos.';
      msgDiv.style.color = 'red';
      return;
    }

    try {
      const res = await fetch(`https://137.131.168.114:8443/participante`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_email, id_mesa: Number(id_mesa) })
      });
      const data = await res.json();

      if (res.ok) {
        msgDiv.textContent = data.message || 'Participante adicionado com sucesso!';
        msgDiv.style.color = 'green';
        form.reset();
      } else {
        // trata erros 4xx/5xx
        msgDiv.textContent = data.error || 'Erro ao adicionar participante.';
        msgDiv.style.color = 'red';
      }
    } catch (err) {
      // erro de rede ou CORS
      msgDiv.textContent = 'Erro de conexão: ' + err.message;
      msgDiv.style.color = 'red';
    }
  });
}

// inicializa logo que a página carrega
document.addEventListener('DOMContentLoaded', () => {
  initAdicionarParticipante();
});