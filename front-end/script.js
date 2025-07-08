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


document.addEventListener("DOMContentLoaded", () => {
  const email = localStorage.getItem("email");
  const userEmailSpan = document.getElementById("userEmail");
  const mensagemDiv = document.getElementById("mensagem");
  const listaMesasDiv = document.getElementById("listaMesas");
  const listaParticipanteDiv = document.getElementById("listaParticipante");

  if (!email) {
    mensagemDiv.textContent = "E-mail do usuário não encontrado.";
    return;
  }

  userEmailSpan.textContent = email;

  const criarCardMesa = (mesa, tipo) => {
    const card = document.createElement("div");
    card.style.border = "1px solid #ccc";
    card.style.borderRadius = "8px";
    card.style.padding = "1rem";
    card.style.marginBottom = "1rem";
    card.style.backgroundColor = "#fdfdfd";

    const titulo = document.createElement("h3");
    titulo.textContent = mesa.nome;

    const descricao = document.createElement("p");
    descricao.textContent = mesa.descricao || "";

    const id = document.createElement("p");
    id.innerHTML = `<strong>ID:</strong> ${mesa.id_mesa}`;

    const botaoIr = document.createElement("button");
    botaoIr.textContent = "Ir para a mesa";
    botaoIr.style.marginTop = "0.5rem";

    botaoIr.addEventListener("click", () => {
      if (tipo === "mestre") {
        localStorage.setItem("mesaMestre", mesa.id_mesa);
        window.location.href = "mesa_mestre.html";
      } else if (tipo === "participante") {
        localStorage.setItem("mesaJogador", mesa.id_mesa);
        window.location.href = "mesa_jogador.html";
      }
    });

    card.appendChild(titulo);
    card.appendChild(descricao);
    card.appendChild(id);
    card.appendChild(botaoIr);

    return card;
  };

  const listarMesas = async () => {
    mensagemDiv.textContent = "Carregando mesas...";

    try {
      const [resMestre, resParticipante] = await Promise.all([
        fetch("https://137.131.168.114:8443/obter_mesa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }),
        fetch("https://137.131.168.114:8443/listar_mesas_participante", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }),
      ]);

      let mesasMestre = [];
      if (resMestre.ok) {
        mesasMestre = await resMestre.json();
      } else if (resMestre.status === 404) {
        mesasMestre = [];
      } else {
        throw new Error("Erro ao carregar mesas como mestre");
      }

      let mesasParticipante = [];
      if (resParticipante.ok) {
        mesasParticipante = await resParticipante.json();
      } else if (resParticipante.status === 404) {
        mesasParticipante = [];
      } else {
        throw new Error("Erro ao carregar mesas como participante");
      }

      // Limpa mensagem de carregamento para não remover o elemento, só limpar texto
      mensagemDiv.textContent = "";

      // Limpa listas antes de preencher (importante para evitar duplicatas se listarMesas rodar novamente)
      listaMesasDiv.textContent = "";
      listaParticipanteDiv.textContent = "";

      if (mesasMestre.length === 0) {
        listaMesasDiv.textContent = "Nenhuma mesa como mestre encontrada.";
      } else {
        mesasMestre.forEach((mesa) => {
          listaMesasDiv.appendChild(criarCardMesa(mesa, "mestre"));
        });
      }

      if (mesasParticipante.length === 0) {
        listaParticipanteDiv.textContent = "Nenhuma mesa como participante encontrada.";
      } else {
        mesasParticipante.forEach((mesa) => {
          listaParticipanteDiv.appendChild(criarCardMesa(mesa, "participante"));
        });
      }
    } catch (error) {
      mensagemDiv.textContent = "Erro ao carregar mesas.";
      console.error(error);
    }
  };

  listarMesas();
});



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
  console.log("giovani");
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


