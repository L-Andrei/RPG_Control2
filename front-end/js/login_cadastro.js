// Função auxiliar para definir cookie
function setCookie(nome, valor, dias) {
    const d = new Date();
    d.setTime(d.getTime() + (dias * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = nome + "=" + encodeURIComponent(valor) + ";" + expires + ";path=/";
}

// Mostrar alerta de cookies se ainda não aceito
function verificarCookies() {
    if (!document.cookie.includes("cookies_aceitos=true")) {
        const alerta = document.createElement("div");
        alerta.innerHTML = `
            <div style="position: fixed; bottom: 0; left: 0; right: 0; background: #eee; padding: 15px; border-top: 1px solid #ccc; text-align: center;">
                Este site usa cookies para melhorar sua experiência. <button id="aceitarCookies">Aceitar</button>
            </div>
        `;
        document.body.appendChild(alerta);
        document.getElementById('aceitarCookies').addEventListener('click', function () {
            setCookie("cookies_aceitos", "true", 365);
            alerta.remove();
        });
    }
}

document.addEventListener('DOMContentLoaded', function () {
    verificarCookies();

    document.getElementById('formCadastro')?.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = this.email.value;
        const senha = this.senha.value;

        fetch('https://137.131.168.114:8433/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        })
        .then(res => res.json())
        .then(data => {
            document.getElementById('respostaCadastro').textContent = data.message || data.error;
            if (data.message) {
                setCookie("usuario_email", email, 30);
            }
            window.location.href = '/profil.html';
        });
    });

    document.getElementById('formLogin')?.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = this.email.value;
        const senha = this.senha.value;

        fetch('https://137.131.168.144:8433/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        })
        .then(res => res.json())
        .then(data => {
            document.getElementById('respostaLogin').textContent = data.message || data.error;
            if (data.message) {
                setCookie("usuario_email", email, 30);
            }
            window.location.href = '/profile.html';
        });
    });
});
