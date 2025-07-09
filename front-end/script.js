const API_BASE = 'https://137.131.168.114:8443';

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const messageEl = document.getElementById('message');
const welcomeEl = document.getElementById('welcome');
const saveEmailCheckbox = document.getElementById('saveEmail');
const loginEmailInput = document.getElementById('loginEmail');

// Preencher email salvo (se houver)
document.addEventListener('DOMContentLoaded', () => {
  const savedEmail = localStorage.getItem('email');
  if (savedEmail) {
    loginEmailInput.value = savedEmail;
    saveEmailCheckbox.checked = true;
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessages();

  const email = document.getElementById('regEmail').value.trim();
  const senha = document.getElementById('regSenha').value;

  try {
    const response = await fetch(`${API_BASE}/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('email', email);
      showSuccess(`Usuário cadastrado com sucesso!`);
    } else {
      showError(data.error || 'Erro no cadastro.');
    }
  } catch (error) {
    showError('Erro de conexão com o servidor.');
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessages();

  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;

  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const data = await response.json();

    if (response.ok) {
      if (saveEmailCheckbox.checked) {
        localStorage.setItem('email', email);
      } else {
        localStorage.removeItem('email');
      }

      welcomeEl.style.display = 'block';
      welcomeEl.textContent = `Bem-vindo(a), ${email}!`;
    } else {
      showError(data.error || 'Erro no login.');
    }
  } catch (error) {
    showError('Erro de conexão com o servidor.');
  }
});

// Utilitários de UI
function showError(msg) {
  messageEl.textContent = msg;
  messageEl.style.color = 'red';
}

function showSuccess(msg) {
  messageEl.textContent = msg;
  messageEl.style.color = 'green';
}

function clearMessages() {
  messageEl.textContent = '';
  welcomeEl.style.display = 'none';
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






