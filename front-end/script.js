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


/// ==========================================================
/// ==========  participante ==== ============================
/// ==========================================================


// === Participante: adicionar na API ===
function initAdicionarParticipante() {
  const form = document.getElementById('participanteForm');
  const idMesaInput = document.getElementById('idMesaInput');
  const msgDiv = document.getElementById('message');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    msgDiv.textContent = '';             // limpa mensagem anterior
    msgDiv.style.color = '';             // reseta cor

    const usuario_email = localStorage.getItem('email');
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
    const id_mesa = localStorage.getItem('mesaJogador');
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


