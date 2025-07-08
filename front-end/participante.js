/// ==========================================================
/// ==========  participante ==== ============================
/// ==========================================================


// === Participante: adicionar na API ===
const API_BASE = 'https://137.131.168.114:8433'; // ajuste a URL da sua API

function initAdicionarParticipante() {
  const form = document.getElementById('participanteForm');
  const idMesaInput = document.getElementById('idMesaInput');
  const msgDiv = document.getElementById('message');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault(); // evita reload da página
    msgDiv.textContent = '';
    msgDiv.style.color = '';

    const usuario_email = localStorage.getItem('email');
    const id_mesa = idMesaInput.value;

    if (!usuario_email || !id_mesa) {
      msgDiv.textContent = 'Preencha todos os campos.';
      msgDiv.style.color = 'red';
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/participante`, {
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
        msgDiv.textContent = data.error || 'Erro ao adicionar participante.';
        msgDiv.style.color = 'red';
      }
    } catch (err) {
      msgDiv.textContent = 'Erro de conexão: ' + err.message;
      msgDiv.style.color = 'red';
    }
  });
}

// Chame a função para ativar o listener
initAdicionarParticipante();
