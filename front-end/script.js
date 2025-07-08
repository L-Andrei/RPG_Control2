const API_BASE = 'https://137.131.168.114:8443';

// === Register/Login Logic ===
let registerForm, loginForm, messageDiv, welcomeDiv;
let loginEmailInput, saveEmailCheckbox;

function showMessage(text, success = false) {
  messageDiv.textContent = text;
  messageDiv.style.color = success ? 'green' : 'red';
}

async function sendRequest(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { res, data };
}

async function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById('regEmail').value;
  const senha = document.getElementById('regSenha').value;

  try {
    const { res, data } = await sendRequest('/cadastro', { email, senha });
    if (res.ok) {
      showMessage('Conta criada com sucesso!', true);
      registerForm.reset();
    } else {
      showMessage(data.error || data.message || 'Falha no cadastro');
    }
  } catch (err) {
    showMessage('Erro de conexão: ' + err.message);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = loginEmailInput.value;
  const senha = document.getElementById('loginSenha').value;

  if (saveEmailCheckbox.checked) {
    localStorage.setItem('savedEmail', email);
  } else {
    localStorage.removeItem('savedEmail');
  }

  try {
    const { res, data } = await sendRequest('/login', { email, senha });
    if (res.ok) {
      showMessage('Login efetuado com sucesso!', true);
      loginForm.reset();
      welcomeDiv.style.display = 'block';
      welcomeDiv.textContent = `Bem-vindo(a), ${email}!`;
      localStorage.setItem('email', email);
      window.location.href = 'dashboard.html';
    } else {
      showMessage(data.error || data.message || 'Falha no login');
      welcomeDiv.style.display = 'none';
    }
  } catch (err) {
    showMessage('Erro de conexão: ' + err.message);
  }
}

function loadSavedEmail() {
  const savedEmail = localStorage.getItem('savedEmail');
  if (savedEmail) {
    loginEmailInput.value = savedEmail;
    saveEmailCheckbox.checked = true;
  }
}

function initRegisterLogin() {
  registerForm = document.getElementById('registerForm');
  loginForm = document.getElementById('loginForm');
  messageDiv = document.getElementById('message');
  welcomeDiv = document.getElementById('welcome');
  loginEmailInput = document.getElementById('loginEmail');
  saveEmailCheckbox = document.getElementById('saveEmail');

  if (registerForm) registerForm.addEventListener('submit', handleRegister);
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (loginForm) loadSavedEmail();
}


/// ==========================================================
/// ==========  Criar Mesa ==== ============================
/// ==========================================================


 function initMesaCreation() {
      const formMesa       = document.getElementById('form-criar-mesa');
      const nomeInput      = document.getElementById('nomeMesa');
      const descricaoInput = document.getElementById('descricao');
      const msgDiv         = document.getElementById('mensagemMesa');
      const listaMesas     = document.getElementById('listaMesas');
      const loadingDiv     = document.getElementById('loading');
      const emailUsuario   = localStorage.getItem('email');

      if (!emailUsuario) {
        msgDiv.innerHTML = '<span class="error">Usuário não autenticado.</span>';
        formMesa.querySelector('button').disabled = true;
        return;
      }

      formMesa.addEventListener('submit', function(e) {
        e.preventDefault();

        const nome = nomeInput.value.trim();
        const descricao = descricaoInput.value.trim();

        msgDiv.textContent = 'Carregando...';
        msgDiv.className = 'loading';
        loadingDiv.style.display = 'block';

        fetch(`${API_BASE}/criar_mesa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, descricao, criador_email: emailUsuario })
        })
        .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(({ status, body }) => {
          loadingDiv.style.display = 'none';
          if (status >= 200 && status < 300) {
            msgDiv.textContent = 'Mesa criada com sucesso!';
            msgDiv.className = 'success';
            formMesa.reset();
            if (typeof carregarMesas === 'function') carregarMesas();
          } else {
            msgDiv.textContent = body.error || 'Erro ao criar mesa.';
            msgDiv.className = 'error';
          }
        })
        .catch(error => {
          loadingDiv.style.display = 'none';
          msgDiv.textContent = 'Erro ao conectar com a API.';
          msgDiv.className = 'error';
        });
      });
    }

    document.addEventListener('DOMContentLoaded', () => {
      initRegisterLogin && initRegisterLogin();
      initMesaCreation();
    });



/// ==========================================================
/// ==========  Consultar Mesa ==== ============================
/// ==========================================================


async function consultarMesa(event) {
  event.preventDefault();
  const id = document.getElementById('mesaId').value.trim();
  const msgDiv = document.getElementById('mensagem');
  const resDiv = document.getElementById('resultado');

  msgDiv.textContent = '';
  resDiv.innerHTML = '';

  if (!id) {
    msgDiv.textContent = 'Por favor, informe o ID da mesa.';
    msgDiv.className = 'error';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/mesa/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();

    if (!response.ok) {
      msgDiv.textContent = data.error || 'Erro ao consultar mesa.';
      msgDiv.className = 'error';
      return;
    }

    if (data.personagens && data.personagens.length > 0) {
      let html = `<h2>Personagens da Mesa ${data.id_mesa}</h2>`;
      html += '<table><thead><tr>' +
              '<th>ID</th>' +
              '<th>Nome</th>' +
              '<th>Classe</th>' +
              '<th>Nível</th>' +
              '<th>Usuário</th>' +
              '</tr></thead><tbody>';
      data.personagens.forEach(p => {
        html += `<tr>
                  <td>${p.id_personagem}</td>
                  <td>${p.nome}</td>
                  <td>${p.classe}</td>
                  <td>${p.nivel}</td>
                  <td>${p.usuario_email}</td>
                </tr>`;
      });
      html += '</tbody></table>';
      resDiv.innerHTML = html;
      msgDiv.className = 'success';
    } else {
      msgDiv.textContent = 'Nenhum personagem encontrado para esta mesa.';
      msgDiv.className = 'success';
    }

  } catch (error) {
    msgDiv.textContent = 'Erro de conexão: ' + error.message;
    msgDiv.className = 'error';
  }
}


/// ==========================================================
/// ==========  MESA   - MESA DETALHADA ======================
/// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = 'https://137.131.168.114:8443';  // seu host+porta
  const form = document.getElementById('consultarMesaForm');
  const mensagemEl = document.getElementById('mensagem');
  const resultadoEl = document.getElementById('resultado');
  const buscarBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const mesaId = document.getElementById('mesaId').value.trim();
    if (!mesaId) return;

    mensagemEl.textContent = 'Carregando informações…';
    mensagemEl.style.color = 'var(--text-secondary)';
    resultadoEl.innerHTML = '';
    buscarBtn.disabled = true;

    try {
      console.log(`🛰️ Fazendo GET em ${API_BASE}/mesa/${mesaId}`);
      const response = await fetch(`${API_BASE}/mesa/${encodeURIComponent(mesaId)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors',            // se precisar
        // credentials: 'include' // se precisar enviar cookies
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

      if (Array.isArray(data.personagens) && data.personagens.length > 0) {
        const ul = document.createElement('ul');
        data.personagens.forEach(p => {
          const li = document.createElement('li');
          li.textContent = `ID: ${p.id_personagem} — ${p.nome} (Classe: ${p.classe}, Nível: ${p.nivel})`;
          ul.appendChild(li);
        });
        resultadoEl.appendChild(ul);
      } else {
        resultadoEl.textContent = 'Nenhum personagem associado a esta mesa.';
      }

    } catch (err) {
      console.error(err);
      mensagemEl.textContent = `❌ Erro ao consultar mesa: ${err.message}`;
      mensagemEl.style.color = '#e74c3c';
    } finally {
      buscarBtn.disabled = false;
    }
  });
});



/// ==========================================================
/// ==========  DELETAR MESA ==== ============================
/// ==========================================================



// === Função para carregar e exibir as mesas na tabela ===
async function carregarMesasParaDelecao() {
  const tbody = document.querySelector('#mesasTable tbody');
  const msg   = document.getElementById('message');
  tbody.innerHTML = '<tr><td colspan="4">Carregando mesas...</td></tr>';

  try {
    // Lista todas as mesas
    const res = await fetch(`${API_BASE}/mesas`, { method: 'GET' }); 
    
    const mesas = await res.json();

    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="4">Erro ao buscar mesas: ${res.status}</td></tr>`;
      return;
    }
    if (mesas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">Nenhuma mesa encontrada.</td></tr>';
      return;
    }

    // Preenche a tabela
    tbody.innerHTML = '';
    mesas.forEach(mesa => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${mesa.id_mesa}</td>
        <td>${mesa.nome}</td>
        <td>${mesa.descricao || '-'}</td>
        <td>
          <button class="delete" data-id="${mesa.id_mesa}">
            Excluir
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Liga os botões de exclusão
    tbody.querySelectorAll('button.delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        excluirMesa(id, btn);
      });
    });

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4">Erro de conexão: ${err.message}</td></tr>`;
  }
}

// === Função para deletar a mesa selecionada ===
async function excluirMesa(id, botao) {
  if (!confirm(`Tem certeza que deseja excluir a mesa #${id}?`)) return;

  botao.disabled    = true;
  botao.textContent = 'Excluindo...';

  try {
    const res = await fetch(`${API_BASE}/mesa/del/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      // Remove linha da tabela
      botao.closest('tr').remove();
      const msg = document.getElementById('message');
      msg.textContent = `Mesa #${id} excluída com sucesso.`;
      msg.style.color = 'green';
    } else {
      const data = await res.json();
      alert(`Erro ao excluir: ${data.error || res.status}`);
      botao.disabled    = false;
      botao.textContent = 'Excluir';
    }

  } catch (err) {
    alert(`Erro de conexão: ${err.message}`);
    botao.disabled    = false;
    botao.textContent = 'Excluir';
  }
}

// === Ao carregar a página, dispara a listagem ===
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('mesasTable')) {
    carregarMesasParaDelecao();
  }
});






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

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('novaSenha').value;

    if (!email || !senha) {
      mostrarMensagem('Preencha todos os campos.');
      return;
    }

    try {
      const resposta = await fetch(`${API_BASE}/usuario/update`, {
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

document.addEventListener('DOMContentLoaded', () => {
  inicializarAtualizacaoUsuario(API_BASE);
});




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
      const resposta = await fetch(`${API_BASE}/expulsar`, {
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
    const usuario_email = document.getElementById('usuario_email').value.trim();
    const id_mesa = parseInt(document.getElementById('id_mesa').value, 10);

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
    const email = document.getElementById('email').value;
    const id_mesa = parseInt(document.getElementById('id_mesa').value, 10);
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

document.addEventListener('DOMContentLoaded', async () => {
  // 🥇 1. Recuperar o e-mail salvo (via cookie ou localStorage)
  let email = localStorage.getItem('email');

  // Atualizar visualmente o email na página
  const spanUserEmail = document.getElementById('userEmail');
  if (email && spanUserEmail) {
    spanUserEmail.textContent = email;
  }

  // 🥈 2. Enviar requisição para o back-end
  if (!email) {
    document.getElementById('mensagem').textContent = 'Usuário não logado.';
    return;
  }

  try {
    const res = await fetch('https://137.131.168.114:8433/obter_mesa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    const lista = document.getElementById('listaMesas');
    const mensagem = document.getElementById('mensagem');

    if (res.ok) {
      mensagem.textContent = '';
      lista.innerHTML = '';

      data.forEach(mesa => {
        const div = document.createElement('div');
        div.innerHTML = `<h3>${mesa.nome}</h3><p>${mesa.descricao}</p>`;
        lista.appendChild(div);
      });

    } else {
      mensagem.textContent = data.message || data.error || 'Erro ao carregar mesas';
    }
  } catch (err) {
    document.getElementById('mensagem').textContent = 'Erro ao conectar com o servidor.';
    console.error(err);
  }
});





































