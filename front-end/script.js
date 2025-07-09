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


