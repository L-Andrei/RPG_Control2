/// ==========================================================
/// ========== criar personagem   ============================
/// ==========================================================




document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('form-personagem');
  const messageDiv = document.getElementById('message');

  form.addEventListener('submit', async function(event) {
    event.preventDefault();

    // Limpa mensagens anteriores
    messageDiv.textContent = '';
    messageDiv.classList.remove('success', 'error');

    // Mostra estado de carregando
    messageDiv.textContent = 'Carregando...';

    // Coleta os dados do formulário
    const nome = document.getElementById('nome').value.trim();
    const classe = document.getElementById('classe').value.trim();
    const usuario_email = localStorage.getItem('email');
    const id_mesa = parseInt(localStorage.getItem('mesaJogador'));

    // Monta o payload
    const payload = { nome, classe, usuario_email, id_mesa };

    try {
      const response = await fetch('https://137.131.168.114:8443/personagem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = 'Sucesso: ' + (result.message || 'Personagem criado com sucesso.');
        messageDiv.classList.add('success');
        form.reset();
      } else {
        // Erro de validação ou servidor
        messageDiv.textContent = 'Erro: ' + (result.error || 'Ocorreu um erro ao criar o personagem.');
        messageDiv.classList.add('error');
      }

    } catch (error) {
      // Erro de rede ou inesperado
      messageDiv.textContent = 'Erro: Não foi possível conectar ao servidor.';
      messageDiv.classList.add('error');
      console.error(error);
    }
  });
});



/// ==========================================================
/// ========== personagem atualizar ==========================
/// ==========================================================





document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formAtualizar');
  const mensagem = document.getElementById('mensagem');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Exibe estado de carregamento
    mensagem.textContent = 'Carregando...';
    mensagem.style.color = '#555';

    // Coleta dados do formulário
    const email = localStorage.getItem('email');
    const id_mesa = parseInt(localStorage.getItem('mesaJogador'));
    const nome = document.getElementById('nome').value;
    const classe = document.getElementById('classe').value;
    const nivelInput = document.getElementById('nivel').value;
    const nivel = nivelInput ? parseInt(nivelInput, 10) : null;

    // Monta payload dinamicamente
    const payload = { email, id_mesa };
    if (nome) payload.nome = nome;
    if (classe) payload.classe = classe;
    if (nivel) payload.nivel = nivel;

    try {
      const response = await fetch('https://137.131.168.114:8443/personagem/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        mensagem.textContent = result.message || 'Atualizado com sucesso!';
        mensagem.style.color = 'var(--secondary-color)';
      } else {
        mensagem.textContent = result.error || 'Ocorreu um erro na atualização.';
        mensagem.style.color = 'red';
      }
    } catch (error) {
      mensagem.textContent = 'Erro de rede: ' + error.message;
      mensagem.style.color = 'red';
    }
  });
});