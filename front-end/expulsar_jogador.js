/// ==========================================================
/// ==========  explusar jogador  ============================
/// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formExpulsarJogador');
  const inputNome = document.getElementById('nomePersonagem');
  const mensagemDiv = document.getElementById('mensagem');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = inputNome.value.trim();
    if (!nome) {
      mostrarMensagem('Por favor, insira o nome do personagem.', false);
      return;
    }

    try {
      const resposta = await fetch(`https://137.131.168.114:8443/expulsar`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nome })
      });

      const resultado = await resposta.json();

      if (resposta.ok) {
        mostrarMensagem(resultado.message, true);
        inputNome.value = '';
      } else {
        mostrarMensagem(resultado.error || 'Erro ao expulsar jogador.', false);
      }
    } catch (erro) {
      mostrarMensagem('Erro de conexão com o servidor.', false);
    }
  });

  function mostrarMensagem(texto, sucesso = false) {
    mensagemDiv.textContent = texto;
    mensagemDiv.style.color = sucesso ? 'lightgreen' : 'salmon';
  }
});



