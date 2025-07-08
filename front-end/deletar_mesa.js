/// ==========================================================
/// ==========  DELETAR MESA ==== ============================
/// ==========================================================


// === Função para deletar a mesa selecionada ===
document.getElementById('deleteForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const mesaId = localStorage.getItem('mesaMestre');
  const messageEl = document.getElementById('formMessage');

  fetch(`https://137.131.168.114:8443/mesa/del/${mesaId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(async response => {
      const data = await response.json();

      if (response.ok) {
        messageEl.style.color = 'green';
        messageEl.textContent = `✅ Mesa ${data.deleted_mesa_id} deletada com sucesso. ${data.deleted_personagens.length} personagem(ns) e ${data.deleted_participantes.length} participante(s) removidos.`;
        window.location.href = 'dashboard.html';
      } else {
        messageEl.style.color = 'red';
        messageEl.textContent = `❌ Erro: ${data.error || 'Não foi possível deletar a mesa.'}`;
      }
    })
    .catch(error => {
      messageEl.style.color = 'red';
      messageEl.textContent = `❌ Erro na conexão com o servidor: ${error.message}`;
    });
});