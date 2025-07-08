/// ==========================================================
/// ==========  USUARIO ATUALIZAR ============================
/// ==========================================================



document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formAtualizarUsuario');
  const mensagemDiv = document.getElementById('mensagem');

  function mostrarMensagem(texto, sucesso = false) {
    mensagemDiv.textContent = texto;
    mensagemDiv.style.color = sucesso ? 'lightgreen' : 'red';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = localStorage.getItem('email');
    const senha = document.getElementById('novaSenha').value;

    if (!email || !senha) {
      mostrarMensagem('Preencha todos os campos.');
      return;
    }

    try {
      const resposta = await fetch(`https://137.131.168.114:8443/usuario/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        mostrarMensagem(dados.message || 'Senha atualizada com sucesso!', true);
        form.reset();
      } else {
        mostrarMensagem(dados.error || 'Erro ao atualizar usuário.');
      }
    } catch (erro) {
      console.error('Erro na requisição:', erro);
      mostrarMensagem('Erro ao se conectar com o servidor.');
    }
  });
});
