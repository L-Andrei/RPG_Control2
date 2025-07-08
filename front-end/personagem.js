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
    const id_mesa = localStorage.getItem('mesaJogador');

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
